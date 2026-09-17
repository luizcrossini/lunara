import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";

import React from "react";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import { baseApi } from "@/core/api/baseApi";

import { useAuth } from "@/core/auth/auth-context";

/* ================================================================
   DESIGN TOKENS
   Refined, slightly deeper palette for a more premium feel, plus
   shared shadow/elevation presets so every card reads consistently.
================================================================ */

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#9A4179",
  primaryLight: "#FBEEF5",

  accent: "#7967A8",
  accentLight: "#F1EDF9",

  background: "#FAF8FB",
  card: "#FFFFFF",

  text: "#221E2B",
  textSecondary: "#6C6472",
  textMuted: "#A79EAC",

  border: "#F0E8EE",
  borderStrong: "#E6DAE3",

  success: "#3E8F64",
  successLight: "#E8F6EE",

  warning: "#B97A2E",
  warningLight: "#FDF3E5",

  danger: "#C0416F",
  dangerLight: "#FBE7EF",

  overlay: "rgba(34,30,43,0.45)",
};

const SHADOW = {
  soft: {
    shadowColor: "#3D2A44",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: "#3D2A44",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  primary: {
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

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
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      </View>

      <Text style={styles.metricTitle}>{title}</Text>

      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

type AppointmentProps = {
  time: string;
  customer: string;
  service: string;
  professional: string;
  status: "confirmed" | "waiting" | "rescheduled";
};

function AppointmentCard({
  time,
  customer,
  service,
  professional,
  status,
}: AppointmentProps) {
  const isConfirmed = status === "confirmed";
  const isRescheduled = status === "rescheduled";

  const statusBackground = isConfirmed
    ? COLORS.successLight
    : isRescheduled
      ? COLORS.primaryLight
      : COLORS.warningLight;

  const statusColor = isConfirmed
    ? COLORS.success
    : isRescheduled
      ? COLORS.primary
      : COLORS.warning;

  const statusLabel = isConfirmed
    ? "Confirmado"
    : isRescheduled
      ? "Reagendado"
      : "Aguardando";

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTime}>
        <View style={styles.appointmentTimeDot} />
        <Text style={styles.appointmentHour}>{time}</Text>
      </View>

      <View style={styles.appointmentInfo}>
        <Text style={styles.customerName} numberOfLines={1}>
          {customer}
        </Text>

        <Text style={styles.appointmentService} numberOfLines={1}>
          {service}
        </Text>

        <View style={styles.professionalRow}>
          <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.professionalName} numberOfLines={1}>
            {professional}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: statusBackground,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: statusColor,
            },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

type DashboardAppointment = {
  id: string;
  status: string;
  scheduledDate: string;
  totalPrice: number;
  branch?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    photoUrl?: string | null;
  };
  service?: {
    id: string | null;
    name: string;
  };
  professional?: {
    id: string | null;
    name: string;
  };
  startsAt: string;
  endsAt: string | null;
};

type DashboardOverview = {
  period: {
    startDate: string;
    endDate: string;
  };

  company: {
    id: string;
    name: string;
  };

  summary: {
    revenue: number;
    appointments: number;
    customers: number;
    occupancy: number | null;
  };

  today: {
    appointments: number;
  };

  upcomingAppointments: DashboardAppointment[];
};

type DashboardPeriod = {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

const dashboardApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getDashboardOverview: builder.query<
      DashboardOverview,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: "/dashboard/overview",
        method: "GET",
        params: {
          startDate,
          endDate,
        },
      }),

      transformResponse: (response: any) => response?.data ?? response,

      providesTags: ["Company", "Appointment", "Customer"],
    }),
  }),
});

