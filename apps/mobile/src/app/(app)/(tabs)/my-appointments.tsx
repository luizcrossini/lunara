import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { baseApi } from "@/core/api/baseApi";
import { useAuth } from "@/core/auth/auth-context";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

type CustomerResponse = {
  id: string;
  userId?: string;

  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
  };
};

type AppointmentItem = {
  id: string;
  professionalServiceId: string;

  startsAt: string;
  endsAt: string;

  durationMinutes?: number;
  price?: string | number;

  status?: string;

  professionalService?: {
    service?: {
      id?: string;
      name?: string;
      durationMinutes?: number;
    };

    professional?: {
      id?: string;

      user?: {
        id?: string;
        name?: string;
        photoUrl?: string | null;
      };
    };
  };
};

type Appointment = {
  id: string;
  branchId?: string;
  customerId: string;

  status: string;

  scheduledDate: string;

  totalDurationMinutes?: number;
  totalPrice?: string | number;

  notes?: string | null;

  branch?: {
    id?: string;
    name?: string;

    company?: {
      id?: string;
      name?: string;
      slug?: string;
    };
  };

  items?: AppointmentItem[];
};

type PaginatedAppointments = {
  items: Appointment[];
  total: number;
  page: number;
  limit: number;
};

/*
 * ============================================================
 * API
 * ============================================================
 *
 * Usamos nomes específicos desta tela para não sobrescrever
 * nenhum endpoint que já exista no appointmentOrderApi.
 */

const myAppointmentsApi = baseApi.injectEndpoints({
  overrideExisting: false,

  endpoints: (builder) => ({
    findMyCustomer: builder.query<any, string>({
      query: (email) => ({
        url: "/customers",
        method: "GET",

        params: {
          search: email,
          page: 1,
          limit: 100,
        },
      }),
    }),

    confirmAppointment: builder.mutation<Appointment, string>({
      query: (appointmentId) => {
        console.log("📤 CONFIRMANDO AGENDAMENTO:", appointmentId);

        return {
          url: `/appointment-orders/${appointmentId}/status/CONFIRMED`,
          method: "PATCH",
        };
      },
    }),

    updateAppointmentNotes: builder.mutation<
      Appointment,
      { appointmentId: string; notes: string }
    >({
      query: ({ appointmentId, notes }) => ({
        url: `/appointment-orders/${appointmentId}`,
        method: "PATCH",
        body: {
          notes,
        },
      }),
    }),

    getMyAppointments: builder.query<PaginatedAppointments, string>({
      query: (customerId) => ({
        url: "/appointment-orders",

        method: "GET",

        params: {
          customerId,
          page: 1,
          limit: 100,
        },
      }),

      transformResponse: (response: any): PaginatedAppointments => {
        return (
          response?.data ??
          response ?? {
            items: [],
            total: 0,
            page: 1,
            limit: 100,
          }
        );
      },
    }),
  }),
});

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getCustomerFromResponse(
  response: any,
  userId?: string,
  email?: string,
): CustomerResponse | null {
  const customers: CustomerResponse[] = Array.isArray(response)
    ? response
    : (response?.data?.items ?? response?.data ?? response?.items ?? []);

  if (!customers.length) {
    return null;
  }

  return (
    customers.find(
      (customer) =>
        customer.id &&
        (customer.userId === userId ||
          customer.user?.id === userId ||
          (email &&
            customer.user?.email?.toLowerCase() === email.toLowerCase())),
    ) ?? customers[0]
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "--/--/----";
  }

  /*
   * Para datas no formato YYYY-MM-DD, não usamos
   * new Date(value), evitando deslocamento de fuso.
   */
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatLongDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatPrice(value?: string | number) {
  const price = Number(value ?? 0);

  if (Number.isNaN(price)) {
    return "R$ 0,00";
  }

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "PENDING":
      return "Aguardando confirmação";

    case "CONFIRMED":
      return "Confirmado";

    case "IN_PROGRESS":
      return "Em atendimento";

    case "COMPLETED":
      return "Concluído";

    case "CANCELLED":
      return "Cancelado";

    case "NO_SHOW":
      return "Não compareceu";

    default:
      return "Agendado";
  }
}

