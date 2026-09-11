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

import { useGetBranchesByCompanyQuery } from "@/features/branch/api/branchApi";

export default function BookingBranchScreen() {
  const {
    companyId,
    companyName,

    // Parâmetros usados somente no reagendamento
    rescheduleAppointmentId,
    rescheduleProfessionalServiceId,
  } = useLocalSearchParams<{
    companyId: string;
    companyName: string;

    rescheduleAppointmentId?: string;
    rescheduleProfessionalServiceId?: string;
  }>();

  const isRescheduling = Boolean(rescheduleAppointmentId);

  const {
    data: branches = [],
    isLoading,
    isError,
    refetch,
  } = useGetBranchesByCompanyQuery(companyId, {
    skip: !companyId,
  });

  function handleSelectBranch(branch: (typeof branches)[number]) {
    console.log("🏢 UNIDADE SELECIONADA:", branch.id);

    if (isRescheduling) {
      console.log("🔄 FLUXO DE REAGENDAMENTO");

      console.log("📌 APPOINTMENT ID:", rescheduleAppointmentId);

      console.log(
        "📌 PROFESSIONAL SERVICE ID:",
        rescheduleProfessionalServiceId,
      );
    } else {
      console.log("🆕 FLUXO DE NOVO AGENDAMENTO");
    }

    router.push({
      pathname: "/booking/service",

      params: {
        companyId,
        companyName,

        branchId: branch.id,
        branchName: branch.name,

        // Mantemos esses parâmetros somente
        // quando estamos reagendando.
        ...(isRescheduling
          ? {
              rescheduleAppointmentId,
              rescheduleProfessionalServiceId,
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
              <Ionicons
                name={isRescheduling ? "calendar-outline" : "location-outline"}
                size={28}
                color="#B55A91"
              />
            </View>

            <Text style={styles.step}>
              {isRescheduling ? "REAGENDAMENTO" : "PASSO 1 DE 5"}
            </Text>

            <Text style={styles.title}>
              {isRescheduling ? "Escolha uma unidade" : "Escolha uma unidade"}
            </Text>

            <Text style={styles.subtitle}>
              Selecione onde você deseja realizar seu atendimento em{" "}
              <Text style={styles.companyName}>{companyName}</Text>.
            </Text>

            {isRescheduling && (
              <View style={styles.rescheduleBadge}>
                <Ionicons name="refresh-outline" size={15} color="#9D4D7D" />

                <Text style={styles.rescheduleBadgeText}>
                  Você está reagendando um atendimento
                </Text>
              </View>
            )}
          </View>

          {/* =====================
              BRANCHES
          ===================== */}

          <View style={styles.branchesContainer}>
            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#B55A91" />

                <Text style={styles.loadingText}>Carregando unidades...</Text>
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
                  Não foi possível carregar as unidades
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
              branches.map((branch) => (
                <Pressable
                  key={branch.id}
                  onPress={() => handleSelectBranch(branch)}
                  style={({ pressed }) => [
                    styles.branchCard,
                    pressed && styles.branchCardPressed,
                  ]}
                >
                  <View style={styles.branchIcon}>
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color="#B55A91"
                    />
                  </View>

                  <View style={styles.branchContent}>
                    <View style={styles.branchHeader}>
                      <Text style={styles.branchName}>{branch.name}</Text>
                    </View>

                    <View style={styles.addressContainer}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color="#9B8F99"
                      />

                      <Text style={styles.address}>
                        {branch.address.street},{" "}
                        {branch.address.number ?? "S/N"}
                      </Text>
                    </View>

                    <Text style={styles.city}>
                      {branch.address.city} - {branch.address.state}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={22} color="#B55A91" />
                </Pressable>
              ))}

            {!isLoading && !isError && branches.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="business-outline" size={32} color="#B55A91" />
                </View>

                <Text style={styles.emptyTitle}>
                  Nenhuma unidade encontrada
                </Text>

                <Text style={styles.emptyText}>
                  Esta empresa ainda não possui unidades disponíveis.
                </Text>
              </View>
            )}
          </View>
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

  companyName: {
    fontWeight: "700",
    color: "#463B48",
  },

  rescheduleBadge: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
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

  /* BRANCHES */

  branchesContainer: {
    gap: 14,
  },

  branchCard: {
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

  branchCardPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  branchIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F9F1F5",
    alignItems: "center",
    justifyContent: "center",
  },

  branchContent: {
    flex: 1,
  },

  branchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  branchName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2430",
  },

  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },

  address: {
    flex: 1,
    fontSize: 12,
    color: "#7B7280",
  },

  city: {
    fontSize: 12,
    color: "#9B8F99",
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
