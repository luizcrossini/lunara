import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: "#B55A91",
  primaryLight: "#F8EAF2",
  background: "#F9F7FA",
  card: "#FFFFFF",

  text: "#272333",
  textSecondary: "#756D7A",
  textMuted: "#A59BA6",

  border: "#EEE5EC",

  success: "#4E9B72",
  successLight: "#EAF7F0",

  warning: "#C88A3D",
  warningLight: "#FFF5E8",

  danger: "#C94B7C",
  dangerLight: "#FDECF2",
};

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  description: string;
  iconBackground: string;
  iconColor: string;
};

function MetricCard({
  icon,
  title,
  value,
  description,
  iconBackground,
  iconColor,
}: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View
          style={[
            styles.metricIcon,
            {
              backgroundColor: iconBackground,
            },
          ]}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      </View>

      <Text style={styles.metricTitle}>{title}</Text>

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

type AppointmentProps = {
  time: string;
  customer: string;
  service: string;
  professional: string;
  status: "confirmed" | "waiting";
};

function AppointmentCard({
  time,
  customer,
  service,
  professional,
  status,
}: AppointmentProps) {
  const isConfirmed = status === "confirmed";

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTime}>
        <Text style={styles.appointmentHour}>{time}</Text>
      </View>

      <View style={styles.appointmentInfo}>
        <Text style={styles.customerName}>{customer}</Text>

        <Text style={styles.appointmentService}>{service}</Text>

        <View style={styles.professionalRow}>
          <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />

          <Text style={styles.professionalName}>{professional}</Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isConfirmed
              ? COLORS.successLight
              : COLORS.warningLight,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: isConfirmed ? COLORS.success : COLORS.warning,
            },
          ]}
        >
          {isConfirmed ? "Confirmado" : "Aguardando"}
        </Text>
      </View>
    </View>
  );
}

