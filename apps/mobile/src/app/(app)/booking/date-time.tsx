import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { useMemo, useState } from "react";

import { useGetPublicAvailabilityQuery } from "@/features/appointment/api/appointmentAvailabilityApi";
import { baseApi } from "@/core/api/baseApi";

const appointmentOrderApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    rescheduleAppointment: builder.mutation<
      unknown,
      {
        appointmentId: string;
        scheduledDate: string;
        items: {
          professionalServiceId: string;
          startsAt: string;
          endsAt: string;
        }[];
      }
    >({
      query: ({ appointmentId, scheduledDate, items }) => ({
        url: `/appointment-orders/${appointmentId}/reschedule`,
        method: "PATCH",
        body: { scheduledDate, items },
      }),
    }),
  }),
});

const { useRescheduleAppointmentMutation } = appointmentOrderApi;

interface AvailableSlot {
  start: string;
  end: string;
}

export default function BookingDateTimeScreen() {
  const {
    companyId,
    companyName,

    branchId,
    branchName,

    serviceIds,
    serviceNames,

    professionalBranchId,

    professionalId,
    professionalName,

    professionalServiceIds,

    customerId,

    rescheduleAppointmentId,
    rescheduleProfessionalServiceId,
  } = useLocalSearchParams<{
    companyId: string;
    companyName?: string;

    branchId: string;
    branchName?: string;

    serviceIds: string;
    serviceNames?: string;

    professionalBranchId?: string;

    professionalId: string;
    professionalName?: string;

    professionalServiceIds?: string;

    customerId?: string;

    rescheduleAppointmentId?: string;
    rescheduleProfessionalServiceId?: string;
  }>();

  const isRescheduling = Boolean(rescheduleAppointmentId);

  const [rescheduleAppointment, { isLoading: isReschedulingAppointment }] =
    useRescheduleAppointmentMutation();

  /*
  ========================================
  GERA AS PRÓXIMAS DATAS
  ========================================
  */

  const availableDates = useMemo(() => {
    const dates: Date[] = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date();

      date.setDate(date.getDate() + i);

      dates.push(date);
    }

    return dates;
  }, []);

  /*
  ========================================
  FORMATA DATA PARA API
  YYYY-MM-DD
  ========================================
  */

  function formatDateForApi(date: Date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
  ========================================
  FORMATA HORÁRIO
  ========================================
  */

  function formatTime(value: string) {
    if (/^\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return value;
  }

  /*
  ========================================
  DATA E HORÁRIO SELECIONADOS
  ========================================
  */

  const [selectedDate, setSelectedDate] = useState(
    formatDateForApi(availableDates[0]),
  );

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  /*
  ========================================
  CONVERTE SERVICES
  ========================================
  */

  const parsedServiceIds = useMemo(() => {
    if (!serviceIds) {
      return [];
    }

    return String(serviceIds)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [serviceIds]);

  /*
  ========================================
  API
  ========================================
  */

  const { data, isLoading, isFetching, isError, error } =
    useGetPublicAvailabilityQuery(
      {
        companyId,
        branchId,
        professionalId,
        date: selectedDate,
        serviceIds: parsedServiceIds,
      },
      {
        skip:
          !companyId ||
          !branchId ||
          !professionalId ||
          parsedServiceIds.length === 0,
      },
    );

  const availableSlots: AvailableSlot[] = (data?.availableSlots ??
    []) as AvailableSlot[];

  /*
  ========================================
  SELECIONAR DATA
  ========================================
  */

  function handleSelectDate(date: Date) {
    const formattedDate = formatDateForApi(date);

    setSelectedDate(formattedDate);

    setSelectedSlot(null);
  }

  /*
  ========================================
  SELECIONAR HORÁRIO
  ========================================
  */

  function handleSelectTime(slot: AvailableSlot) {
    setSelectedSlot(slot);
  }

  /*
  ========================================
  CONTINUAR
  ========================================
  */

  async function handleContinue() {
    if (!selectedSlot) {
      return;
    }

    if (isRescheduling) {
      const professionalServiceId = String(
        rescheduleProfessionalServiceId ||
          String(professionalServiceIds ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)[0] ||
          "",
      );

      if (!rescheduleAppointmentId || !professionalServiceId) {
        console.error("❌ Dados de reagendamento incompletos", {
          rescheduleAppointmentId,
          professionalServiceId,
        });
        return;
      }

      try {
        console.log("🔄 REAGENDANDO AGENDAMENTO");
        console.log("📌 ID:", rescheduleAppointmentId);
        console.log("📌 DATA:", selectedDate);
        console.log("📌 INÍCIO:", selectedSlot.start);
        console.log("📌 FIM:", selectedSlot.end);

        await rescheduleAppointment({
          appointmentId: String(rescheduleAppointmentId),
          scheduledDate: selectedDate,
          items: [
            {
              professionalServiceId,
              startsAt: selectedSlot.start,
              endsAt: selectedSlot.end,
            },
          ],
        }).unwrap();

        console.log("✅ REAGENDAMENTO CONCLUÍDO");

        router.replace("/(app)/(tabs)/my-appointments");
        return;
      } catch (error: any) {
        console.error("❌ ERRO AO REAGENDAR:", error);

        const message =
          error?.data?.message ||
          error?.error ||
          error?.message ||
          "Não foi possível reagendar o atendimento.";

        alert(Array.isArray(message) ? message.join("\n") : String(message));
        return;
      }
    }

    router.push({
      pathname: "/booking/customer",
      params: {
        companyId: String(companyId),
        companyName: String(companyName ?? ""),
        branchId: String(branchId),
        branchName: String(branchName ?? ""),
        serviceIds: String(serviceIds),
        serviceNames: String(serviceNames ?? ""),
        professionalBranchId: String(professionalBranchId ?? ""),
        professionalId: String(professionalId),
        professionalName: String(professionalName ?? ""),
        professionalServiceIds: String(professionalServiceIds ?? ""),
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...(customerId ? { customerId: String(customerId) } : {}),
      },
    });
  }

  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>
            {isRescheduling ? "Escolha o novo horário" : "Escolha o horário"}
          </Text>

          <Text style={styles.subtitle}>
            {isRescheduling
              ? "Selecione a nova data e horário para o seu atendimento."
              : "Selecione a melhor data e horário para você."}
          </Text>
        </View>
      </View>

      {/* RESUMO */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Profissional</Text>

        <Text style={styles.summaryValue}>
          {professionalName || "Profissional selecionado"}
        </Text>

        <Text style={styles.summaryLabel}>Serviços</Text>

        <Text style={styles.summaryValue}>
          {serviceNames || "Serviço selecionado"}
        </Text>
      </View>

      {/* DATAS */}

      <Text style={styles.sectionTitle}>Escolha uma data</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesContainer}
      >
        {availableDates.map((date) => {
          const formattedDate = formatDateForApi(date);

          const isSelected = formattedDate === selectedDate;

          const weekDay = date.toLocaleDateString("pt-BR", {
            weekday: "short",
          });

          const day = date.getDate();

          const month = date.toLocaleDateString("pt-BR", {
            month: "short",
          });

          return (
            <Pressable
              key={formattedDate}
              onPress={() => handleSelectDate(date)}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
            >
              <Text
                style={[styles.weekDay, isSelected && styles.dateTextSelected]}
              >
                {weekDay.replace(".", "")}
              </Text>

              <Text style={[styles.day, isSelected && styles.dateTextSelected]}>
                {day}
              </Text>

              <Text
                style={[styles.month, isSelected && styles.dateTextSelected]}
              >
                {month.replace(".", "")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* HORÁRIOS */}

      <View style={styles.timesHeader}>
        <Text style={styles.sectionTitle}>Horários disponíveis</Text>

        <Text style={styles.selectedDateText}>
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* LOADING */}

        {(isLoading || isFetching) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Buscando horários disponíveis...
            </Text>
          </View>
        )}

        {/* ERROR */}

        {isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>
              Não foi possível carregar os horários.
            </Text>

            <Text style={styles.errorText}>{JSON.stringify(error)}</Text>
          </View>
        )}

        {/* EMPTY */}

        {!isLoading &&
          !isFetching &&
          !isError &&
          availableSlots.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhum horário disponível</Text>

              <Text style={styles.emptyText}>Tente selecionar outra data.</Text>
            </View>
          )}

        {/* HORÁRIOS */}

        {!isLoading && !isFetching && !isError && availableSlots.length > 0 && (
          <View style={styles.timesGrid}>
            {availableSlots.map((slot) => {
              const isSelected =
                selectedSlot?.start === slot.start &&
                selectedSlot?.end === slot.end;

              return (
                <Pressable
                  key={`${slot.start}-${slot.end}`}
                  onPress={() => handleSelectTime(slot)}
                  style={[
                    styles.timeButton,

                    isSelected && styles.timeButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,

                      isSelected && styles.timeTextSelected,
                    ]}
                  >
                    {formatTime(slot.start)}
                  </Text>

                  <Text
                    style={[
                      styles.timeEndText,

                      isSelected && styles.timeTextSelected,
                    ]}
                  >
                    até {formatTime(slot.end)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          disabled={!selectedSlot || isReschedulingAppointment}
          style={[
            styles.continueButton,
            (!selectedSlot || isReschedulingAppointment) &&
              styles.continueButtonDisabled,
          ]}
        >
          {isReschedulingAppointment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>
              {isRescheduling ? "Confirmar novo horário" : "Continuar"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/*
========================================
STYLES
========================================
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#FFFFFF",

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

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#F5F5F5",
  },

  backText: {
    fontSize: 24,

    fontWeight: "500",
  },

  title: {
    fontSize: 24,

    fontWeight: "700",

    color: "#111827",
  },

  subtitle: {
    marginTop: 4,

    fontSize: 14,

    color: "#6B7280",
  },

  summaryCard: {
    marginHorizontal: 24,

    padding: 16,

    borderRadius: 16,

    backgroundColor: "#F9FAFB",

    marginBottom: 28,
  },

  summaryLabel: {
    fontSize: 12,

    color: "#9CA3AF",

    marginTop: 4,
  },

  summaryValue: {
    fontSize: 15,

    fontWeight: "600",

    color: "#111827",

    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: "#111827",

    paddingHorizontal: 24,

    marginBottom: 14,
  },

  datesContainer: {
    paddingHorizontal: 24,

    gap: 10,

    paddingBottom: 24,
  },

  dateCard: {
    width: 70,

    height: 92,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#E5E7EB",

    alignItems: "center",

    justifyContent: "center",

    gap: 3,
  },

  dateCardSelected: {
    backgroundColor: "#111827",

    borderColor: "#111827",
  },

  weekDay: {
    fontSize: 12,

    color: "#6B7280",

    textTransform: "capitalize",
  },

  day: {
    fontSize: 24,

    fontWeight: "700",

    color: "#111827",
  },

  month: {
    fontSize: 12,

    color: "#6B7280",

    textTransform: "capitalize",
  },

  dateTextSelected: {
    color: "#FFFFFF",
  },

  timesHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingRight: 24,
  },

  selectedDateText: {
    fontSize: 13,

    color: "#6B7280",

    marginBottom: 14,
  },

  content: {
    paddingHorizontal: 24,

    paddingBottom: 100,
  },

  loadingContainer: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 40,

    gap: 14,
  },

  loadingText: {
    color: "#6B7280",
  },

  errorContainer: {
    padding: 20,

    borderRadius: 16,

    backgroundColor: "#FEF2F2",
  },

  errorTitle: {
    fontWeight: "700",

    color: "#991B1B",
  },

  errorText: {
    marginTop: 8,

    fontSize: 12,

    color: "#B91C1C",
  },

  emptyContainer: {
    alignItems: "center",

    paddingVertical: 50,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: "#111827",
  },

  emptyText: {
    marginTop: 8,

    color: "#6B7280",
  },

  timesGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 12,
  },

  timeButton: {
    width: "30%",

    paddingVertical: 12,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: "#E5E7EB",

    alignItems: "center",

    justifyContent: "center",
  },

  timeButtonSelected: {
    backgroundColor: "#111827",

    borderColor: "#111827",
  },

  timeText: {
    fontSize: 16,

    fontWeight: "600",

    color: "#111827",
  },

  timeEndText: {
    marginTop: 3,

    fontSize: 11,

    color: "#6B7280",
  },

  timeTextSelected: {
    color: "#FFFFFF",
  },

  footer: {
    paddingHorizontal: 24,

    paddingVertical: 16,

    borderTopWidth: 1,

    borderColor: "#F3F4F6",

    backgroundColor: "#FFFFFF",
  },

  continueButton: {
    height: 54,

    borderRadius: 14,

    backgroundColor: "#111827",

    alignItems: "center",

    justifyContent: "center",
  },

  continueButtonDisabled: {
    opacity: 0.4,
  },

  continueText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "700",
  },
});
