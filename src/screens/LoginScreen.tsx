import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../state/useAuth";
import { theme } from "../theme/theme";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, user } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return Alert.alert("Atenção", "Preencha e-mail e senha.");
    }

    setLoading(true);
    const ok = await login(trimmedEmail, trimmedPassword);
    setLoading(false);

    if (!ok) {
      return Alert.alert("Erro", "E-mail ou senha inválidos.");
    }

    // Se o login der certo, o App vai decidir se mostra instruções ou o app principal.
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Logo / título */}
          <View style={styles.header}>
            <View style={styles.dot} />
            <Text style={styles.brand}>Comunica+</Text>
          </View>

          <Text style={styles.subtitle}>
            Entre para acompanhar e registrar problemas na sua cidade.
          </Text>

          {/* E-mail */}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          {/* Senha */}
          <Text style={[styles.label, { marginTop: 14 }]}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            onChangeText={setPassword}
          />

          {/* Botão Entrar */}
          <Pressable
            style={[styles.btn, styles.btnPrimary, { marginTop: 20 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </Pressable>

          {/* Link para cadastro */}
          <Pressable
            style={{ marginTop: 18 }}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.link}>
              Não tem conta?{" "}
              <Text style={styles.linkStrong}>Criar cadastro</Text>
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius,
    marginTop: 6,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: theme.radius,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
  },
  link: {
    textAlign: "center",
    color: theme.colors.textMuted,
  },
  linkStrong: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
//teste