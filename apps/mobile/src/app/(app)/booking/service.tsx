import { useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  Service,
  useGetServicesByBranchQuery,
} from "@/features/service/api/serviceApi";

export default function BookingServiceScreen() {
  const {
    companyId,
    companyName,
    branchId,
    branchName,

    // Present only when this screen was opened from
    // "Meus agendamentos" -> "Reagendar".
    rescheduleAppointmentId,
    rescheduleProfessionalServiceId,
  } = useLocalSearchParams<{
    companyId: string;
    companyName: string;
    branchId: string;
    branchName: string;

    rescheduleAppointmentId?: string;
    rescheduleProfessionalServiceId?: string;
  }>();

  const isRescheduling = Boolean(rescheduleAppointmentId);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const {
    data: services = [],
    isLoading,
    isError,
    refetch,
  } = useGetServicesByBranchQuery(
    {
      companyId,
      branchId,
    },
    {
      skip: !companyId || !branchId,
    },
  );

  function toggleService(serviceId: string) {
    setSelectedServices((previous) => {
      const alreadySelected = previous.includes(serviceId);

      if (alreadySelected) {
        return previous.filter((id) => id !== serviceId);
      }

      return [...previous, serviceId];
    });
  }

  const selectedServiceData = useMemo(() => {
    return services.filter((service) => selectedServices.includes(service.id));
  }, [services, selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServiceData.reduce(
      (total, service) => total + service.durationMinutes,
      0,
    );
  }, [selectedServiceData]);

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
  }

  function handleContinue() {
    if (selectedServices.length === 0) {
      return;
    }

    console.log(
      isRescheduling
        ? "🔄 BOOKING SERVICE - REAGENDAMENTO"
        : "🆕 BOOKING SERVICE - NOVO AGENDAMENTO",
    );

    router.push({
      pathname: "/booking/professional",

      params: {
        companyId: String(companyId),
        companyName: String(companyName),

        branchId: String(branchId),
        branchName: String(branchName),

        serviceIds: selectedServices.join(","),

        serviceNames: selectedServiceData
          .map((service) => service.name)
          .join(","),

        ...(isRescheduling
          ? {
              rescheduleAppointmentId: String(rescheduleAppointmentId),

              rescheduleProfessionalServiceId: String(
                rescheduleProfessionalServiceId ?? "",
              ),
            }
          : {}),
      },
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* =====================
              BACK
          ===================== */}

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="arrow-back" size={22} color="#463B48" />

            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>

          {/* =====================
              HEADER
          ===================== */}

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="cut-outline" size={28} color="#B55A91" />
            </View>

            <Text style={styles.step}>
              {isRescheduling ? "REAGENDAMENTO" : "PASSO 2 DE 5"}
            </Text>

            <Text style={styles.title}>Escolha os serviços</Text>

            <Text style={styles.subtitle}>
              Selecione um ou mais serviços que deseja realizar em{" "}
              <Text style={styles.companyName}>{companyName}</Text>.
            </Text>

            <View style={styles.branchInfo}>
              <Ionicons name="location-outline" size={15} color="#B55A91" />

              <Text style={styles.branchInfoText}>{branchName}</Text>
            </View>

            {isRescheduling && (
              <View style={styles.rescheduleBadge}>
                <Ionicons name="refresh-outline" size={15} color="#9D4D7D" />

                <Text style={styles.rescheduleBadgeText}>
                  Escolha o serviço para o novo horário
                </Text>
              </View>
            )}
          </View>

          {/* =====================
              SERVICES
          ===================== */}

          <View style={styles.servicesContainer}>
            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#B55A91" />

                <Text style={styles.loadingText}>Carregando serviços...</Text>
              </View>
            )}

            {isError && (
              <View style={styles.centerState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color="#B55A91"
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Não foi possível carregar os serviços
                </Text>

                <Text style={styles.emptyText}>
                  Verifique sua conexão e tente novamente.
                </Text>

                <Pressable onPress={refetch} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </Pressable>
              </View>
            )}

            {!isLoading &&
              !isError &&
              services.map((service: Service) => {
                const isSelected = selectedServices.includes(service.id);

                return (
                  <Pressable
                    key={service.id}
                    onPress={() => toggleService(service.id)}
                    style={({ pressed }) => [
                      styles.serviceCard,

                      isSelected && styles.serviceCardSelected,

                      pressed && styles.serviceCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.serviceIcon,

                        service.color
                          ? {
                              backgroundColor: `${service.color}20`,
                            }
                          : undefined,
                      ]}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={24}
                        color={service.color ?? "#B55A91"}
                      />
                    </View>

                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceName}>{service.name}</Text>

                      {service.description && (
                        <Text
                          style={styles.serviceDescription}
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      )}

                      <View style={styles.serviceDetails}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#9B8F99"
                        />

                        <Text style={styles.durationText}>
                          {formatDuration(service.durationMinutes)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.checkbox,

                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })}

            {!isLoading && !isError && services.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="cut-outline" size={32} color="#B55A91" />
                </View>

                <Text style={styles.emptyTitle}>Nenhum serviço encontrado</Text>

                <Text style={styles.emptyText}>
                  Esta unidade ainda não possui serviços disponíveis para
                  agendamento.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* =====================
          FOOTER SELECTION
      ===================== */}

      {selectedServices.length > 0 && (
        <View style={styles.selectionFooter}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedServices.length}{" "}
              {selectedServices.length === 1
                ? "serviço selecionado"
                : "serviços selecionados"}
            </Text>

            <Text style={styles.selectionDuration}>
              Duração estimada: {formatDuration(totalDuration)}
            </Text>
          </View>

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>

            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAFD",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 130,
  },

  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* =====================
      BACK
  ===================== */

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: 28,
  },

  backButtonPressed: {
    opacity: 0.65,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#463B48",
  },

  /* =====================
      HEADER
  ===================== */

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F4E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  step: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#B55A91",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2E2430",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    maxWidth: 500,
    fontSize: 14,
    lineHeight: 21,
    color: "#7B7280",
    textAlign: "center",
  },

  companyName: {
    fontWeight: "700",
    color: "#463B48",
  },

  branchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F9F1F5",
  },

  branchInfoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B55A91",
  },

  rescheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8EDF4",
    borderWidth: 1,
    borderColor: "#E8D1DE",
  },

  rescheduleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9D4D7D",
  },

  /* =====================
      SERVICES
  ===================== */

  servicesContainer: {
    gap: 14,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,
    borderColor: "#E8DDE7",

    padding: 18,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,

    elevation: 2,
  },

  serviceCardSelected: {
    borderColor: "#B55A91",
    borderWidth: 2,
    backgroundColor: "#FFF9FC",
  },

  serviceCardPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,

    backgroundColor: "#F9F1F5",

    alignItems: "center",
    justifyContent: "center",
  },

  serviceContent: {
    flex: 1,
  },

  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 4,
  },

  serviceDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B7280",
    marginBottom: 8,
  },

  serviceDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  durationText: {
    fontSize: 12,
    color: "#9B8F99",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,

    borderWidth: 2,
    borderColor: "#D8CCD5",

    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#B55A91",
    borderColor: "#B55A91",
  },

  /* =====================
      FOOTER
  ===================== */

  selectionFooter: {
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#E8DDE7",

    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,

    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  selectionInfo: {
    flex: 1,
  },

  selectionCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 3,
  },

  selectionDuration: {
    fontSize: 12,
    color: "#7B7280",
  },

  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    backgroundColor: "#B55A91",

    paddingHorizontal: 20,
    paddingVertical: 14,

    borderRadius: 14,
  },

  continueButtonPressed: {
    opacity: 0.8,
  },

  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* =====================
      STATES
  ===================== */

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: "#7B7280",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F4E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2430",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7B7280",
    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#B55A91",
  },

  retryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
