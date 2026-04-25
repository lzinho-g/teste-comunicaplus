import React, { useEffect } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { useProblems } from "./src/state/useProblems";
import { useAuth } from "./src/state/useAuth";
import { StatusBar, View, ActivityIndicator, Text } from "react-native";
import { theme } from "./src/theme/theme";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import IntroScreen from "./src/screens/IntroScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const navDark: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
    notification: theme.colors.primary,
  },
};

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        style={{
          marginTop: 10,
          color: theme.colors.textMuted,
          fontWeight: "600",
        }}
      >
        Carregando...
      </Text>
    </View>
  );
}

// Navegação somente do login/cadastro
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const loadProblems = useProblems((s) => s.load);
  const startRemoteListener = useProblems((s) => s.startRemoteListener);
  const problemsReady = useProblems((s) => s.loaded);
  const {
    load: loadAuth,
    initialized,
    loggedIn,
    firstLoginCompleted,
  } = useAuth();

  useEffect(() => {
    loadProblems();
    loadAuth();

    const unsubscribe = startRemoteListener();

    return () => {
      unsubscribe();
    };
  }, [loadProblems, loadAuth, startRemoteListener]);

  const ready = initialized; // useAuth carregou

  if (!ready || !problemsReady) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={navDark}>
          {/* Escolha da tela inicial */}
          {!loggedIn ? (
            <AuthStack />
          ) : !firstLoginCompleted ? (
            <IntroScreen />
          ) : (
            <RootNavigator />
          )}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}