export default function OwnerDashboard() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
      >
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {/* =====================================================
              HEADER
          ===================================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>VISÃO GERAL</Text>

              <Text style={styles.title}>Olá, proprietário 👋</Text>

              <Text style={styles.subtitle}>
                Bem-vindo à gestão do seu salão.
              </Text>
            </View>
          </View>

          {/* =====================================================
              TODAY CARD
          ===================================================== */}

          <View style={styles.todayCard}>
            <View style={styles.todayContent}>
              <View style={styles.todayIcon}>
                <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
              </View>

              <View>
                <Text style={styles.todayLabel}>HOJE</Text>

                <Text style={styles.todayTitle}>Você tem 8 atendimentos</Text>

                <Text style={styles.todaySubtitle}>
                  Sua agenda está organizada para hoje.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/(owner)/dashboard/appointments")}
              style={({ pressed }) => [
                styles.todayButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.todayButtonText}>Ver agenda</Text>

              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* =====================================================
              METRICS
          ===================================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Resumo</Text>

              <Text style={styles.sectionSubtitle}>
                Desempenho do seu salão
              </Text>
            </View>

            <Pressable>
              <Text style={styles.periodText}>Este mês</Text>
            </Pressable>
          </View>

          <View
            style={[styles.metricsGrid, isDesktop && styles.metricsGridDesktop]}
          >
            <MetricCard
              icon="cash-outline"
              title="Faturamento"
              value="R$ 8.450"
              description="+12,5% este mês"
              iconBackground={COLORS.successLight}
              iconColor={COLORS.success}
            />

            <MetricCard
              icon="calendar-outline"
              title="Agendamentos"
              value="124"
              description="+8 hoje"
              iconBackground={COLORS.primaryLight}
              iconColor={COLORS.primary}
            />

            <MetricCard
              icon="people-outline"
              title="Clientes"
              value="186"
              description="12 novos este mês"
              iconBackground="#F0EDF8"
              iconColor="#7967A8"
            />

            <MetricCard
              icon="analytics-outline"
              title="Ocupação"
              value="82%"
              description="+5,2% este mês"
              iconBackground={COLORS.warningLight}
              iconColor={COLORS.warning}
            />
          </View>

          {/* =====================================================
              QUICK ACTIONS
          ===================================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Ações rápidas</Text>

              <Text style={styles.sectionSubtitle}>Gerencie seu salão</Text>
            </View>
          </View>

          <View
            style={[
              styles.quickActions,
              isDesktop && styles.quickActionsDesktop,
            ]}
          >
            <Pressable
              onPress={() => router.push("/(owner)/dashboard/appointments")}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: COLORS.primaryLight,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.quickActionTitle}>Agenda</Text>

              <Text style={styles.quickActionDescription}>
                Ver atendimentos
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(owner)/dashboard/services")}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: "#F0EDF8",
                  },
                ]}
              >
                <Ionicons name="sparkles-outline" size={21} color="#7967A8" />
              </View>

              <Text style={styles.quickActionTitle}>Serviços</Text>

              <Text style={styles.quickActionDescription}>
                Gerenciar serviços
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(owner)/dashboard/professionals")}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: COLORS.successLight,
                  },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={21}
                  color={COLORS.success}
                />
              </View>

              <Text style={styles.quickActionTitle}>Profissionais</Text>

              <Text style={styles.quickActionDescription}>
                Gerenciar equipe
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(owner)/dashboard/customers")}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: COLORS.warningLight,
                  },
                ]}
              >
                <Ionicons
                  name="person-add-outline"
                  size={21}
                  color={COLORS.warning}
                />
              </View>

              <Text style={styles.quickActionTitle}>Clientes</Text>

              <Text style={styles.quickActionDescription}>Ver clientes</Text>
            </Pressable>
          </View>

          {/* =====================================================
              APPOINTMENTS
          ===================================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Próximos atendimentos</Text>

              <Text style={styles.sectionSubtitle}>
                Os próximos horários da sua agenda
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(owner)/dashboard/appointments")}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
            </Pressable>
          </View>

          <View style={styles.appointmentsCard}>
            <AppointmentCard
              time="14:00"
              customer="Maria Silva"
              service="Corte + Escova"
              professional="Ana"
              status="confirmed"
            />

            <View style={styles.divider} />

            <AppointmentCard
              time="14:45"
              customer="João Santos"
              service="Barba"
              professional="Carlos"
              status="confirmed"
            />

            <View style={styles.divider} />

            <AppointmentCard
              time="15:30"
              customer="Ana Oliveira"
              service="Coloração"
              professional="Fernanda"
              status="waiting"
            />
          </View>

          {/* =====================================================
              FOOTER SPACE
          ===================================================== */}

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  scrollContentDesktop: {
    paddingBottom: 50,
  },

  container: {
    width: "100%",
    paddingHorizontal: 20,
  },

  containerDesktop: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 36,
  },

  /* ============================================================
     HEADER
  ============================================================ */

  header: {
    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingTop: 8,
    paddingBottom: 18,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,

    color: COLORS.primary,

    marginBottom: 4,
  },

  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",

    color: COLORS.text,

    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 3,

    fontSize: 13,
    lineHeight: 19,

    color: COLORS.textSecondary,
  },

  notificationButton: {
    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",
  },

  notificationDot: {
    position: "absolute",

    top: 9,
    right: 10,

    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: COLORS.danger,
  },

  /* ============================================================
     TODAY CARD
  ============================================================ */

  todayCard: {
    minHeight: 112,

    padding: 18,

    borderRadius: 22,

    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    overflow: "hidden",
  },

  todayContent: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    marginRight: 12,
  },

  todayIcon: {
    width: 46,
    height: 46,

    borderRadius: 15,

    backgroundColor: "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  todayLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,

    color: "rgba(255,255,255,0.75)",

    marginBottom: 3,
  },

  todayTitle: {
    fontSize: 14,
    fontWeight: "800",

    color: "#FFFFFF",

    marginBottom: 3,
  },

  todaySubtitle: {
    fontSize: 11,

    color: "rgba(255,255,255,0.78)",
  },

  todayButton: {
    minHeight: 38,

    paddingHorizontal: 13,

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  todayButtonText: {
    fontSize: 11,
    fontWeight: "800",

    color: COLORS.primary,
  },

  /* ============================================================
     SECTIONS
  ============================================================ */

  sectionHeader: {
    marginTop: 28,
    marginBottom: 13,

    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",

    color: COLORS.text,

    letterSpacing: -0.25,
  },

  sectionSubtitle: {
    marginTop: 3,

    fontSize: 11.5,

    color: COLORS.textSecondary,
  },

  periodText: {
    fontSize: 11,
    fontWeight: "700",

    color: COLORS.primary,
  },

  seeAllText: {
    fontSize: 11,
    fontWeight: "800",

    color: COLORS.primary,
  },

  /* ============================================================
     METRICS
  ============================================================ */

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 10,
  },

  metricsGridDesktop: {
    gap: 14,
  },

  metricCard: {
    width: "48.5%",

    minHeight: 145,

    padding: 15,

    borderRadius: 18,

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metricHeader: {
    marginBottom: 11,
  },

  metricIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  metricTitle: {
    fontSize: 11,

    color: COLORS.textSecondary,

    marginBottom: 2,
  },

  metricValue: {
    fontSize: 21,
    fontWeight: "800",

    color: COLORS.text,

    letterSpacing: -0.4,
  },

  metricDescription: {
    marginTop: 4,

    fontSize: 10.5,

    color: COLORS.textMuted,
  },

  /* ============================================================
     QUICK ACTIONS
  ============================================================ */

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 10,
  },

  quickActionsDesktop: {
    gap: 14,
  },

  quickAction: {
    width: "48.5%",

    minHeight: 112,

    padding: 14,

    borderRadius: 18,

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickActionIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,
  },

  quickActionTitle: {
    fontSize: 13,
    fontWeight: "800",

    color: COLORS.text,
  },

  quickActionDescription: {
    marginTop: 3,

    fontSize: 10.5,

    color: COLORS.textSecondary,
  },

  /* ============================================================
     APPOINTMENTS
  ============================================================ */

  appointmentsCard: {
    borderRadius: 20,

    backgroundColor: COLORS.card,

    borderWidth: 1,
    borderColor: COLORS.border,

    overflow: "hidden",
  },

  appointmentCard: {
    minHeight: 92,

    paddingHorizontal: 15,
    paddingVertical: 13,

    flexDirection: "row",
    alignItems: "center",
  },

  appointmentTime: {
    width: 58,
  },

  appointmentHour: {
    fontSize: 14,
    fontWeight: "800",

    color: COLORS.primary,
  },

  appointmentInfo: {
    flex: 1,

    marginRight: 10,
  },

  customerName: {
    fontSize: 13,
    fontWeight: "800",

    color: COLORS.text,
  },

  appointmentService: {
    marginTop: 2,

    fontSize: 11,

    color: COLORS.textSecondary,
  },

  professionalRow: {
    marginTop: 5,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  professionalName: {
    fontSize: 10,

    color: COLORS.textMuted,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 9,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  divider: {
    height: 1,

    marginLeft: 73,

    backgroundColor: COLORS.border,
  },

  /* ============================================================
     GENERAL
  ============================================================ */

  pressed: {
    opacity: 0.72,
  },

  bottomSpace: {
    height: 20,
  },
});
