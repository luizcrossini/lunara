import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { baseApi } from "@/core/api/baseApi";
import { useAuth } from "@/core/auth/auth-context";

/* ================================================================
   LUNARA — Design tokens
   ================================================================ */

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#923E73",
  primaryLight: "#F9EAF2",
  accent: "#7967A8",
  accentLight: "#F0ECF8",
  background: "#F7F5F8",
  surface: "#FFFFFF",
  text: "#28232D",
  secondary: "#746C78",
  muted: "#A69EAA",
  border: "#EEE8F0",
  success: "#39845E",
  successLight: "#E8F5ED",
  warning: "#A96F25",
  warningLight: "#FBF1E3",
  danger: "#B8476B",
  dangerLight: "#F9E9EF",
};

const SHADOW = {
  card: {
    shadowColor: "#302238",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 14,
    elevation: 2,
  },
};

type DashboardAppointment = {
  id: string;
  status: string;
  scheduledDate: string;
  totalPrice: number;
  branch?: { id: string; name: string };
  customer?: { id: string; name: string; photoUrl?: string | null };
  service?: { id: string | null; name: string };
  professional?: { id: string | null; name: string };
  startsAt: string;
  endsAt: string | null;
};

type DashboardOverview = {
  period: { startDate: string; endDate: string };
  company: { id: string; name: string };
  summary: {
    revenue: number;
    appointments: number;
    customers: number;
    occupancy: number | null;
  };
  today: { appointments: number };
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
        params: { startDate, endDate },
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

function statusPresentation(status: string) {
  const normalized = status?.toUpperCase();

  if (normalized === "CONFIRMED" || normalized === "CONFIRMADO") {
    return {
      label: "Confirmado",
      color: COLORS.success,
      background: COLORS.successLight,
    };
  }
  if (normalized === "RESCHEDULED" || normalized === "REAGENDADO") {
    return {
      label: "Reagendado",
      color: COLORS.accent,
      background: COLORS.accentLight,
    };
  }
  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "CANCELADO"
  ) {
    return {
      label: "Cancelado",
      color: COLORS.danger,
      background: COLORS.dangerLight,
    };
  }
  if (
    normalized === "COMPLETED" ||
    normalized === "CONCLUÍDO" ||
    normalized === "CONCLUIDO"
  ) {
    return {
      label: "Concluído",
      color: COLORS.success,
      background: COLORS.successLight,
    };
  }
  return {
    label: "Agendado",
    color: COLORS.warning,
    background: COLORS.warningLight,
  };
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
  const periods = [
    ["today", "Hoje"],
    ["week", "Esta semana"],
    ["month", "Este mês"],
    ["previousMonth", "Mês anterior"],
    ["last30", "Últimos 30 dias"],
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.periodModal}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.modalTitle}>Filtrar período</Text>
              <Text style={styles.modalSubtitle}>
                Escolha o intervalo dos indicadores
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={19} color={COLORS.secondary} />
            </Pressable>
          </View>
          {periods.map(([key, label]) => {
            const selected = key === selectedKey;
            const period = getPeriod(key);
            return (
              <Pressable
                key={key}
                onPress={() => onSelect(key)}
                style={[
                  styles.periodOption,
                  selected && styles.periodOptionSelected,
                ]}
              >
                <View style={styles.flexOne}>
                  <Text
                    style={[
                      styles.periodOptionLabel,
                      selected && styles.periodOptionLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  <Text style={styles.periodOptionDate}>
                    {formatDateRange(period.startDate, period.endDate)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkCircle,
                    selected && styles.checkCircleSelected,
                  ]}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.flexOne}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const isCompact = width < 1080;
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
  const firstName = user?.name?.split(" ")[0] ?? "Olá";
  const todayAppointments =
    summary.todayAppointments ??
    dashboard?.today?.appointments ??
    dashboard?.todayAppointments ??
    0;

  const metricItems = [
    {
      label: "Faturamento",
      value: formatCurrency(
        Number(summary.revenue ?? summary.totalRevenue ?? 0),
      ),
      icon: "wallet-outline" as const,
      tint: COLORS.primaryLight,
      color: COLORS.primary,
      note: period.label,
    },
    {
      label: "Agendamentos",
      value: String(summary.appointments ?? summary.totalAppointments ?? 0),
      icon: "calendar-outline" as const,
      tint: COLORS.accentLight,
      color: COLORS.accent,
      note: "No período selecionado",
    },
    {
      label: "Clientes",
      value: String(summary.customers ?? summary.totalCustomers ?? 0),
      icon: "people-outline" as const,
      tint: COLORS.successLight,
      color: COLORS.success,
      note: "Clientes atendidos",
    },
    {
      label: "Ocupação",
      value: `${summary.occupancy ?? summary.occupancyRate ?? 0}%`,
      icon: "pulse-outline" as const,
      tint: COLORS.warningLight,
      color: COLORS.warning,
      note: "Taxa de ocupação",
    },
  ];

  const quickActions = [
    {
      icon: "people-outline" as const,
      label: "Profissionais",
      path: "/dashboard/professionals",
      tint: COLORS.accentLight,
      color: COLORS.accent,
    },
    {
      icon: "time-outline" as const,
      label: "Horários da filial",
      path: "/dashboard/branch-working-hours",
      tint: COLORS.successLight,
      color: COLORS.success,
    },
    {
      icon: "sparkles-outline" as const,
      label: "Serviços",
      path: "/dashboard/services",
      tint: COLORS.warningLight,
      color: COLORS.warning,
    },
    {
      icon: "business-outline" as const,
      label: "Filiais",
      path: "/dashboard/branches",
      tint: COLORS.accentLight,
      color: COLORS.accent,
    },
    {
      icon: "storefront-outline" as const,
      label: "Perfil da empresa",
      path: "/dashboard/company-profile",
      tint: COLORS.primaryLight,
      color: COLORS.primary,
    },
    {
      icon: "person-outline" as const,
      label: "Clientes",
      path: "/dashboard/customers",
      tint: COLORS.successLight,
      color: COLORS.success,
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.appShell, isMobile && styles.appShellMobile]}>
        {!isMobile && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <View style={styles.brandMark}>
                <Image
                  source={require("../../../../assets/images/logo.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>LUNARA</Text>
              <Text style={styles.brandCaption}>BEAUTY MANAGEMENT</Text>
            </View>

            <Text style={styles.sidebarLabel}>MENU PRINCIPAL</Text>
            <Pressable style={[styles.navItem, styles.navItemActive]}>
              <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
              <Text style={styles.navItemActiveText}>Visão geral</Text>
            </Pressable>
            {[
              {
                icon: "calendar-outline" as const,
                label: "Agenda",
                path: "/dashboard/appointments",
              },
              {
                icon: "people-outline" as const,
                label: "Profissionais",
                path: "/dashboard/professionals",
              },
              {
                icon: "sparkles-outline" as const,
                label: "Serviços",
                path: "/dashboard/services",
              },
              {
                icon: "business-outline" as const,
                label: "Filiais",
                path: "/dashboard/branches",
              },
              {
                icon: "person-outline" as const,
                label: "Clientes",
                path: "/dashboard/customers",
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.navItem}
                onPress={() => router.push(item.path as never)}
              >
                <Ionicons name={item.icon} size={18} color={COLORS.secondary} />
                <Text style={styles.navItemText}>{item.label}</Text>
              </Pressable>
            ))}

            <Text style={[styles.sidebarLabel, styles.sidebarLabelSpaced]}>
              GESTÃO
            </Text>
            {[
              {
                icon: "time-outline" as const,
                label: "Horários da filial",
                path: "/dashboard/branch-working-hours",
              },
              {
                icon: "business-outline" as const,
                label: "Perfil da empresa",
                path: "/dashboard/company-profile",
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.navItem}
                onPress={() => router.push(item.path as never)}
              >
                <Ionicons name={item.icon} size={18} color={COLORS.secondary} />
                <Text style={styles.navItemText}>{item.label}</Text>
              </Pressable>
            ))}

            <View style={styles.sidebarBottom}>
              <View style={styles.sidebarDivider} />
              <Pressable style={styles.navItem} onPress={signOut}>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={COLORS.secondary}
                />
                <Text style={styles.navItemText}>Sair da conta</Text>
              </Pressable>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[styles.page, isMobile && styles.pageMobile]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.topbar}>
            <View style={styles.topbarTitleWrap}>
              {isMobile && (
                <View style={styles.mobileBrandMark}>
                  <Image
                    source={require("../../../../assets/images/logo.png")}
                    style={styles.mobileLogo}
                    resizeMode="contain"
                  />
                </View>
              )}
              <View>
                <Text style={styles.topbarTitle}>Painel de controle</Text>
                <Text style={styles.topbarSubtitle}>
                  Acompanhe o ritmo do seu negócio
                </Text>
              </View>
            </View>
            <View style={styles.topbarRight}>
              <View style={styles.todayPill}>
                <View style={styles.liveDot} />
                <Text style={styles.todayPillText}>Visão geral</Text>
              </View>
              <Pressable
                style={styles.logoutButton}
                onPress={signOut}
                hitSlop={8}
              >
                <Ionicons
                  name="log-out-outline"
                  size={19}
                  color={COLORS.secondary}
                />
                {isMobile && <Text style={styles.logoutLabel}>Sair</Text>}
              </Pressable>
            </View>
          </View>

          <View
            style={[styles.welcomeRow, isMobile && styles.welcomeRowMobile]}
          >
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcomeKicker}>SEU ESPAÇO, SEU MOMENTO</Text>
              <Text style={styles.welcomeTitle}>Olá, {firstName}.</Text>
              <Text style={styles.welcomeDescription}>
                Aqui está o resumo da sua operação para você cuidar do que
                realmente importa.
              </Text>
            </View>
            <Pressable
              style={[
                styles.primaryButton,
                isMobile && styles.primaryButtonMobile,
              ]}
              onPress={() => router.push("/dashboard/appointments" as never)}
            >
              <Ionicons name="calendar-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Abrir agenda</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.metricsHeader}>
            <SectionHeading eyebrow="DESEMPENHO" title="Resumo do período" />
            <Pressable
              style={styles.periodButton}
              onPress={() => setPeriodModalVisible(true)}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.periodButtonText}>{period.label}</Text>
              <Ionicons
                name="chevron-down"
                size={15}
                color={COLORS.secondary}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.metricsGrid,
              isMobile && styles.metricsGridMobile,
              isCompact && !isMobile && styles.metricsGridCompact,
            ]}
          >
            {metricItems.map((item) => (
              <View key={item.label} style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <View
                    style={[styles.metricIcon, { backgroundColor: item.tint }]}
                  >
                    <Ionicons name={item.icon} size={19} color={item.color} />
                  </View>
                  <View style={styles.metricIconCircle}>
                    <Ionicons
                      name="arrow-up"
                      size={13}
                      color={COLORS.success}
                    />
                  </View>
                </View>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text
                  style={styles.metricValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.value}
                </Text>
                <Text style={styles.metricNote}>{item.note}</Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.contentGrid,
              (isMobile || isCompact) && styles.contentGridStacked,
            ]}
          >
            <View
              style={[
                styles.primaryColumn,
                (isMobile || isCompact) && styles.fullColumn,
              ]}
            >
              <View style={styles.panel}>
                <SectionHeading
                  eyebrow="AGENDA"
                  title="Próximos atendimentos"
                  action="Ver agenda"
                  onAction={() =>
                    router.push("/dashboard/appointments" as never)
                  }
                />
                <View style={styles.appointmentList}>
                  {isLoading ? (
                    <View style={styles.loadingState}>
                      <ActivityIndicator color={COLORS.primary} />
                      <Text style={styles.loadingText}>
                        Carregando seus atendimentos...
                      </Text>
                    </View>
                  ) : appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIcon}>
                        <Ionicons
                          name="calendar-clear-outline"
                          size={25}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text style={styles.emptyTitle}>
                        Sua agenda está tranquila
                      </Text>
                      <Text style={styles.emptyText}>
                        Nenhum próximo atendimento foi encontrado.
                      </Text>
                      <Pressable
                        style={styles.emptyButton}
                        onPress={() =>
                          router.push("/dashboard/appointments/new" as never)
                        }
                      >
                        <Text style={styles.emptyButtonText}>
                          Criar agendamento
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    appointments.slice(0, 6).map((appointment, index) => {
                      const status = statusPresentation(appointment.status);
                      return (
                        <View
                          key={appointment.id ?? index}
                          style={styles.appointmentRow}
                        >
                          <View style={styles.appointmentTime}>
                            <Text style={styles.appointmentHour}>
                              {formatTime(appointment.startsAt)}
                            </Text>
                            <View style={styles.appointmentTimeLine} />
                          </View>
                          <View style={styles.appointmentAccent} />
                          <View style={styles.appointmentDetails}>
                            <Text style={styles.clientName} numberOfLines={1}>
                              {appointment.customer?.name ??
                                (appointment as any).customerName ??
                                "Cliente"}
                            </Text>
                            <Text style={styles.serviceName} numberOfLines={1}>
                              {appointment.service?.name ??
                                (appointment as any).serviceName ??
                                "Atendimento"}
                            </Text>
                            <View style={styles.appointmentMeta}>
                              <Ionicons
                                name="person-outline"
                                size={12}
                                color={COLORS.muted}
                              />
                              <Text
                                style={styles.professionalText}
                                numberOfLines={1}
                              >
                                {appointment.professional?.name ??
                                  "Profissional não informado"}
                              </Text>
                              {appointment.branch?.name ? (
                                <>
                                  <Text style={styles.metaSeparator}>·</Text>
                                  <Text
                                    style={styles.professionalText}
                                    numberOfLines={1}
                                  >
                                    {appointment.branch.name}
                                  </Text>
                                </>
                              ) : null}
                            </View>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: status.background },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: status.color },
                              ]}
                            >
                              {status.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>

              <View style={styles.todayBanner}>
                <View style={styles.todayIcon}>
                  <Ionicons
                    name="sunny-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.todayEyebrow}>SEU DIA EM FOCO</Text>
                  <Text style={styles.todayHeadline}>
                    {todayAppointments}{" "}
                    {Number(todayAppointments) === 1
                      ? "atendimento"
                      : "atendimentos"}{" "}
                    hoje
                  </Text>
                  <Text style={styles.todayDescription}>
                    Mantenha tudo organizado para oferecer uma experiência
                    especial.
                  </Text>
                </View>
                <Pressable
                  style={styles.refreshButton}
                  onPress={refetch}
                  hitSlop={8}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.sideColumn,
                (isMobile || isCompact) && styles.fullColumn,
              ]}
            >
              <View style={styles.panel}>
                <SectionHeading
                  eyebrow="FACILITE SUA ROTINA"
                  title="Ações rápidas"
                />
                <View style={styles.quickActions}>
                  {quickActions.map((action, index) => (
                    <Pressable
                      key={action.label}
                      style={[
                        styles.quickAction,
                        index === quickActions.length - 1 &&
                          styles.quickActionLast,
                      ]}
                      onPress={() => router.push(action.path as never)}
                    >
                      <View
                        style={[
                          styles.quickActionIcon,
                          { backgroundColor: action.tint },
                        ]}
                      >
                        <Ionicons
                          name={action.icon}
                          size={18}
                          color={action.color}
                        />
                      </View>
                      <Text style={styles.quickActionText}>{action.label}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.tipCard}>
                <View style={styles.tipDecoration} />
                <View style={styles.tipIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.tipTitle}>Um cuidado de cada vez.</Text>
                <Text style={styles.tipText}>
                  Uma agenda organizada deixa mais espaço para o que faz sua
                  marca especial: cuidar de pessoas.
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerText}>
            LUNARA · Gestão leve para negócios de beleza
          </Text>
        </ScrollView>
      </View>

      <PeriodModal
        visible={periodModalVisible}
        selectedKey={selectedPeriodKey}
        onSelect={(key) => {
          setSelectedPeriodKey(key);
          setPeriodModalVisible(false);
        }}
        onClose={() => setPeriodModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  appShell: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },
  appShellMobile: { maxWidth: "100%" },
  sidebar: {
    width: 238,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  sidebarBrand: { alignItems: "center", paddingBottom: 30 },
  brandMark: {
    width: 68,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    marginBottom: 8,
  },
  brandLogo: { width: 52, height: 45 },
  brandName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3.1,
  },
  brandCaption: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 4,
  },
  sidebarLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 10,
    marginLeft: 10,
  },
  sidebarLabelSpaced: { marginTop: 28 },
  navItem: {
    minHeight: 43,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 4,
  },
  navItemActive: { backgroundColor: COLORS.primary },
  navItemText: { color: COLORS.secondary, fontSize: 12, fontWeight: "600" },
  navItemActiveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  sidebarBottom: { marginTop: "auto" as any, paddingTop: 24 },
  sidebarDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  mainScroll: { flex: 1, minWidth: 0 },
  page: {
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 30,
    maxWidth: 1400,
    alignSelf: "center",
  },
  pageMobile: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 26 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 19,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  topbarTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  topbarTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  topbarSubtitle: { color: COLORS.secondary, fontSize: 11, marginTop: 3 },
  topbarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  todayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  todayPillText: { color: COLORS.secondary, fontSize: 10, fontWeight: "700" },
  logoutButton: {
    height: 38,
    minWidth: 38,
    paddingHorizontal: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutLabel: { color: COLORS.secondary, fontSize: 11, fontWeight: "700" },
  mobileBrandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileLogo: { width: 31, height: 31 },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    paddingVertical: 28,
  },
  welcomeRowMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    paddingVertical: 23,
    gap: 17,
  },
  welcomeCopy: { flex: 1, minWidth: 0 },
  welcomeKicker: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  welcomeDescription: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 540,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    ...SHADOW.card,
  },
  primaryButtonMobile: { alignSelf: "stretch" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 13,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 17,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.35,
    marginBottom: 5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.35,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  sectionActionText: { color: COLORS.primary, fontSize: 10, fontWeight: "800" },
  periodButton: {
    minHeight: 39,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  periodButtonText: { color: COLORS.text, fontSize: 10, fontWeight: "700" },
  metricsGrid: { flexDirection: "row", gap: 13, marginBottom: 22 },
  metricsGridMobile: { flexWrap: "wrap", gap: 10 },
  metricsGridCompact: { flexWrap: "wrap" },
  metricCard: {
    flex: 1,
    minWidth: 145,
    borderRadius: 17,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  metricCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metricIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { color: COLORS.secondary, fontSize: 10, fontWeight: "700" },
  metricValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 5,
  },
  metricNote: { color: COLORS.muted, fontSize: 9, marginTop: 7 },
  contentGrid: { flexDirection: "row", alignItems: "flex-start", gap: 17 },
  contentGridStacked: { flexDirection: "column" },
  primaryColumn: { flex: 1, minWidth: 0, gap: 16 },
  sideColumn: { width: 330, minWidth: 0, gap: 16 },
  fullColumn: { width: "100%", flexBasis: "auto" as any, alignSelf: "stretch" },
  panel: {
    width: "100%",
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
    ...SHADOW.card,
  },
  appointmentList: { width: "100%" },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 75,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 11,
    paddingVertical: 10,
  },
  appointmentTime: {
    width: 53,
    alignSelf: "stretch",
    alignItems: "flex-start",
    paddingTop: 4,
  },
  appointmentHour: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  appointmentTimeLine: {
    width: 1,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 8,
    marginLeft: 5,
  },
  appointmentAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
  },
  appointmentDetails: { flex: 1, minWidth: 0, paddingVertical: 2 },
  clientName: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  serviceName: { color: COLORS.secondary, fontSize: 10, marginTop: 4 },
  appointmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
    minWidth: 0,
  },
  professionalText: { color: COLORS.muted, fontSize: 9, flexShrink: 1 },
  metaSeparator: { color: COLORS.muted, fontSize: 10 },
  statusBadge: {
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: 100,
  },
  statusText: { fontSize: 8, fontWeight: "800" },
  loadingState: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: COLORS.secondary, fontSize: 11 },
  emptyState: {
    minHeight: 225,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },
  emptyButton: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  emptyButtonText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "800",
  },
  quickActions: { marginTop: -3 },
  quickAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 7,
  },
  quickActionLast: { borderBottomWidth: 0 },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 10.5,
    fontWeight: "700",
  },
  todayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F0DCE7",
    backgroundColor: COLORS.primaryLight,
    padding: 15,
  },
  todayIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  todayEyebrow: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  todayHeadline: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  todayDescription: {
    color: COLORS.secondary,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  refreshButton: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#F0ECF8",
    borderWidth: 1,
    borderColor: "#E7DFF2",
  },
  tipDecoration: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5DDF2",
    right: -32,
    top: -36,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tipTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  tipText: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
    maxWidth: 270,
  },
  footerText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 23,
  },
  flexOne: { flex: 1, minWidth: 0 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(40,35,45,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  periodModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.surface,
    borderRadius: 23,
    padding: 21,
    ...SHADOW.card,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  modalSubtitle: { color: COLORS.secondary, fontSize: 10, marginTop: 4 },
  closeButton: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  periodOption: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
    gap: 12,
  },
  periodOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "#E9C8DA",
  },
  periodOptionLabel: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  periodOptionLabelSelected: { color: COLORS.primaryDark },
  periodOptionDate: { color: COLORS.secondary, fontSize: 9, marginTop: 4 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
