import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/theme";
import { useAuth } from "../state/useAuth";

/* ---------- HELPERS (mesmos do perfil) ---------- */

function onlyLetters(text: string) {
  return text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "");
}

function cpfMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

function hasLetterAndNumber(password: string) {
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

/* ------------------------------------------------ */

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleRegister() {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirm.trim();

    if (
      !trimmedName ||
      !cpf ||
      !phone ||
      !trimmedAddress ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirm
    ) {
      return Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
    }

    // Nome: apenas letras e espaços
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(trimmedName) || trimmedName.length < 3) {
      return Alert.alert(
        "Nome inválido",
        "Use apenas letras e espaços (mínimo 3 caracteres)."
      );
    }

    // CPF: limpa máscara e valida 11 dígitos
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return Alert.alert(
        "CPF inválido",
        "O CPF deve conter exatamente 11 dígitos numéricos."
      );
    }

    // Telefone: limpa máscara e valida 10 ou 11 dígitos
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return Alert.alert(
        "Telefone inválido",
        "Informe um telefone com DDD (10 ou 11 dígitos)."
      );
    }

    // E-mail
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("E-mail inválido", "Informe um e-mail válido.");
    }

    // Regras de senha
    if (trimmedPassword.length < 6) {
      return Alert.alert(
        "Senha muito curta",
        "A senha deve ter pelo menos 6 caracteres."
      );
    }

    if (!hasLetterAndNumber(trimmedPassword)) {
      return Alert.alert(
        "Senha fraca",
        "Use letras e números na senha para deixá-la mais forte."
      );
    }

    if (trimmedPassword !== trimmedConfirm) {
      return Alert.alert("Atenção", "As senhas não conferem.");
    }

    try {
      await register({
        name: trimmedName,
        cpf: cpfDigits,
        phone: phoneDigits,
        address: trimmedAddress,
        email: trimmedEmail,
        password: trimmedPassword,
      });

      navigation.navigate("Login");
    } catch (e: any) {
      Alert.alert(
        "Erro",
        e?.message ?? "Não foi possível criar sua conta."
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* TÍTULO */}
            <Text style={styles.title}>Criar cadastro</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para começar a usar o Comunica+.
            </Text>

            {/* NOME */}
            <Text style={styles.label}>
              Nome completo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={(txt) => setName(onlyLetters(txt))}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
            />

            {/* CPF */}
            <Text style={styles.label}>
              CPF <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={theme.colors.textMuted}
              value={cpf}
              onChangeText={(txt) => setCpf(cpfMask(txt))}
              keyboardType="numeric"
              returnKeyType="next"
              maxLength={14} // com máscara
            />

            {/* TELEFONE */}
            <Text style={styles.label}>
              Telefone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="(47) 99999-9999"
              placeholderTextColor={theme.colors.textMuted}
              value={phone}
              onChangeText={(txt) => setPhone(phoneMask(txt))}
              keyboardType="phone-pad"
              returnKeyType="next"
              maxLength={15} // com máscara
            />

            {/* ENDEREÇO */}
            <Text style={styles.label}>
              Endereço <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número, bairro, cidade"
              placeholderTextColor={theme.colors.textMuted}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
              maxLength={120}
            />

            {/* EMAIL */}
            <Text style={styles.label}>
              E-mail <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={(txt) => setEmail(txt.trim().toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              maxLength={80}
            />
            {email.length > 0 && !isValidEmail(email) && (
              <Text
                style={{
                  color: theme.colors.danger,
                  marginTop: 4,
                  fontSize: 12,
                }}
              >
                E-mail inválido
              </Text>
            )}

            {/* SENHA */}
            <Text style={styles.label}>
              Senha <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres, letras e números"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={password}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              onChangeText={setPassword}
              returnKeyType="next"
              maxLength={64}
            />

            {/* CONFIRMAR SENHA */}
            <Text style={styles.label}>
              Confirmar senha <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Repita a senha"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              maxLength={64}
            />

            {/* BOTÃO CRIAR CONTA */}
            <Pressable style={styles.primaryBtn} onPress={handleRegister}>
              <Text style={styles.primaryBtnText}>Criar conta</Text>
            </Pressable>

            {/* LINK "JÁ TEM CONTA?" */}
            <Pressable
              style={styles.bottomLinkWrapper}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.bottomLinkText}>
                Já tem conta?{" "}
                <Text style={styles.bottomLinkHighlight}>Entrar</Text>
              </Text>
            </Pressable>

            <View style={{ height: 24 }} />

            <Text style={styles.requiredInfo}>* Campos obrigatórios</Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  required: {
    color: theme.colors.danger,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
  },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomLinkWrapper: {
    marginTop: 18,
    alignItems: "center",
  },
  bottomLinkText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  bottomLinkHighlight: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  requiredInfo: {
    textAlign: "center",
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
