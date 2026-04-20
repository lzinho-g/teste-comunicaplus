import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useAuth } from "../state/useAuth";
import { theme } from "../theme/theme";

export default function IntroScreen() {
  const { completeFirstLogin, user } = useAuth();

  function handleStart() {
    completeFirstLogin();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.brand}>Comunica+</Text>
        </View>

        <Text style={styles.hello}>
          Olá{user?.name ? `, ${user.name}` : ""}! 👋
        </Text>

        <Text style={styles.title}>Como funciona o Comunica+</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Registre um problema</Text>
          <Text style={styles.cardText}>
            Na aba <Text style={styles.highlight}>Novo</Text>, você informa título,
            categoria, cidade, bairro, descrição, localização no mapa e pode tirar
            uma foto. O problema fica salvo no seu aparelho.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Veja o que está acontecendo</Text>
          <Text style={styles.cardText}>
            Na aba <Text style={styles.highlight}>Feed</Text>, você acompanha a lista
            de problemas registrados, com descrição, foto, votos e status.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Mapa da cidade</Text>
          <Text style={styles.cardText}>
            Na aba <Text style={styles.highlight}>Mapa</Text>, você visualiza todos os
            problemas como pinos no mapa. Dá pra tocar em um pino pra ver o resumo
            e votar.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Perfil e configurações</Text>
          <Text style={styles.cardText}>
            Na aba <Text style={styles.highlight}>Perfil</Text>, você verá os dados
            da sua conta e, futuramente, poderá ajustar preferências do aplicativo.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Esse é um protótipo local: os dados ficam salvos apenas no seu aparelho,
          usando armazenamento interno.
        </Text>

        <Pressable style={styles.btn} onPress={handleStart}>
          <Text style={styles.btnText}>Começar a usar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  hello: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  highlight: {
    fontWeight: "800",
    color: theme.colors.primary,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
    marginBottom: 18,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
//teste