function isFinishedStatus(status?: string) {
  return ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(status ?? "");
}

/*
 * ============================================================
 * SCREEN
 * ============================================================
 */

export default function MyAppointmentsScreen() {
  const { user } = useAuth();

  /*
   * ----------------------------------------------------------
   * BUSCAR CUSTOMER PROFILE
   * ----------------------------------------------------------
   *
   * O User.id não é o CustomerProfile.id.
   * Por isso buscamos o customer pelo e-mail do usuário.
   */

  const {
    data: customerResponse,
    isLoading: customerLoading,
    isFetching: customerFetching,
    refetch: refetchCustomer,
  } = myAppointmentsApi.useFindMyCustomerQuery(user?.email ?? "", {
    skip: !user?.email,
  });

  const customer = getCustomerFromResponse(
    customerResponse,
    user?.id,
    user?.email,
  );

  const customerId = customer?.id ?? "";

  /*
   * ----------------------------------------------------------
   * BUSCAR AGENDAMENTOS
   * ----------------------------------------------------------
   */

  const {
    data: appointmentsResponse,
    isLoading: appointmentsLoading,
    isFetching: appointmentsFetching,
    isError,
    refetch: refetchAppointments,
  } = myAppointmentsApi.useGetMyAppointmentsQuery(customerId, {
    skip: !customerId,
  });

  const appointments = appointmentsResponse?.items ?? [];

  const [confirmAppointment, { isLoading: isConfirming }] =
    myAppointmentsApi.useConfirmAppointmentMutation();

  const [isRescheduling, setIsRescheduling] = useState(false);

  const [updateAppointmentNotes, { isLoading: isSavingNotes }] =
    myAppointmentsApi.useUpdateAppointmentNotesMutation();

  const [noteAppointment, setNoteAppointment] = useState<Appointment | null>(
    null,
  );
  const [noteDraft, setNoteDraft] = useState("");

  /*
   * ==========================================================
   * ATUALIZAÇÃO AUTOMÁTICA AO VOLTAR PARA A TELA
   * ==========================================================
   */
  useFocusEffect(
    useCallback(() => {
      if (!customerId) {
        return;
      }

      console.log("🔄 MY APPOINTMENTS: atualizando lista ao entrar na tela...");

      void refetchAppointments();
    }, [customerId, refetchAppointments]),
  );

  /*
   * ----------------------------------------------------------
   * SEPARA PRÓXIMOS E HISTÓRICO
   * ----------------------------------------------------------
   */

  const now = Date.now();

  const upcomingAppointments = appointments
    .filter((appointment) => {
      if (isFinishedStatus(appointment.status)) {
        return false;
      }

      const startsAt =
        appointment.items?.[0]?.startsAt ?? appointment.scheduledDate;

      const date = new Date(startsAt);

      return !Number.isNaN(date.getTime()) && date.getTime() >= now;
    })
    .sort((a, b) => {
      const aDate = new Date(
        a.items?.[0]?.startsAt ?? a.scheduledDate,
      ).getTime();

      const bDate = new Date(
        b.items?.[0]?.startsAt ?? b.scheduledDate,
      ).getTime();

      return aDate - bDate;
    });

  const historyAppointments = appointments
    .filter((appointment) => {
      if (isFinishedStatus(appointment.status)) {
        return true;
      }

      const startsAt =
        appointment.items?.[0]?.startsAt ?? appointment.scheduledDate;

      const date = new Date(startsAt);

      return !Number.isNaN(date.getTime()) && date.getTime() < now;
    })
    .sort((a, b) => {
      const aDate = new Date(
        a.items?.[0]?.startsAt ?? a.scheduledDate,
      ).getTime();

      const bDate = new Date(
        b.items?.[0]?.startsAt ?? b.scheduledDate,
      ).getTime();

      return bDate - aDate;
    });

  const loading = customerLoading || appointmentsLoading;

  const refreshing = customerFetching || appointmentsFetching;

  /*
   * ==========================================================
   * REFRESH
   * ==========================================================
   */

  async function handleRefresh() {
    await refetchCustomer();

    if (customerId) {
      await refetchAppointments();
    }
  }

  /*
   * ==========================================================
   * CARD
   * ==========================================================
   */

  function renderAppointment(appointment: Appointment, isHistory = false) {
    const item = appointment.items?.[0];

    const startsAt = item?.startsAt ?? appointment.scheduledDate;
    const endsAt = item?.endsAt;

    const serviceName = item?.professionalService?.service?.name ?? "Serviço";

    const professionalName =
      item?.professionalService?.professional?.user?.name ?? "Profissional";

    const branchName = appointment.branch?.name ?? "Unidade";

    const canConfirm = !isHistory && appointment.status === "PENDING";

    const canReschedule =
      !isHistory &&
      !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);

    const canAddNote =
      !isHistory &&
      !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);

    async function handleConfirm() {
      console.log("================================");
      console.log("🔥 BOTÃO CONFIRMAR CLICADO");
      console.log("📌 Appointment ID:", appointment.id);
      console.log("📌 Status atual:", appointment.status);
      console.log("================================");

      if (!appointment.id) {
        console.error("❌ Não foi possível confirmar: ID inexistente.");

        Alert.alert("Erro", "Não foi possível identificar o agendamento.");

        return;
      }

      if (appointment.status !== "PENDING") {
        console.warn(
          "⚠️ Agendamento não está mais pendente.",
          appointment.status,
        );

        Alert.alert(
          "Agendamento",
          `Este agendamento já está com status "${getStatusLabel(
            appointment.status,
          )}".`,
        );

        return;
      }

      try {
        console.log("📤 Enviando confirmação para:");

        console.log(`/appointment-orders/${appointment.id}/status/CONFIRMED`);

        const result = await confirmAppointment(appointment.id).unwrap();

        console.log("================================");

        console.log("✅ AGENDAMENTO CONFIRMADO");

        console.log("📌 Novo status:", result?.status);

        console.log("================================");

        Alert.alert(
          "Agendamento confirmado! 🎉",
          "Seu horário foi confirmado com sucesso.",
          [
            {
              text: "OK",
              onPress: async () => {
                console.log("🔄 Atualizando lista de agendamentos...");

                await refetchAppointments();

                console.log("✅ Lista atualizada.");
              },
            },
          ],
        );
      } catch (error: any) {
        console.error("================================");

        console.error("❌ ERRO AO CONFIRMAR AGENDAMENTO");

        console.error("📌 Appointment ID:", appointment.id);

        console.error("📌 Erro:", error);

        console.error("================================");

        const message =
          error?.data?.message ||
          error?.error ||
          error?.message ||
          "Não foi possível confirmar o agendamento.";

        Alert.alert(
          "Erro ao confirmar",
          Array.isArray(message) ? message.join("\n") : String(message),
        );
      }
    }

    function handleReschedule() {
      console.log("🔄 REAGENDAR CLICADO");
      console.log("📌 APPOINTMENT ID:", appointment.id);
      console.log("📌 BRANCH ID:", appointment.branchId);

      const item = appointment.items?.[0];

      if (!item) {
        console.error(
          "❌ Agendamento não possui item.",
          "Appointment ID:",
          appointment.id,
        );
        return;
      }

      const professionalServiceId =
        item.professionalServiceId ?? item.professionalService?.id;

      if (!professionalServiceId) {
        console.error(
          "❌ ProfessionalServiceId não encontrado.",
          "Appointment ID:",
          appointment.id,
          "Item ID:",
          item.id,
        );
        return;
      }

      const branchId = appointment.branchId ?? appointment.branch?.id;

      if (!branchId) {
        console.error(
          "❌ BranchId não encontrado.",
          "Appointment ID:",
          appointment.id,
        );
        return;
      }

      const companyId = appointment.branch?.company?.id;

      const companyName =
        appointment.branch?.company?.name ??
        appointment.branch?.company?.slug ??
        "";

      if (!companyId) {
        console.error(
          "❌ CompanyId não encontrado no agendamento.",
          "Appointment ID:",
          appointment.id,
        );
        return;
      }

      console.log("📌 COMPANY ID:", companyId);
      console.log("📌 COMPANY NAME:", companyName);
      console.log("📌 BRANCH ID:", branchId);
      console.log("📌 PROFESSIONAL SERVICE ID:", professionalServiceId);

      setIsRescheduling(true);

      router.push({
        pathname: "/booking/branch",
        params: {
          companyId: String(companyId),
          companyName: String(companyName),

          branchId: String(branchId),
          branchName: String(appointment.branch?.name ?? ""),

          rescheduleAppointmentId: String(appointment.id),

          rescheduleProfessionalServiceId: String(professionalServiceId),
        },
      });

      console.log("✅ NAVEGAÇÃO PARA REAGENDAMENTO EXECUTADA");
    }

    function handleNote() {
      setNoteAppointment(appointment);
      setNoteDraft(appointment.notes ?? "");
    }

    return (
      <View key={appointment.id} style={styles.appointmentWrapper}>
        <View style={styles.appointmentCard}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(startsAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                timeZone: "America/Sao_Paulo",
              })}
            </Text>

            <Text style={styles.dateMonth}>
              {new Date(startsAt)
                .toLocaleDateString("pt-BR", {
                  month: "short",
                  timeZone: "America/Sao_Paulo",
                })
                .replace(".", "")
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.appointmentContent}>
            <View style={styles.appointmentHeader}>
              <Text numberOfLines={1} style={styles.serviceName}>
                {serviceName}
              </Text>

              <Text style={styles.price}>
                {formatPrice(appointment.totalPrice ?? item?.price)}
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.professional}>
              com {professionalName}
            </Text>

            <View style={styles.infoRow}>
              <IonIcon name="time-outline" />

              <Text style={styles.infoText}>
                {formatTime(startsAt)}
                {" - "}
                {formatTime(endsAt)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <IonIcon name="location-outline" />

              <Text numberOfLines={1} style={styles.infoText}>
                {branchName}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View
                style={[
                  styles.statusBadge,
                  isHistory && styles.historyStatusBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isHistory && styles.historyStatusText,
                  ]}
                >
                  {getStatusLabel(appointment.status)}
                </Text>
              </View>

              <Text style={styles.dateFull}>{formatLongDate(startsAt)}</Text>
            </View>

            {!isHistory && (
              <View style={styles.actionsContainer}>
                {canConfirm && (
                  <Pressable
                    disabled={isConfirming}
                    onPress={() => {
                      console.log("🟢 PRESS NO BOTÃO CONFIRMAR");

                      void handleConfirm();
                    }}
                    style={({ pressed }) => [
                      styles.confirmButton,
                      pressed && styles.actionPressed,
                      isConfirming && styles.actionDisabled,
                    ]}
                  >
                    {isConfirming ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        ✓ Confirmar atendimento
                      </Text>
                    )}
                  </Pressable>
                )}

                {canReschedule && (
                  <Pressable
                    disabled={isRescheduling}
                    onPress={handleReschedule}
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      pressed && styles.actionPressed,
                      isRescheduling && styles.actionDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryActionText}>
                      {isRescheduling ? "Reagendando..." : "↻ Reagendar"}
                    </Text>
                  </Pressable>
                )}

                {canAddNote && (
                  <Pressable
                    disabled={isSavingNotes}
                    onPress={handleNote}
                    style={({ pressed }) => [
                      styles.noteButton,
                      pressed && styles.actionPressed,
                      isSavingNotes && styles.actionDisabled,
                    ]}
                  >
                    <Text style={styles.noteButtonText}>
                      {appointment.notes
                        ? "✎ Editar observação"
                        : "+ Adicionar observação"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {appointment.notes && (
              <View style={styles.notePreview}>
                <Text style={styles.notePreviewLabel}>Observação</Text>

                <Text numberOfLines={2} style={styles.notePreviewText}>
                  {appointment.notes}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  /*
   * Pequeno componente para manter os ícones
   * simples e sem dependência adicional.
   */
  function IonIcon({ name }: { name: "time-outline" | "location-outline" }) {
    return (
      <Text style={styles.infoIcon}>{name === "time-outline" ? "◷" : "⌖"}</Text>
    );
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <View style={styles.container}>
      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Meus agendamentos</Text>

          <Text style={styles.subtitle}>
            Consulte seus horários e histórico.
          </Text>
        </View>
      </View>

      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles.loadingColor.color} />

            <Text style={styles.loadingText}>
              Carregando seus agendamentos...
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚠️</Text>

            <Text style={styles.emptyTitle}>Não foi possível carregar</Text>

            <Text style={styles.emptyText}>
              Verifique sua conexão e tente novamente.
            </Text>

            <Pressable onPress={handleRefresh} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : upcomingAppointments.length === 0 &&
          historyAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyCalendarIcon}>📅</Text>
            </View>

            <Text style={styles.emptyTitle}>
              Você ainda não tem agendamentos
            </Text>

            <Text style={styles.emptyText}>
              Encontre um serviço e escolha o melhor horário para você.
            </Text>

            <Pressable
              onPress={() => router.push("/booking")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Criar agendamento</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ============================================== */}
            {/* PRÓXIMOS */}
            {/* ============================================== */}

            {upcomingAppointments.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Próximos agendamentos</Text>

                  <Text style={styles.countText}>
                    {upcomingAppointments.length}
                  </Text>
                </View>

                {upcomingAppointments.map((appointment) =>
                  renderAppointment(appointment),
                )}
              </>
            )}

            {/* ============================================== */}
            {/* NOVO AGENDAMENTO */}
            {/* ============================================== */}

            <Pressable
              onPress={() => router.push("/booking")}
              style={({ pressed }) => [
                styles.newAppointmentButton,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.newAppointmentIcon}>
                <Text style={styles.newAppointmentPlus}>+</Text>
              </View>

              <View style={styles.newAppointmentContent}>
                <Text style={styles.newAppointmentTitle}>Novo agendamento</Text>

                <Text style={styles.newAppointmentText}>
                  Escolha um serviço e reserve seu horário.
                </Text>
              </View>

              <Text style={styles.newAppointmentArrow}>›</Text>
            </Pressable>

            {/* ============================================== */}
            {/* HISTÓRICO */}
            {/* ============================================== */}

            {historyAppointments.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, styles.historyTitle]}>
                  Histórico
                </Text>

                {historyAppointments.map((appointment) =>
                  renderAppointment(appointment, true),
                )}
              </>
            )}
          </>
        )}

        {noteAppointment && (
          <View style={styles.noteEditorOverlay}>
            <View style={styles.noteEditorCard}>
              <Text style={styles.noteEditorTitle}>
                Observação do atendimento
              </Text>

              <Text style={styles.noteEditorSubtitle}>
                Adicione uma informação que você gostaria que o estabelecimento
                saiba antes do atendimento.
              </Text>

              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Ex.: Tenho alergia a determinado produto..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                style={styles.noteInput}
              />

              <Text style={styles.noteCounter}>{noteDraft.length}/500</Text>

              <View style={styles.noteEditorActions}>
                <Pressable
                  disabled={isSavingNotes}
                  onPress={() => {
                    setNoteAppointment(null);
                    setNoteDraft("");
                  }}
                  style={styles.noteCancelButton}
                >
                  <Text style={styles.noteCancelText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  disabled={isSavingNotes}
                  onPress={async () => {
                    if (!noteAppointment) return;

                    try {
                      await updateAppointmentNotes({
                        appointmentId: noteAppointment.id,
                        notes: noteDraft.trim(),
                      }).unwrap();

                      setNoteAppointment(null);
                      setNoteDraft("");

                      Alert.alert(
                        "Observação salva",
                        "Sua observação foi adicionada ao agendamento.",
                      );

                      await refetchAppointments();
                    } catch (error: any) {
                      const message =
                        error?.data?.message ||
                        error?.error ||
                        "Não foi possível salvar a observação.";

                      Alert.alert(
                        "Erro",
                        Array.isArray(message)
                          ? message.join("\n")
                          : String(message),
                      );
                    }
                  }}
                  style={styles.noteSaveButton}
                >
                  {isSavingNotes ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.noteSaveText}>Salvar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAFD",
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 24,
    color: "#111827",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 50,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  countText: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
    backgroundColor: "#F9E8F1",
    color: "#B55A91",
    fontSize: 11,
    fontWeight: "800",
  },

  appointmentWrapper: {
    marginBottom: 14,
  },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#EADDE5",

    borderRadius: 18,

    padding: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,

    elevation: 2,
  },

  dateBox: {
    width: 70,
    height: 78,

    borderRadius: 16,

    backgroundColor: "#F9E8F1",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 15,
  },

  dateDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "#B55A91",
  },

  dateMonth: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#9E6C88",
  },

  appointmentContent: {
    flex: 1,
    minWidth: 0,
  },

  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  professional: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  infoIcon: {
    width: 22,
    fontSize: 16,
    color: "#B55A91",
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 11,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EAF7EE",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3D9B5E",
  },

  historyStatusBadge: {
    backgroundColor: "#F3F4F6",
  },

  historyStatusText: {
    color: "#6B7280",
  },

  dateFull: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "capitalize",
  },

  arrow: {
    marginLeft: 9,
    fontSize: 28,
    color: "#9CA3AF",
  },

  actionsContainer: {
    marginTop: 14,
    gap: 8,
  },

  confirmButton: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#B55A91",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  confirmButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  secondaryActionButton: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D9B5C8",
    backgroundColor: "#FFF9FC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  secondaryActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9D4D7D",
  },

  noteButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  noteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  notePreview: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#F8F5F7",
  },

  notePreviewLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9D4D7D",
    marginBottom: 3,
  },

  notePreviewText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5F6368",
  },

  actionPressed: {
    opacity: 0.72,
  },

  actionDisabled: {
    opacity: 0.55,
  },

  noteEditorOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  noteEditorCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },

  noteEditorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  noteEditorSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },

  noteInput: {
    minHeight: 120,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5D7DF",
    backgroundColor: "#FCFAFD",
    color: "#111827",
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  noteCounter: {
    marginTop: 5,
    textAlign: "right",
    fontSize: 11,
    color: "#9CA3AF",
  },

  noteEditorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },

  noteCancelButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  noteCancelText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B5563",
  },

  noteSaveButton: {
    minHeight: 44,
    minWidth: 100,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B55A91",
  },

  noteSaveText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  newAppointmentButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFF7FB",

    borderWidth: 1,
    borderColor: "#E8C7D9",

    borderRadius: 16,

    padding: 14,

    marginTop: 6,
    marginBottom: 30,
  },

  newAppointmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#F9E8F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  newAppointmentPlus: {
    fontSize: 27,
    fontWeight: "400",
    color: "#B55A91",
    lineHeight: 30,
  },

  newAppointmentContent: {
    flex: 1,
  },

  newAppointmentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  newAppointmentText: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  newAppointmentArrow: {
    marginLeft: 10,
    fontSize: 25,
    color: "#B55A91",
  },

  historyTitle: {
    marginBottom: 14,
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingColor: {
    color: "#B55A91",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  emptyContainer: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#F9E8F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyCalendarIcon: {
    fontSize: 34,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    maxWidth: 420,
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 24,
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cardPressed: {
    opacity: 0.75,
  },
});
