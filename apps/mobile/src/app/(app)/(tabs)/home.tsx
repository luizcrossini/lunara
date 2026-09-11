import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "@/core/auth/auth-context";
import { baseApi } from "@/core/api/baseApi";

const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomeCustomers: builder.query<any, string>({
      query: (email) => ({
        url: "/customers",
        params: {
          search: email,
          page: 1,
          limit: 100,
        },
      }),
    }),

    getHomeAppointments: builder.query<any, string>({
      query: (customerId) => ({
        url: "/appointment-orders",
        params: {
          customerId,
          page: 1,
          limit: 100,
        },
      }),
    }),
  }),
  overrideExisting: false,
});

const LUNARA_COLORS = {
  primary: "#B55A91",
  primaryDark: "#93436F",
  primaryLight: "#FCECF4",

  background: "#FCFAFD",
  white: "#FFFFFF",

  text: "#2E2430",
  textSecondary: "#7B7280",
  textMuted: "#A59BA6",

  border: "#EEE5EC",
};

export default function HomeScreen() {
  const router = useRouter();

  const { user, signOut } = useAuth();

  const { data: customersResponse, isLoading: customersLoading } =
    homeApi.useGetHomeCustomersQuery(user?.email ?? "", {
      skip: !user?.email,
    });

  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : (customersResponse?.data?.items ??
      customersResponse?.data ??
      customersResponse?.items ??
      []);

  const customerProfile = customers.find(
    (customer: any) =>
      customer?.user?.id === user?.id || customer?.userId === user?.id,
  );

  const customerId = customerProfile?.id;

  const { data: appointmentsResponse, isLoading: appointmentsLoading } =
    homeApi.useGetHomeAppointmentsQuery(customerId ?? "", {
      skip: !customerId,
    });

  const appointments = Array.isArray(appointmentsResponse)
    ? appointmentsResponse
    : (appointmentsResponse?.data?.items ??
      appointmentsResponse?.data ??
      appointmentsResponse?.items ??
      []);

  const nextAppointment = appointments
    .filter((appointment: any) => {
      const date = new Date(
        appointment?.items?.[0]?.startsAt ?? appointment?.scheduledDate,
      );

      const status = appointment?.status;

      return (
        !Number.isNaN(date.getTime()) &&
        date.getTime() >= Date.now() &&
        !["CANCELLED", "COMPLETED"].includes(status)
      );
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(
        a?.items?.[0]?.startsAt ?? a?.scheduledDate,
      ).getTime();

      const dateB = new Date(
        b?.items?.[0]?.startsAt ?? b?.scheduledDate,
      ).getTime();

      return dateA - dateB;
    })[0];

  const nextAppointmentItem = nextAppointment?.items?.[0];

  const nextAppointmentDate = nextAppointmentItem?.startsAt
    ? new Date(nextAppointmentItem.startsAt)
    : nextAppointment?.scheduledDate
      ? new Date(nextAppointment.scheduledDate)
      : null;

  const nextAppointmentEnd = nextAppointmentItem?.endsAt
    ? new Date(nextAppointmentItem.endsAt)
    : null;

  const appointmentService =
    nextAppointmentItem?.professionalService?.service?.name ?? "Serviço";

  const appointmentProfessional =
    nextAppointmentItem?.professionalService?.professional?.user?.name ??
    "Profissional";

  const appointmentBranch = nextAppointment?.branch?.name ?? "Unidade";

  const appointmentLoading = customersLoading || appointmentsLoading;

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDesktop = width >= 768;
  const isSmallMobile = width < 380;

  const firstName = user?.name?.split(" ")[0] ?? "Usuário";

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  async function handleLogout() {
    await signOut();

    router.replace("/login");
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.screen}>
        {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

        {isDesktop && (
          <View style={styles.sidebar}>
            {/* BRAND */}

            <View style={styles.brandContainer}>
              <View style={styles.logoImageContainer}>
                <Image
                  source={require("../../../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.brandSubtitle}>Simplificando momentos</Text>
            </View>

            {/* NAVIGATION */}

            <View style={styles.navigation}>
              <SidebarItem icon="home-outline" label="Início" active />

              <SidebarItem
                icon="time-outline"
                label="Meus agendamentos"
                onPress={() => router.push("/my-appointments")}
              />

              <SidebarItem
                icon="person-outline"
                label="Meu perfil"
                onPress={() => router.push("/profile")}
              />
            </View>

            {/* LOGOUT */}

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={19}
                color={LUNARA_COLORS.primary}
              />

              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
          </View>
        )}

        {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

        <View style={styles.mainArea}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              !isDesktop && { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[styles.container, isDesktop && styles.containerDesktop]}
            >
              {/* =====================================================
                HEADER
            ===================================================== */}

              <View style={styles.header}>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcome}>Olá, {firstName} 👋</Text>

                  <Text style={styles.subtitle}>
                    Bem-vindo(a) à sua experiência Lunara.
                  </Text>
                </View>

                {/* USER AREA */}
                {/* 
                {isDesktop ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.userProfile,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{userInitial}</Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text numberOfLines={1} style={styles.userName}>
                        {user?.name}
                      </Text>

                      <Text numberOfLines={1} style={styles.userEmail}>
                        {user?.email}
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable style={styles.notificationButton}>
                    <Ionicons
                      name="notifications-outline"
                      size={24}
                      color={LUNARA_COLORS.text}
                    />

                    <View style={styles.notificationBadge} />
                  </Pressable>
                )} */}
              </View>

              {/* =====================================================
                HERO
            ===================================================== */}

              <View style={styles.heroCard}>
                <Image
                  source={require("../../../../assets/images/salon-hero.png")}
                  style={[
                    styles.heroImage,
                    !isDesktop && styles.heroImageMobile,
                  ]}
                  resizeMode="cover"
                />

                {/* Degradê sobre a imagem */}
                <LinearGradient
                  colors={[
                    "#FFF4F9",
                    "rgba(255, 244, 249, 0.98)",
                    "rgba(255, 244, 249, 0.75)",
                    "rgba(255, 244, 249, 0)",
                  ]}
                  locations={[0, 0.42, 0.62, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroGradient}
                />

                <View
                  style={[
                    styles.heroContent,
                    !isDesktop && styles.heroContentMobile,
                    isSmallMobile && styles.heroContentSmallMobile,
                  ]}
                >
                  <Text
                    style={[
                      styles.heroTitle,
                      !isDesktop && styles.heroTitleMobile,
                    ]}
                  >
                    Sua beleza, seu momento ✨
                  </Text>

                  <Text
                    style={[
                      styles.heroText,
                      !isDesktop && styles.heroTextMobile,
                    ]}
                  >
                    Agende serviços, acompanhe seus horários{"\n"}e viva sua
                    melhor experiência.
                  </Text>

                  <Pressable
                    onPress={() => router.push("/booking")}
                    style={({ pressed }) => [
                      styles.heroButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.heroButtonText}>Novo agendamento</Text>

                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              {/* =====================================================
                PRÓXIMO AGENDAMENTO
            ===================================================== */}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Próximo agendamento</Text>

                  <Pressable onPress={() => router.push("/my-appointments")}>
                    <Text style={styles.seeAll}>Ver todos</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => router.push("/my-appointments")}
                  style={({ pressed }) => [
                    nextAppointment
                      ? styles.nextAppointment
                      : styles.emptyAppointment,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {appointmentLoading ? (
                    <>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={32}
                          color={LUNARA_COLORS.primary}
                        />
                      </View>

                      <View style={styles.emptyContent}>
                        <Text style={styles.emptyTitle}>
                          Carregando agendamentos...
                        </Text>

                        <Text style={styles.emptyText}>
                          Buscando seus próximos horários.
                        </Text>
                      </View>

                      <ActivityIndicator color={LUNARA_COLORS.primary} />
                    </>
                  ) : nextAppointment ? (
                    <>
                      <View style={styles.nextAppointmentIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={30}
                          color={LUNARA_COLORS.primary}
                        />
                      </View>

                      <View style={styles.nextAppointmentContent}>
                        <Text
                          numberOfLines={1}
                          style={styles.nextAppointmentService}
                        >
                          {appointmentService}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={styles.nextAppointmentProfessional}
                        >
                          com {appointmentProfessional}
                        </Text>

                        {nextAppointmentDate && (
                          <Text style={styles.nextAppointmentDate}>
                            {nextAppointmentDate.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}{" "}
                            •{" "}
                            {nextAppointmentDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {nextAppointmentEnd
                              ? ` - ${nextAppointmentEnd.toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}`
                              : ""}
                          </Text>
                        )}

                        <Text
                          numberOfLines={1}
                          style={styles.nextAppointmentBranch}
                        >
                          {appointmentBranch}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={LUNARA_COLORS.textMuted}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={32}
                          color={LUNARA_COLORS.primary}
                        />
                      </View>

                      <View style={styles.emptyContent}>
                        <Text style={styles.emptyTitle}>
                          Nenhum agendamento próximo
                        </Text>

                        <Text style={styles.emptyText}>
                          Quando você fizer um agendamento, ele aparecerá aqui.
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={LUNARA_COLORS.textMuted}
                      />
                    </>
                  )}
                </Pressable>
              </View>

              {/* =====================================================
                AÇÕES ESSENCIAIS
            ===================================================== */}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Acesso rápido</Text>

                <View
                  style={[
                    styles.quickActions,
                    isDesktop && styles.quickActionsDesktop,
                  ]}
                >
                  <QuickAction
                    icon="calendar-outline"
                    title="Novo agendamento"
                    subtitle="Escolha serviço e horário"
                    onPress={() => router.push("/booking")}
                  />

                  <QuickAction
                    icon="time-outline"
                    title="Meus agendamentos"
                    subtitle="Veja próximos e histórico"
                    onPress={() => router.push("/my-appointments")}
                  />

                  <QuickAction
                    icon="person-outline"
                    title="Meu perfil"
                    subtitle="Atualize seus dados"
                    onPress={() => router.push("/profile")}
                  />
                </View>
              </View>

              <View style={{ height: 30 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

type SidebarItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

function SidebarItem({
  icon,
  label,
  active = false,
  onPress,
}: SidebarItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sidebarItem,
        active && styles.sidebarItemActive,
        pressed && styles.cardPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? LUNARA_COLORS.primary : LUNARA_COLORS.textSecondary}
      />

      <Text
        style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function QuickAction({ icon, title, subtitle, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={25} color={LUNARA_COLORS.primary} />
      </View>

      <Text style={styles.quickActionTitle}>{title}</Text>

      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

/* =========================================================
   RECOMMENDATION CARD
========================================================= */

type RecommendationCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

function RecommendationCard({
  icon,
  title,
  description,
}: RecommendationCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.recommendationCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.recommendationIcon}>
        <Ionicons name={icon} size={28} color={LUNARA_COLORS.primary} />
      </View>

      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationTitle}>{title}</Text>

        <Text style={styles.recommendationDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#B5ABB5" />
    </Pressable>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LUNARA_COLORS.background,
  },

  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: LUNARA_COLORS.background,
  },

  /* =========================
     SIDEBAR
  ========================= */

  sidebar: {
    width: 250,

    backgroundColor: "#FFFFFF",

    borderRightWidth: 1,
    borderRightColor: LUNARA_COLORS.border,

    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 22,
  },

  brandContainer: {
    alignItems: "center",

    paddingBottom: 30,

    borderBottomWidth: 1,
    borderBottomColor: "#F3EDF2",

    marginBottom: 24,
  },

  logoImageContainer: {
    width: 200,
    height: 170,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 10,
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  brandName: {
    fontSize: 27,

    /*
     * Visual mais elegante para a marca.
     *
     * Caso você instale uma fonte customizada depois,
     * podemos trocar fontFamily aqui.
     */

    fontWeight: "800",

    letterSpacing: 5,

    color: LUNARA_COLORS.primary,

    textAlign: "center",
  },

  brandSubtitle: {
    fontSize: 11,

    color: LUNARA_COLORS.textSecondary,

    marginTop: 5,

    letterSpacing: 0.3,
  },

  navigation: {
    flex: 1,

    gap: 8,
  },

  sidebarItem: {
    height: 52,

    flexDirection: "row",

    alignItems: "center",

    gap: 14,

    paddingHorizontal: 14,

    borderRadius: 14,
  },

  sidebarItemActive: {
    backgroundColor: LUNARA_COLORS.primaryLight,
  },

  sidebarItemText: {
    fontSize: 14,

    fontWeight: "600",

    color: LUNARA_COLORS.textSecondary,
  },

  sidebarItemTextActive: {
    color: LUNARA_COLORS.primary,

    fontWeight: "700",
  },

  logoutButton: {
    height: 50,

    borderRadius: 14,

    backgroundColor: "#FFF7FA",

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 10,

    borderWidth: 1,

    borderColor: "#F7DCE9",
  },

  logoutText: {
    fontSize: 14,

    fontWeight: "700",

    color: LUNARA_COLORS.primary,
  },

  /* =========================
     MAIN
  ========================= */

  mainArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  container: {
    width: "100%",

    paddingHorizontal: 20,

    paddingTop: 24,
  },

  containerDesktop: {
    maxWidth: 1180,

    alignSelf: "center",

    paddingHorizontal: 40,

    paddingTop: 42,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 30,
  },

  welcomeContainer: {
    flex: 1,

    paddingRight: 16,
  },

  welcome: {
    fontSize: 30,

    fontWeight: "800",

    color: LUNARA_COLORS.text,

    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,

    lineHeight: 22,

    color: LUNARA_COLORS.textSecondary,
  },

  notificationButton: {
    width: 48,
    height: 48,

    borderRadius: 16,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: LUNARA_COLORS.border,

    position: "relative",
  },

  notificationBadge: {
    position: "absolute",

    top: 11,
    right: 12,

    width: 7,
    height: 7,

    borderRadius: 10,

    backgroundColor: LUNARA_COLORS.primary,
  },

  /* =========================
     USER PROFILE
  ========================= */

  userProfile: {
    flexDirection: "row",

    alignItems: "center",

    minWidth: 220,

    padding: 10,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: LUNARA_COLORS.border,
  },

  userAvatar: {
    width: 44,
    height: 44,

    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#F3DFEA",

    marginRight: 12,
  },

  userAvatarText: {
    fontSize: 16,

    fontWeight: "800",

    color: LUNARA_COLORS.primary,
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 13,

    fontWeight: "700",

    color: LUNARA_COLORS.text,

    marginBottom: 3,
  },

  userEmail: {
    fontSize: 11,

    color: LUNARA_COLORS.textSecondary,
  },

  /* =========================
     HERO
  ========================= */

  heroCard: {
    position: "relative",
    width: "100%",
    minHeight: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFF4F9",
    marginBottom: 20,
  },

  heroImage: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "52%",
    height: "100%",
  },

  heroImageMobile: {
    width: "45%",
  },

  heroContentSmallMobile: {
    width: "70%",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: "absolute",
    zIndex: 2,
    left: 0,
    top: 0,
    bottom: 0,
    width: "52%",
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: "center",
  },

  heroContentMobile: {
    width: "68%",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#272333",
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  heroTitleMobile: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#272333",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroTextMobile: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#403A48",
    marginBottom: 14,
    maxWidth: 170,
  },

  heroText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#403A48",
    marginBottom: 14,
    maxWidth: 255,
  },

  heroButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: "#C94687",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,

    shadowColor: "#C94687",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  /* =========================
     SECTIONS
  ========================= */

  section: {
    marginBottom: 34,
  },

  sectionHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,

    fontWeight: "800",

    color: LUNARA_COLORS.text,
  },

  seeAll: {
    fontSize: 14,

    fontWeight: "700",

    color: LUNARA_COLORS.primary,
  },

  /* =========================
     APPOINTMENT
  ========================= */

  nextAppointment: {
    flexDirection: "row",
    alignItems: "center",

    padding: 20,

    borderRadius: 22,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: LUNARA_COLORS.border,

    marginBottom: 4,
  },

  nextAppointmentIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: LUNARA_COLORS.primaryLight,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  nextAppointmentContent: {
    flex: 1,
  },

  nextAppointmentService: {
    fontSize: 16,
    fontWeight: "800",
    color: LUNARA_COLORS.text,

    marginBottom: 4,
  },

  nextAppointmentProfessional: {
    fontSize: 13,
    color: LUNARA_COLORS.textSecondary,

    marginBottom: 8,
  },

  nextAppointmentDate: {
    fontSize: 13,
    fontWeight: "700",
    color: LUNARA_COLORS.primary,

    marginBottom: 4,
  },

  nextAppointmentBranch: {
    fontSize: 12,
    color: LUNARA_COLORS.textSecondary,
  },

  emptyAppointment: {
    minHeight: 98,

    flexDirection: "row",

    alignItems: "center",

    padding: 20,

    borderRadius: 22,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: LUNARA_COLORS.border,
  },

  emptyIconContainer: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: LUNARA_COLORS.primaryLight,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  emptyContent: {
    flex: 1,
  },

  emptyTitle: {
    fontSize: 15,

    fontWeight: "800",

    color: LUNARA_COLORS.text,

    marginBottom: 5,
  },

  emptyText: {
    fontSize: 13,

    lineHeight: 19,

    color: LUNARA_COLORS.textSecondary,
  },

  emptyArrow: {
    paddingLeft: 10,
  },

  /* =========================
     QUICK ACTIONS
  ========================= */

  quickActions: {
    gap: 14,
  },

  quickActionsDesktop: {
    flexDirection: "row",
  },

  quickAction: {
    flex: 1,

    minHeight: 160,

    padding: 22,

    borderRadius: 22,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: LUNARA_COLORS.border,
  },

  quickActionIcon: {
    width: 50,
    height: 50,

    borderRadius: 16,

    backgroundColor: LUNARA_COLORS.primaryLight,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 15,
  },

  quickActionTitle: {
    fontSize: 16,

    fontWeight: "800",

    color: LUNARA_COLORS.text,

    marginBottom: 6,
  },

  quickActionSubtitle: {
    fontSize: 13,

    lineHeight: 19,

    color: LUNARA_COLORS.textSecondary,
  },

  /* =========================
     RECOMMENDATIONS
  ========================= */

  recommendations: {
    gap: 14,
  },

  recommendationCard: {
    flexDirection: "row",

    alignItems: "center",

    padding: 20,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: LUNARA_COLORS.border,
  },

  recommendationIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: LUNARA_COLORS.primaryLight,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  recommendationContent: {
    flex: 1,

    paddingRight: 12,
  },

  recommendationTitle: {
    fontSize: 15,

    fontWeight: "800",

    color: LUNARA_COLORS.text,

    marginBottom: 5,
  },

  recommendationDescription: {
    fontSize: 13,

    lineHeight: 19,

    color: LUNARA_COLORS.textSecondary,
  },

  /* =========================
     INTERACTIONS
  ========================= */

  cardPressed: {
    opacity: 0.85,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});
