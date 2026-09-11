import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { useAuth } from "@/core/auth/auth-context";

import { useGetMyProfileQuery } from "@/features/profile/api/profileApi";

import SafeScreen from "@/components/layout/SafeScreen";

/* ============================================================
   CORES
============================================================ */

const COLORS = {
  primary: "#B55A91",

  primaryDark: "#93436F",

  primaryLight: "#FCECF4",

  background: "#FCFAFD",

  white: "#FFFFFF",

  text: "#2E2430",

  textSecondary: "#7B7280",

  textMuted: "#A59BA6",

  border: "#EEE5EC",

  success: "#2E9B62",

  successLight: "#EAF8F0",
};

/* ============================================================
   HELPERS
============================================================ */

function formatPhone(phone?: string | null) {
  if (!phone) {
    return "Não informado";
  }

  const numbers = phone.replace(/\D/g, "");

  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      7,
    )}-${numbers.slice(7)}`;
  }

  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      6,
    )}-${numbers.slice(6)}`;
  }

  return phone;
}

function formatBirthDate(date?: string | null) {
  if (!date) {
    return "Não informado";
  }

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;

    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  return parsed.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function formatGender(gender?: string | null) {
  switch (gender) {
    case "MALE":
      return "Masculino";

    case "FEMALE":
      return "Feminino";

    case "OTHER":
      return "Outro";

    case "NOT_INFORMED":
      return "Prefiro não informar";

    default:
      return "Não informado";
  }
}

/* ============================================================
   SCREEN
============================================================ */

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  async function handleLogout() {
    try {
      await signOut();

      router.replace("/login");
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    }
  }

  const {
    data: profile,

    isLoading,

    isFetching,

    isError,

    refetch,
  } = useGetMyProfileQuery(user?.email ?? "", {
    skip: !user?.email,
  });

  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {
    return (
      <SafeScreen style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Carregando seu perfil...</Text>
        </View>
      </SafeScreen>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (isError) {
    return (
      <SafeScreen style={styles.screen}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.errorTitle}>
            Não foi possível carregar seu perfil
          </Text>

          <Text style={styles.errorText}>
            Verifique sua conexão e tente novamente.
          </Text>

          <Pressable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  /* ============================================================
     DADOS
  ============================================================ */

  const profileUser = profile?.user;

  const name = profileUser?.name ?? user?.name ?? "Usuário";

  const email = profileUser?.email ?? user?.email ?? "";

  const phone = profileUser?.phone;

  const birthDate = profileUser?.birthDate;

  const gender = profileUser?.gender;

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item.charAt(0))
      .join("")
      .toUpperCase() || "U";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={21} color={COLORS.text} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>Meu perfil</Text>

              <Text style={styles.subtitle}>Gerencie seus dados pessoais.</Text>
            </View>

            <Pressable
              onPress={() => router.push("/editProfile")}
              style={({ pressed }) => [
                styles.editHeaderButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={COLORS.primary}
              />

              <Text style={styles.editHeaderText}>Editar</Text>
            </Pressable>
          </View>

          {/* ==================================================
              PROFILE CARD
          ================================================== */}

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.profileMain}>
              <Text style={styles.profileName}>{name}</Text>

              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>

          {/* ==================================================
              DADOS PESSOAIS
          ================================================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>

            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Nome" value={name} />

              <InfoRow icon="mail-outline" label="E-mail" value={email} />

              <InfoRow
                icon="call-outline"
                label="Telefone"
                value={formatPhone(phone)}
              />

              <InfoRow
                icon="calendar-outline"
                label="Data de nascimento"
                value={formatBirthDate(birthDate)}
              />

              <InfoRow
                icon="people-outline"
                label="Gênero"
                value={formatGender(gender)}
                last
              />
            </View>
          </View>

          {/* ==================================================
              PREFERÊNCIAS
          ================================================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferências</Text>

            <View style={styles.card}>
              <InfoRow
                icon="heart-outline"
                label="Preferências"
                value={profile?.preferences ?? "Nenhuma preferência informada"}
              />

              <InfoRow
                icon="warning-outline"
                label="Alergias"
                value={profile?.allergies ?? "Nenhuma alergia informada"}
              />

              <InfoRow
                icon="logo-instagram"
                label="Instagram"
                value={profile?.instagram ?? "Não informado"}
                last
              />
            </View>
          </View>

          {/* ==================================================
              OBSERVAÇÕES
          ================================================== */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>

            <View style={styles.notesCard}>
              <View style={styles.notesIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.notesContent}>
                <Text style={styles.notesTitle}>
                  Informações para seus atendimentos
                </Text>

                <Text style={styles.notesText}>
                  {profile?.observations ??
                    "Você ainda não adicionou nenhuma observação."}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />

            <Text style={styles.logoutText}>Sair da conta</Text>
          </Pressable>

          {/* ==================================================
              ATUALIZAÇÃO
          ================================================== */}

          {isFetching && (
            <View style={styles.refreshing}>
              <ActivityIndicator size="small" color={COLORS.primary} />

              <Text style={styles.refreshingText}>Atualizando...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;

  label: string;

  value: string;

  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={COLORS.primary} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },

  container: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 26,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 22,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  editHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },

  editHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  avatarText: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.primary,
  },

  profileMain: {
    flex: 1,
  },

  profileName: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },

  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },

  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  verifiedTextSuccess: {
    color: COLORS.success,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 11,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 74,
    paddingHorizontal: 16,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  notesCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },

  notesIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  notesContent: {
    flex: 1,
  },

  notesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  notesText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  editButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  editButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  logoutButton: {
    height: 50,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 4,
    marginBottom: 10,
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.72,
  },

  refreshing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
  },

  refreshingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
