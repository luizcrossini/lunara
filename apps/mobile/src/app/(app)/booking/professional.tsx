import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useGetPublicProfessionalsQuery } from "@/features/professional/api/professionalApi";

export default function BookingProfessionalScreen() {
  const {
    companyId,
    companyName,

    branchId,
    branchName,

    serviceIds,
    serviceNames,

    customerId,

    // Present only in the reschedule flow.
    rescheduleAppointmentId,
    rescheduleProfessionalServiceId,
  } = useLocalSearchParams<{
    companyId: string;
    companyName?: string;

    branchId: string;
    branchName?: string;

    serviceIds: string;
    serviceNames?: string;

    customerId?: string;

    rescheduleAppointmentId?: string;
    rescheduleProfessionalServiceId?: string;
  }>();

  const isRescheduling = Boolean(rescheduleAppointmentId);
  const serviceIdsArray = serviceIds
    ? String(serviceIds).split(",").filter(Boolean)
    : [];

  const firstServiceId = serviceIdsArray[0];

  const {
    data: professionals = [],
    isLoading,
    isError,
    refetch,
  } = useGetPublicProfessionalsQuery(
    {
      companyId: String(companyId),
      branchId: String(branchId),
      serviceId: firstServiceId,
    },
    {
      skip: !companyId || !branchId || !firstServiceId,
    },
  );

  function handleSelectProfessional(
    professionalBranch: (typeof professionals)[number],
  ) {
    const professional = professionalBranch.professional;

    /*
  ========================================
  BUSCA O PROFESSIONAL SERVICE
  ========================================
  */

    const selectedServiceIds = String(serviceIds ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const professionalServiceIds =
      professional.professionalServices
        ?.filter((professionalService) =>
          selectedServiceIds.includes(professionalService.serviceId),
        )
        .map((professionalService) => professionalService.id) ?? [];

    /*
  ========================================
  VALIDA
  ========================================
  */

    if (professionalServiceIds.length === 0) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o serviço deste profissional.",
      );

      return;
    }

    /*
  ========================================
  NAVEGA
  ========================================
  */

    router.push({
      pathname: "/booking/date-time",

      params: {
        companyId: String(companyId ?? ""),
        companyName: String(companyName ?? ""),

        branchId: String(branchId ?? ""),
        branchName: String(branchName ?? ""),

        serviceIds: String(serviceIds ?? ""),
        serviceNames: String(serviceNames ?? ""),

        professionalBranchId: String(professionalBranch.id),

        professionalId: String(professional.id),
        professionalName: String(professional.user.name),

        professionalServiceIds: professionalServiceIds.join(","),

        ...(isRescheduling
          ? {
              rescheduleAppointmentId: String(rescheduleAppointmentId),

              rescheduleProfessionalServiceId: String(
                rescheduleProfessionalServiceId ??
                  professionalServiceIds[0] ??
                  "",
              ),
            }
          : {}),
      },
    });
  }
  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* BACK */}

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

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={28} color="#B55A91" />
            </View>

            <Text style={styles.step}>
              {isRescheduling ? "REAGENDAMENTO" : "PASSO 3 DE 5"}
            </Text>

            <Text style={styles.title}>Escolha um profissional</Text>

            <Text style={styles.subtitle}>
              Selecione quem realizará seu atendimento de{" "}
              <Text style={styles.highlight}>{serviceNames}</Text>.
            </Text>

            {isRescheduling && (
              <View style={styles.rescheduleBadge}>
                <Ionicons name="refresh-outline" size={15} color="#9D4D7D" />

                <Text style={styles.rescheduleBadgeText}>
                  Escolha o profissional para o novo horário
                </Text>
              </View>
            )}
          </View>

          {/* LOADING */}

          {isLoading && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#B55A91" />

              <Text style={styles.loadingText}>
                Carregando profissionais...
              </Text>
            </View>
          )}

          {/* ERROR */}

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
                Não foi possível carregar os profissionais
              </Text>

              <Text style={styles.emptyText}>
                Verifique sua conexão e tente novamente.
              </Text>

              <Pressable onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {/* PROFESSIONALS */}

          {!isLoading &&
            !isError &&
            professionals.map((professionalBranch) => {
              const professional = professionalBranch.professional;

              const user = professional.user;

              return (
                <Pressable
                  key={professionalBranch.id}
                  onPress={() => handleSelectProfessional(professionalBranch)}
                  style={({ pressed }) => [
                    styles.professionalCard,
                    pressed && styles.professionalCardPressed,
                  ]}
                >
                  {/* PHOTO */}

                  {user.photoUrl ? (
                    <Image
                      source={{
                        uri: user.photoUrl,
                      }}
                      style={styles.photo}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        {
                          backgroundColor:
                            professionalBranch.color ?? "#B55A91",
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitials}>
                        {getInitials(user.name)}
                      </Text>
                    </View>
                  )}

                  {/* CONTENT */}

                  <View style={styles.professionalContent}>
                    <Text style={styles.professionalName}>{user.name}</Text>

                    {professional.specialties && (
                      <Text style={styles.specialties} numberOfLines={2}>
                        {professional.specialties}
                      </Text>
                    )}

                    {professional.bio && (
                      <Text style={styles.bio} numberOfLines={2}>
                        {professional.bio}
                      </Text>
                    )}
                  </View>

                  {/* ARROW */}

                  <Ionicons name="chevron-forward" size={22} color="#B55A91" />
                </Pressable>
              );
            })}

          {/* EMPTY */}

          {!isLoading && !isError && professionals.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color="#B55A91" />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhum profissional disponível
              </Text>

              <Text style={styles.emptyText}>
                Não encontramos profissionais disponíveis para este serviço
                nesta unidade.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },

  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* BACK */

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

  /* HEADER */

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

  highlight: {
    fontWeight: "700",
    color: "#463B48",
  },

  rescheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
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

  /* PROFESSIONALS */

  professionalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,
    borderColor: "#E8DDE7",

    padding: 18,

    marginBottom: 14,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  professionalCardPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  photo: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },

  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  professionalContent: {
    flex: 1,
  },

  professionalName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 5,
  },

  specialties: {
    fontSize: 12,
    lineHeight: 18,
    color: "#B55A91",
    marginBottom: 4,
  },

  bio: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B7280",
  },

  /* STATES */

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
