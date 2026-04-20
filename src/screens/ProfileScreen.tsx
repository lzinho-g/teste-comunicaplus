import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../state/useAuth";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { theme } from "../theme/theme";

/* ---------- HELPERS ---------- */

// apenas letras e espaços (se quiser usar em algum lugar)
function onlyLetters(text: string) {
  return text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, "");
}

// máscara de CPF para exibição/digitação
function cpfMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

// máscara de telefone (DD + número)
function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// validação simples de e-mail
function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

/* -------------------------------- */

export default function ProfileScreen() {
  const { user, logout, deleteAccount, updateProfile, updatePhoto } = useAuth();

  const firstLetter =
    user?.name && user.name.length > 0 ? user.name[0].toUpperCase() : "?";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // photoUri agora vem do usuário persistido em useAuth

  // 🔹 MODO EDIÇÃO
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [cpf, setCpf] = useState(user?.cpf ? cpfMask(user.cpf) : "");
  const [phone, setPhone] = useState(user?.phone ? phoneMask(user.phone) : "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  function startEdit() {
    setName(user?.name ?? "");
    setCpf(user?.cpf ? cpfMask(user.cpf) : "");
    setPhone(user?.phone ? phoneMask(user.phone) : "");
    setAddress(user?.address ?? "");
    setEmail(user?.email ?? "");
    setEditing(true);
  }

  function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Excluir conta",
      "Tem certeza que deseja excluir sua conta deste aparelho?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteAccount();
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert("Sair", "Deseja realmente sair do Comunica+?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  // 🔹 SALVAR EDIÇÃO COM VALIDAÇÃO + REMOVER MÁSCARAS
  async function handleSaveEdit() {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !cpf || !phone || !trimmedAddress || !trimmedEmail) {
      return Alert.alert("Atenção", "Preencha todos os campos.");
    }

    // Nome: apenas letras e espaços
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(trimmedName) || trimmedName.length < 3) {
      return Alert.alert(
        "Nome inválido",
        "Use apenas letras e espaços (mínimo 3 caracteres)."
      );
    }

    // remove formatação do CPF
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return Alert.alert(
        "CPF inválido",
        "Informe um CPF com exatamente 11 números."
      );
    }

    // remove formatação do telefone
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return Alert.alert(
        "Telefone inválido",
        "Informe um telefone com DDD (10 ou 11 dígitos)."
      );
    }

    // e-mail
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("E-mail inválido", "Informe um e-mail válido.");
    }

    try {
      await updateProfile({
        name: trimmedName,
        cpf: cpfDigits,
        phone: phoneDigits,
        address: trimmedAddress,
        email: trimmedEmail,
      });

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setEditing(false);
    } catch (e: any) {
      Alert.alert(
        "Erro",
        e?.message ?? "Não foi possível atualizar seu perfil."
      );
    }
  }

  function handleCancelEdit() {
    setEditing(false);
  }

  // 🔹 TROCAR FOTO DE PERFIL
  async function handleChangePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão necessária",
        "Ative o acesso à galeria para trocar a foto de perfil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await updatePhoto(uri);
    }
  }

  // 🔹 SE ESTÁ EM MODO EDIÇÃO, MOSTRA A "TELA" DE EDIÇÃO
  if (editing) {
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
              contentContainerStyle={styles.editContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.editTitle}>Editar perfil</Text>
              <Text style={styles.editSubtitle}>
                Atualize seus dados pessoais abaixo.
              </Text>

              {/* NOME */}
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(txt) => setName(onlyLetters(txt))}
                placeholder="Seu nome"
                placeholderTextColor={theme.colors.textMuted}
              />

              {/* CPF */}
              <Text style={[styles.label, { marginTop: 14 }]}>CPF</Text>
              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(txt) => setCpf(cpfMask(txt))}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={14}
              />

              {/* TELEFONE */}
              <Text style={[styles.label, { marginTop: 14 }]}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(txt) => setPhone(phoneMask(txt))}
                placeholder="(47) 99999-9999"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={15}
              />

              {/* ENDEREÇO */}
              <Text style={[styles.label, { marginTop: 14 }]}>Endereço</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Rua, número, bairro, cidade"
                placeholderTextColor={theme.colors.textMuted}
              />

              {/* E-MAIL */}
              <Text style={[styles.label, { marginTop: 14 }]}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(txt) => setEmail(txt.trim().toLowerCase())}
                placeholder="seuemail@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.textMuted}
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

              <View style={styles.editButtonsRow}>
                <Pressable
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.btnPrimaryText}>Salvar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // 🔹 MODO NORMAL (visualização do perfil)
  const formattedCpf = user?.cpf ? cpfMask(user.cpf) : "—";
  const formattedPhone = user?.phone ? phoneMask(user.phone) : "—";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{firstLetter}</Text>
            )}
          </View>

          {/* Botão de câmera para trocar foto */}
          <Pressable
            accessibilityLabel="Trocar foto de perfil"
            style={styles.cameraBadge}
            onPress={handleChangePhoto}
          >
            <Icon name="camera" size={18} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.userName}>{user?.name ?? "Usuário"}</Text>
        {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* MEUS DADOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meus dados</Text>

          <View style={styles.infoCard}>
            <InfoRow label="CPF" value={formattedCpf} />
            <InfoRow label="Telefone" value={formattedPhone} />
            <InfoRow label="Endereço" value={user?.address ?? "—"} last />
          </View>
        </View>

        {/* CONFIGURAÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.menuCard}>
            <OptionItem
              title="Editar perfil"
              subtitle="Alterar nome, CPF, telefone e endereço"
              onPress={startEdit}
            />

            <OptionItem
              title="Notificações"
              subtitle={
                notificationsEnabled
                  ? "Notificações ativadas"
                  : "Notificações desativadas"
              }
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  thumbColor="#fff"
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                />
              }
            />

            <OptionItem
              title="Excluir minha conta"
              subtitle="Remover dados deste aparelho"
              onPress={handleDeleteAccount}
              danger
            />

            <OptionItem
              title="Sair"
              subtitle="Encerrar sessão no Comunica+"
              onPress={handleLogout}
              danger
              last
            />
          </View>
        </View>

        <Text style={styles.footerText}>
          Os dados deste protótipo ficam salvos apenas neste aparelho usando
          armazenamento local.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- COMPONENTES AUXILIARES ---------- */

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

function InfoRow({ label, value, last }: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        last && { borderBottomWidth: 0, paddingBottom: 0 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

type OptionProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  rightElement?: React.ReactNode;
};

function OptionItem({
  title,
  subtitle,
  onPress,
  danger,
  last,
  rightElement,
}: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[
        styles.option,
        last && { borderBottomWidth: 0, paddingBottom: 10 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.optionTitle,
            danger && { color: theme.colors.danger },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      {rightElement && <View style={{ marginLeft: 12 }}>{rightElement}</View>}
    </Pressable>
  );
}

/* ---------- ESTILOS ---------- */

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  headerTopRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.card,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  cameraBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  userName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  userEmail: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40, // mais espaço pra não “cortar” perto da barra
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  menuCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  optionSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  footerText: {
    marginTop: 4,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: "center",
  },

  /* edição */
  editContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  editSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 16,
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
  editButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  btnSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
});
