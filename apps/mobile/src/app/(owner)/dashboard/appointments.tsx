import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { baseApi } from "@/core/api/baseApi";

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#9A4179",
  primaryLight: "#FBEEF5",
  background: "#FAF8FB",
  card: "#FFFFFF",
  text: "#221E2B",
  textSecondary: "#6C6472",
  textMuted: "#A79EAC",
  border: "#F0E8EE",
  success: "#3E8F64",
  successLight: "#E8F6EE",
  warning: "#B97A2E",
  warningLight: "#FDF3E5",
  danger: "#C0416F",
  dangerLight: "#FBE7EF",
};

type ViewMode = "day" | "week" | "month";
type AppointmentStatus =
  "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" | string;

type Appointment = {
  id: string;
  scheduledDate?: string;
  startsAt: string;
  endsAt?: string | null;
  status: AppointmentStatus;
  totalPrice?: number;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    photoUrl?: string | null;
  };
  professional?: { id?: string; name?: string };
  service?: { id?: string; name?: string; price?: number };
  services?: Array<{ id?: string; name?: string; price?: number }>;
  branch?: { id?: string; name?: string };
  notes?: string | null;
};

type RawAppointmentItem = {
  startsAt?: string | null;
  endsAt?: string | null;
  price?: number | string | null;
  professionalService?: {
    service?: { id?: string; name?: string; price?: number | string | null };
    professional?: {
      id?: string;
      user?: {
        name?: string;
        phone?: string;
        email?: string;
        photoUrl?: string | null;
      };
    };
  };
};

type RawAppointment = {
  id: string;
  scheduledDate?: string | null;
  status?: AppointmentStatus;
  totalPrice?: number | string | null;
  notes?: string | null;
  customer?: {
    id?: string;
    user?: {
      name?: string;
      phone?: string;
      email?: string;
      photoUrl?: string | null;
    };
  };
  branch?: { id?: string; name?: string };
  items?: RawAppointmentItem[];
};

function normalizeAppointment(raw: RawAppointment): Appointment | null {
  const items = Array.isArray(raw.items) ? raw.items : [];
  const firstItem = items[0];

  const startsAt = firstItem?.startsAt ?? raw.scheduledDate;
  if (!startsAt) return null;

  const services = items
    .map((item) => item.professionalService?.service)
    .filter(Boolean)
    .map((service) => ({
      id: service?.id,
      name: service?.name,
      price: Number(service?.price ?? 0),
    }));

  const totalPrice =
    raw.totalPrice != null
      ? Number(raw.totalPrice)
      : items.reduce((total, item) => total + Number(item.price ?? 0), 0);

  return {
    id: raw.id,
    scheduledDate: raw.scheduledDate ?? undefined,
    startsAt,
    endsAt: firstItem?.endsAt ?? null,
    status: raw.status ?? "PENDING",
    totalPrice,
    customer: raw.customer
      ? {
          id: raw.customer.id,
          name: raw.customer.user?.name,
          phone: raw.customer.user?.phone,
          email: raw.customer.user?.email,
          photoUrl: raw.customer.user?.photoUrl,
        }
      : undefined,
    professional: {
      id: firstItem?.professionalService?.professional?.id,
      name: firstItem?.professionalService?.professional?.user?.name,
    },
    services,
    service: services[0],
    branch: raw.branch,
    notes: raw.notes,
  };
}

const agendaApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOwnerAppointments: builder.query<Appointment[], void>({
      query: () => ({
        // Endpoint real do backend: /appointment-orders
        url: "/appointment-orders",
        method: "GET",
        params: {
          page: 1,
          limit: 100,
        },
      }),
      transformResponse: (response: any): Appointment[] => {
        const rawItems = Array.isArray(response)
          ? response
          : (response?.data?.items ?? response?.items ?? response?.data ?? []);

        return rawItems
          .map((item: RawAppointment) => normalizeAppointment(item))
          .filter(
            (item: Appointment | null): item is Appointment => item !== null,
          );
      },
      providesTags: ["Appointment"],
    }),

    updateOwnerAppointmentStatus: builder.mutation<
      Appointment,
      { id: string; status: "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" }
    >({
      query: ({ id, status }) => ({
        // Para concluir, usamos a rota específica do backend, que também
        // registra completedAt. Para ausência, alteramos apenas o status.
        url:
          status === "COMPLETED"
            ? `/appointment-orders/${id}/complete`
            : `/appointment-orders/${id}/status/${status}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Appointment", "Company"],
    }),
  }),
});

const {
  useGetOwnerAppointmentsQuery,
  useUpdateOwnerAppointmentStatusMutation,
} = agendaApi;

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const result = dateOnly(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

function getRange(mode: ViewMode, reference: Date) {
  const current = dateOnly(reference);

  if (mode === "day") {
    const end = new Date(current);
    end.setDate(end.getDate() + 1);
    return { start: current, end };
  }

  if (mode === "week") {
    const start = startOfWeek(current);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const start = new Date(current.getFullYear(), current.getMonth(), 1);
  const end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  return { start, end };
}

function apiDate(date: Date) {
  return date.toISOString();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function money(value?: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "Em atendimento",
    COMPLETED: "Realizado",
    NO_SHOW: "Não compareceu",
    CANCELLED: "Cancelado",
    PENDING: "Pendente",
  };
  return labels[status] ?? status;
}

function statusColors(status: string) {
  if (status === "COMPLETED")
    return { bg: COLORS.successLight, text: COLORS.success };
  if (status === "NO_SHOW" || status === "CANCELLED") {
    return { bg: COLORS.dangerLight, text: COLORS.danger };
  }
  return { bg: COLORS.primaryLight, text: COLORS.primary };
}

function getServiceNames(appointment: Appointment) {
  if (appointment.services?.length) {
    return appointment.services
      .map((item) => item.name)
      .filter(Boolean)
      .join(", ");
  }
  return appointment.service?.name ?? "Serviço não informado";
}

function AppointmentRow({
  appointment,
  onPress,
}: {
  appointment: Appointment;
  onPress: () => void;
}) {
  const colors = statusColors(appointment.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.appointmentRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.appointmentTime}>
          {formatTime(appointment.startsAt)}
        </Text>
        <Text style={styles.appointmentEnd}>
          {formatTime(appointment.endsAt)}
        </Text>
      </View>

      <View style={styles.appointmentLine} />

      <View style={styles.appointmentMain}>
        <View style={styles.appointmentTopLine}>
          <Text style={styles.customerName} numberOfLines={1}>
            {appointment.customer?.name ?? "Cliente não informado"}
          </Text>
          <Text style={styles.appointmentPrice}>
            {money(appointment.totalPrice)}
          </Text>
        </View>

        <Text style={styles.serviceName} numberOfLines={2}>
          {getServiceNames(appointment)}
        </Text>

        <View style={styles.appointmentBottomLine}>
          <View style={styles.meta}>
            <Ionicons
              name="person-outline"
              size={12}
              color={COLORS.textMuted}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {appointment.professional?.name ?? "Profissional não informado"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusLabel(appointment.status)}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={17} color={COLORS.textMuted} />
    </Pressable>
  );
}

function DetailModal({
  appointment,
  onClose,
  onStatus,
  isUpdating,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onStatus: (status: "IN_PROGRESS" | "COMPLETED" | "NO_SHOW") => void;
  isUpdating: boolean;
}) {
  if (!appointment) return null;

  const canUpdate = !["COMPLETED", "NO_SHOW", "CANCELLED"].includes(
    appointment.status,
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>DETALHES DO AGENDAMENTO</Text>
              <Text style={styles.sheetTitle}>Informações completas</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(appointment.customer?.name ?? "C").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCustomer}>
                  {appointment.customer?.name ?? "Cliente não informado"}
                </Text>
                <Text style={styles.detailMuted}>
                  {appointment.customer?.phone ??
                    appointment.customer?.email ??
                    "Contato não informado"}
                </Text>
              </View>
            </View>

            <View style={styles.detailGrid}>
              <DetailItem
                icon="calendar-outline"
                label="Data"
                value={formatDate(new Date(appointment.startsAt))}
              />
              <DetailItem
                icon="time-outline"
                label="Horário"
                value={`${formatTime(appointment.startsAt)} — ${formatTime(appointment.endsAt)}`}
              />
              <DetailItem
                icon="person-outline"
                label="Profissional"
                value={appointment.professional?.name ?? "Não informado"}
              />
              <DetailItem
                icon="business-outline"
                label="Unidade"
                value={appointment.branch?.name ?? "Não informada"}
              />
              <DetailItem
                icon="cash-outline"
                label="Valor previsto"
                value={money(appointment.totalPrice)}
              />
              <DetailItem
                icon="checkmark-circle-outline"
                label="Status"
                value={statusLabel(appointment.status)}
              />
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Serviços contratados
              </Text>
              <Text style={styles.detailSectionText}>
                {getServiceNames(appointment)}
              </Text>
            </View>

            {appointment.notes ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Observações</Text>
                <Text style={styles.detailSectionText}>
                  {appointment.notes}
                </Text>
              </View>
            ) : null}

            {canUpdate ? (
              <View style={styles.actionsArea}>
                <Text style={styles.detailSectionTitle}>
                  {appointment.status === "CONFIRMED"
                    ? "Iniciar atendimento"
                    : appointment.status === "IN_PROGRESS"
                      ? "Finalizar atendimento"
                      : "Ações do atendimento"}
                </Text>

                {appointment.status === "CONFIRMED" ? (
                  <Pressable
                    style={[
                      styles.primaryAction,
                      isUpdating && styles.disabled,
                    ]}
                    disabled={isUpdating}
                    onPress={() => onStatus("IN_PROGRESS")}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name="play-circle-outline"
                        size={19}
                        color="#FFFFFF"
                      />
                    )}
                    <Text style={styles.primaryActionText}>
                      Colocar em atendimento
                    </Text>
                  </Pressable>
                ) : null}

                {appointment.status === "IN_PROGRESS" ? (
                  <Pressable
                    style={[
                      styles.primaryAction,
                      isUpdating && styles.disabled,
                    ]}
                    disabled={isUpdating}
                    onPress={() => onStatus("COMPLETED")}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color="#FFFFFF"
                      />
                    )}
                    <Text style={styles.primaryActionText}>
                      Confirmar procedimento realizado
                    </Text>
                  </Pressable>
                ) : null}

                {appointment.status === "CONFIRMED" ||
                appointment.status === "IN_PROGRESS" ? (
                  <Pressable
                    style={[
                      styles.secondaryAction,
                      isUpdating && styles.disabled,
                    ]}
                    disabled={isUpdating}
                    onPress={() => onStatus("NO_SHOW")}
                  >
                    <Ionicons
                      name="person-remove-outline"
                      size={19}
                      color={COLORS.danger}
                    />
                    <Text style={styles.secondaryActionText}>
                      Cliente não compareceu
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.finalizedNotice}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={COLORS.success}
                />
                <Text style={styles.finalizedNoticeText}>
                  Este agendamento já foi finalizado.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={17} color={COLORS.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailItemLabel}>{label}</Text>
        <Text style={styles.detailItemValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function OwnerAgenda() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  const [mode, setMode] = React.useState<ViewMode>("day");
  const [referenceDate, setReferenceDate] = React.useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<Appointment | null>(null);

  const range = React.useMemo(
    () => getRange(mode, referenceDate),
    [mode, referenceDate],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetOwnerAppointmentsQuery();

  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateOwnerAppointmentStatusMutation();

  const appointments = React.useMemo(() => {
    const startTime = range.start.getTime();
    const endTime = range.end.getTime();

    return (data ?? [])
      .filter((appointment) => {
        const appointmentTime = new Date(appointment.startsAt).getTime();
        return (
          !Number.isNaN(appointmentTime) &&
          appointmentTime >= startTime &&
          appointmentTime < endTime
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [data, range.start, range.end]);

  const changeReference = (amount: number) => {
    const next = new Date(referenceDate);
    if (mode === "day") next.setDate(next.getDate() + amount);
    if (mode === "week") next.setDate(next.getDate() + amount * 7);
    if (mode === "month") next.setMonth(next.getMonth() + amount);
    setReferenceDate(next);
  };

  const rangeLabel =
    mode === "day"
      ? formatLongDate(referenceDate)
      : `${formatDate(range.start)} — ${formatDate(new Date(range.end.getTime() - 86400000))}`;

  async function finishAppointment(
    status: "IN_PROGRESS" | "COMPLETED" | "NO_SHOW",
  ) {
    if (!selectedAppointment) return;
    try {
      await updateStatus({ id: selectedAppointment.id, status }).unwrap();

      Alert.alert(
        "Agendamento atualizado",
        status === "IN_PROGRESS"
          ? "O atendimento foi iniciado."
          : status === "COMPLETED"
            ? "O procedimento foi registrado como realizado."
            : "O cliente foi registrado como não compareceu.",
      );

      setSelectedAppointment(null);
      await refetch();
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.error ??
        "Não foi possível atualizar o status do agendamento.";

      Alert.alert("Não foi possível atualizar", String(message));
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo da LUNARA"
            />
          </View>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.text} />
            {!isMobile && <Text style={styles.backText}>Voltar</Text>}
          </Pressable>
        </View>

        <View style={styles.heading}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>OPERAÇÃO</Text>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>
              Visualize, acompanhe e finalize os atendimentos do empreendimento.
            </Text>
          </View>

          <Pressable
            style={styles.newButton}
            onPress={() => router.push("/appointments/new" as never)}
          >
            <Ionicons name="add" size={17} color="#FFFFFF" />
            {!isMobile && (
              <Text style={styles.newButtonText}>Novo agendamento</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.modeSwitch}>
            {(["day", "week", "month"] as ViewMode[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setMode(item)}
                style={[
                  styles.modeButton,
                  mode === item && styles.modeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === item && styles.modeTextActive,
                  ]}
                >
                  {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.navigation}>
            <Pressable
              style={styles.navButton}
              onPress={() => changeReference(-1)}
            >
              <Ionicons name="chevron-back" size={17} color={COLORS.text} />
            </Pressable>
            <Pressable
              style={styles.todayButton}
              onPress={() => setReferenceDate(new Date())}
            >
              <Text style={styles.todayButtonText}>Hoje</Text>
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => changeReference(1)}
            >
              <Ionicons name="chevron-forward" size={17} color={COLORS.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.periodCard}>
          <View style={styles.periodIcon}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.periodLabel}>PERÍODO SELECIONADO</Text>
            <Text style={styles.periodTitle}>{rangeLabel}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{appointments.length}</Text>
            <Text style={styles.countBadgeLabel}>atendimentos</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.eyebrow}>COMPROMISSOS</Text>
              <Text style={styles.sectionTitle}>
                {mode === "day" ? "Agenda do dia" : "Atendimentos programados"}
              </Text>
            </View>
            <Ionicons name="list-outline" size={21} color={COLORS.primary} />
          </View>

          {isLoading || isFetching ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.stateText}>Carregando agenda...</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={COLORS.danger}
              />
              <Text style={styles.emptyTitle}>
                Não foi possível carregar a agenda
              </Text>
              <Text style={styles.stateText}>
                Verifique sua sessão, a empresa selecionada e a conexão com a
                API.
              </Text>
              <Pressable style={styles.todayButton} onPress={refetch}>
                <Text style={styles.todayButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : appointments.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons
                name="calendar-clear-outline"
                size={40}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
              <Text style={styles.stateText}>
                Não existem atendimentos para este período.
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onPress={() => setSelectedAppointment(appointment)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <DetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onStatus={finishAppointment}
        isUpdating={isUpdating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  page: {
    padding: 22,
    paddingBottom: 50,
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  logo: { width: 100, height: 100 },
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
  backButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  backText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  heading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: "900" },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 600,
  },
  newButton: {
    backgroundColor: COLORS.primary,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  newButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
    flexWrap: "wrap",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    paddingHorizontal: 16,
    minHeight: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: { backgroundColor: COLORS.primaryLight },
  modeText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "800" },
  modeTextActive: { color: COLORS.primaryDark },
  navigation: { flexDirection: "row", alignItems: "center", gap: 7 },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButtonText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  periodCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 19,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  periodIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabel: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  periodTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "capitalize",
  },
  countBadge: { alignItems: "flex-end" },
  countBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 20,
    fontWeight: "900",
  },
  countBadgeLabel: { color: COLORS.textSecondary, fontSize: 9 },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "900" },
  appointmentRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 14,
  },
  timeColumn: { width: 55, alignItems: "flex-start" },
  appointmentTime: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  appointmentEnd: { color: COLORS.textMuted, fontSize: 9, marginTop: 4 },
  appointmentLine: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 5,
    backgroundColor: COLORS.primaryLight,
  },
  appointmentMain: { flex: 1, minWidth: 0, gap: 6 },
  appointmentTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  customerName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  appointmentPrice: { color: COLORS.text, fontSize: 11, fontWeight: "900" },
  serviceName: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },
  appointmentBottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    minWidth: 100,
  },
  metaText: { color: COLORS.textMuted, fontSize: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  statusText: { fontSize: 8, fontWeight: "900" },
  centerState: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 5,
  },
  stateText: { color: COLORS.textSecondary, fontSize: 11, textAlign: "center" },
  pressed: { opacity: 0.72 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(34,30,43,0.45)",
  },
  detailSheet: {
    maxHeight: "91%",
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  sheetTitle: { color: COLORS.text, fontSize: 21, fontWeight: "900" },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    marginBottom: 17,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  detailCustomer: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  detailMuted: { color: COLORS.textSecondary, fontSize: 10, marginTop: 4 },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  detailItem: {
    width: "48%",
    minWidth: 140,
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
  },
  detailItemLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "800" },
  detailItemValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  detailSection: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailSectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  detailSectionText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  actionsArea: { paddingTop: 12, gap: 10 },
  primaryAction: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
    backgroundColor: COLORS.dangerLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "900",
  },
  disabled: { opacity: 0.55 },
  finalizedNotice: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.successLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  finalizedNoticeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "800",
    flex: 1,
  },
});