const { useGetDashboardOverviewQuery } = dashboardApi;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(startDate: Date, endDate: Date) {
  const endInclusive = new Date(endDate);
  endInclusive.setDate(endInclusive.getDate() - 1);
  return `${formatDate(startDate)} — ${formatDate(endInclusive)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getDashboardStatus(status: string) {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "Em atendimento",
    COMPLETED: "Realizado",
    NO_SHOW: "Não compareceu",
    CANCELLED: "Cancelado",
    PENDING: "Pendente",
    RESCHEDULED: "Reagendado",
  };

  if (status === "COMPLETED") {
    return { label: labels[status], backgroundColor: COLORS.successLight, color: COLORS.success };
  }

  if (status === "NO_SHOW" || status === "CANCELLED") {
    return { label: labels[status], backgroundColor: COLORS.dangerLight, color: COLORS.danger };
  }

  return {
    label: labels[status] ?? status,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
  };
}

function getPeriod(key: string, reference = new Date()): DashboardPeriod {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);

  if (key === "today") {
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return { key, label: "Hoje", startDate: date, endDate: end };
  }

  if (key === "week") {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(start.getDate() + diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { key, label: "Esta semana", startDate: start, endDate: end };
  }

  if (key === "previousMonth") {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth(), 1);
    return { key, label: "Mês anterior", startDate: start, endDate: end };
  }

  if (key === "last30") {
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { key, label: "Últimos 30 dias", startDate: start, endDate: end };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { key: "month", label: "Este mês", startDate: start, endDate: end };
}

function toApiDate(date: Date) {
  return date.toISOString();
}

function PeriodModal({
  visible,
  selectedKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  const periods = [
    ["today", "Hoje"],
    ["week", "Esta semana"],
    ["month", "Este mês"],
    ["previousMonth", "Mês anterior"],
    ["last30", "Últimos 30 dias"],
  ] as const;

  return (
    <View style={styles.periodDropdown}>
      <View style={styles.periodDropdownHeader}>
        <View style={styles.periodDropdownTitleWrap}>
          <Text style={styles.periodModalTitle}>Filtrar período</Text>
          <Text style={styles.periodModalSubtitle}>
            Escolha o intervalo dos indicadores
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.modalClose,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={17} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.periodOptionsList}>
        {periods.map(([key, label]) => {
          const selected = key === selectedKey;

          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [
                styles.periodOption,
                selected && styles.periodOptionSelected,
                pressed && !selected && styles.periodOptionPressed,
              ]}
            >
              <View style={styles.periodOptionTextWrap}>
                <Text
                  style={[
                    styles.periodOptionText,
                    selected && styles.periodOptionTextSelected,
                  ]}
                >
                  {label}
                </Text>

                <Text style={styles.periodOptionRange}>
                  {formatDateRange(
                    getPeriod(key).startDate,
                    getPeriod(key).endDate,
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.periodOptionCheck,
                  selected && styles.periodOptionCheckSelected,
                ]}
              >
                {selected && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { width } = useWindowDimensions();

  const isMobile = width < 760;
  const [selectedPeriodKey, setSelectedPeriodKey] = React.useState("month");
  const [periodModalVisible, setPeriodModalVisible] = React.useState(false);

  const period = React.useMemo(
    () => getPeriod(selectedPeriodKey),
    [selectedPeriodKey],
  );

  const {
    data: dashboard,
    isLoading,
    isFetching,
    refetch,
  } = useGetDashboardOverviewQuery({
    startDate: toApiDate(period.startDate),
    endDate: toApiDate(period.endDate),
  });

  const summary: any = dashboard?.summary ?? {};
  const appointments = dashboard?.upcomingAppointments ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "Luiz";

  const metricItems = [
    {
      label: "Faturamento",
      value: formatCurrency(Number(summary.revenue ?? summary.totalRevenue ?? 0)),
      icon: "cash-outline" as const,
    },
    {
      label: "Agendamentos",
      value: String(summary.appointments ?? summary.totalAppointments ?? 0),
      icon: "calendar-outline" as const,
    },
    {
      label: "Clientes",
      value: String(summary.customers ?? summary.totalCustomers ?? 0),
      icon: "people-outline" as const,
    },
    {
      label: "Ocupação",
      value: `${summary.occupancy ?? summary.occupancyRate ?? 0}%`,
      icon: "pulse-outline" as const,
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Logo da LUNARA"
            />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brand}>LUNARA</Text>
              <Text style={styles.brandCaption}>COMMAND CENTER</Text>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={signOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>PAINEL DE CONTROLE</Text>
            <Text style={styles.heroTitle}>Olá, {firstName}.</Text>
            <Text style={styles.heroSubtitle}>
              Uma visão clara da operação do seu salão, em um só lugar.
            </Text>
          </View>

          <Pressable
            style={styles.heroButton}
            onPress={() => router.push("/appointments" as never)}
          >
            <Text style={styles.heroButtonText}>Abrir agenda</Text>
            <Ionicons name="arrow-forward" size={17} color={COLORS.primary} />
          </Pressable>
        </View>

        <View
          style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}
        >
          <View>
            <Text style={styles.eyebrow}>DESEMPENHO</Text>
            <Text style={styles.sectionTitle}>Resumo do período</Text>
          </View>

          <View
            style={[
              styles.periodFilterArea,
              isMobile && styles.periodFilterAreaMobile,
            ]}
          >
            <Pressable
              style={[
                styles.periodButton,
                periodModalVisible && styles.periodButtonActive,
              ]}
              onPress={() => setPeriodModalVisible((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel="Selecionar período"
              accessibilityState={{ expanded: periodModalVisible }}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.periodButtonText}>{period.label}</Text>
              <Ionicons
                name={periodModalVisible ? "chevron-up" : "chevron-down"}
                size={15}
                color={COLORS.textSecondary}
              />
            </Pressable>

            <PeriodModal
              visible={periodModalVisible}
              selectedKey={selectedPeriodKey}
              onSelect={(key) => {
                setSelectedPeriodKey(key);
                setPeriodModalVisible(false);
              }}
              onClose={() => setPeriodModalVisible(false)}
            />
          </View>
        </View>

        <View style={[styles.metrics, isMobile && styles.metricsMobile]}>
          {metricItems.map((item) => (
            <View key={item.label} style={styles.metric}>
              <View style={styles.metricIcon}>
                <Ionicons name={item.icon} size={19} color={COLORS.primary} />
              </View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text
                style={styles.metricValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[styles.contentGrid, isMobile && styles.contentGridMobile]}
        >
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.eyebrow}>AGENDA</Text>
                <Text style={styles.sectionTitle}>Próximos atendimentos</Text>
              </View>
              <Pressable onPress={() => router.push("/dashboard/appointments" as never)}>
                <Text style={styles.link}>Ver todos →</Text>
              </Pressable>
            </View>

            {isLoading || isFetching ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : appointments.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>Agenda tranquila</Text>
                <Text style={styles.emptyText}>
                  Nenhum atendimento próximo encontrado.
                </Text>
              </View>
            ) : (
              appointments
                .slice(0, 6)
                .map((appointment: any, index: number) => (
                  <View
                    key={appointment.id ?? index}
                    style={styles.appointment}
                  >
                    <View style={styles.timeBox}>
                      <Text style={styles.time}>
                        {formatTime(appointment.startsAt)}
                      </Text>
                      <Text style={styles.date}>
                        {formatAppointmentDate(
                          appointment.startsAt ?? appointment.scheduledDate,
                        )}
                      </Text>
                    </View>

                    <View style={styles.appointmentInfo}>
                      <Text style={styles.client} numberOfLines={1}>
                        {appointment.customer?.name ??
                          appointment.customerName ??
                          "Cliente"}
                      </Text>
                      <Text style={styles.service} numberOfLines={1}>
                        {appointment.service?.name ??
                          appointment.serviceName ??
                          "Atendimento"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.status,
                        {
                          backgroundColor: getDashboardStatus(
                            appointment.status,
                          ).backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: getDashboardStatus(appointment.status).color,
                          },
                        ]}
                      >
                        {getDashboardStatus(appointment.status).label}
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.panel}>
              <Text style={styles.eyebrow}>ATALHOS</Text>
              <Text style={styles.sectionTitle}>Ações rápidas</Text>

              {[
                ["add-circle-outline", "Novo agendamento", "/appointments/new"],
                ["people-outline", "Profissionais", "/professionals"],
                ["sparkles-outline", "Serviços", "/services"],
                ["person-outline", "Clientes", "/customers"],
              ].map(([icon, label, path]) => (
                <Pressable
                  key={label}
                  style={styles.action}
                  onPress={() => router.push(path as never)}
                >
                  <Ionicons
                    name={icon as any}
                    size={21}
                    color={COLORS.primary}
                  />
                  <Text style={styles.actionText}>{label}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={COLORS.textSecondary}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.todayCard}>
              <Ionicons name="sunny-outline" size={24} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.todayLabel}>HOJE</Text>
                <Text style={styles.todayValue}>
                  {summary.todayAppointments ??
                    dashboard?.todayAppointments ??
                    0}{" "}
                  atendimentos
                </Text>
              </View>
              <Pressable onPress={refetch} hitSlop={8}>
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  page: {
    padding: 22,
    paddingBottom: 50,
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minWidth: 0,
  },
  logoImage: {
    width: 46,
    height: 46,
    maxWidth: 170,
  },
  brandTextWrap: {
    minWidth: 0,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  brand: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  brandCaption: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginTop: 2,
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderRadius: 26,
    padding: 28,
    minHeight: 205,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    overflow: "hidden",
    marginBottom: 28,
  },
  heroContent: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 550,
  },
  heroButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    minHeight: 45,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroButtonText: {
    color: COLORS.primary,
    fontSize: 11.5,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 13,
  },
  sectionHeaderMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },
  periodFilterArea: {
    alignItems: "flex-end",
    minWidth: 0,
    zIndex: 20,
  },
  periodFilterAreaMobile: {
    width: "100%",
    alignItems: "stretch",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },
  periodButton: {
    minHeight: 41,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  periodButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  periodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  periodDropdown: {
    width: 292,
    maxWidth: "100%",
    marginTop: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    shadowColor: "#221E2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  periodDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    paddingTop: 3,
    paddingBottom: 9,
  },
  periodDropdownTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  periodModalTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  periodModalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    marginLeft: 8,
  },
  periodOptionsList: {
    gap: 6,
  },
  periodOption: {
    minHeight: 53,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  periodOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  periodOptionPressed: {
    backgroundColor: COLORS.background,
  },
  periodOptionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  periodOptionText: {
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  periodOptionTextSelected: {
    color: COLORS.primaryDark,
  },
  periodOptionRange: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    marginTop: 3,
  },
  periodOptionCheck: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  periodOptionCheckSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  metricsMobile: {
    flexDirection: "column",
  },
  metric: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },
  contentGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  contentGridMobile: {
    flexDirection: "column",
  },
  panel: {
    flex: 1.7,
    minWidth: 0,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 19,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
  },
  link: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: "900",
  },
  appointment: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeBox: {
    width: 63,
  },
  time: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },
  appointmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  client: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  service: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  status: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
  },
  sideColumn: {
    flex: 1,
    minWidth: 270,
    gap: 18,
  },
  action: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  todayCard: {
    minHeight: 83,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  todayLabel: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  todayValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
  },
  empty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    textAlign: "center",
  },
});
