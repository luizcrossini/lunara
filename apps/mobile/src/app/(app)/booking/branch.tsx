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
  } = useGetBranchesByCompanyQuery(String(companyId ?? ""), {
    skip: !companyId,
  });

  function handleSelectBranch(branch: (typeof branches)[number]) {
    router.push({
      pathname: "/booking/service",

      params: {
        companyId: String(companyId),
        companyName: String(companyName ?? ""),

        branchId: String(branch.id),
        branchName: String(branch.name),

        ...(isRescheduling
          ? {
              rescheduleAppointmentId: String(rescheduleAppointmentId ?? ""),

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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#463B48" />

            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={28} color="#B55A91" />
            </View>

            <Text style={styles.step}>
              {isRescheduling ? "REAGENDAMENTO" : "PASSO 1 DE 5"}
            </Text>

            <Text style={styles.title}>Escolha uma unidade</Text>

            <Text style={styles.subtitle}>
              Selecione onde você deseja realizar seu atendimento em{" "}
              <Text style={styles.companyName}>{companyName}</Text>.
            </Text>
          </View>

          {isLoading && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#B55A91" />

              <Text style={styles.loadingText}>Carregando unidades...</Text>
            </View>
          )}

          {isError && (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle-outline" size={42} color="#B55A91" />

              <Text style={styles.emptyTitle}>
                Não foi possível carregar as unidades
              </Text>

              <Text style={styles.emptyText}>
                Verifique sua conexão e tente novamente.
              </Text>

              <Pressable
                onPress={() => void refetch()}
                style={styles.retryButton}
              >
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
                  <Ionicons name="business-outline" size={25} color="#B55A91" />
                </View>

                <View style={styles.branchContent}>
                  <Text style={styles.branchName}>{branch.name}</Text>

                  {branch.address && (
                    <Text style={styles.branchAddress}>
                      {branch.address.street}
                      {branch.address.number
                        ? `, ${branch.address.number}`
                        : ""}
                      {"\n"}
                      {branch.address.district}, {branch.address.city} -{" "}
                      {branch.address.state}
                    </Text>
                  )}

                  {branch.phone && (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={14} color="#9B8F99" />

                      <Text style={styles.infoText}>{branch.phone}</Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={22} color="#B9AEB8" />
              </Pressable>
            ))}

          {!isLoading && !isError && branches.length === 0 && (
            <View style={styles.centerState}>
              <Ionicons name="business-outline" size={42} color="#B55A91" />

              <Text style={styles.emptyTitle}>Nenhuma unidade disponível</Text>

              <Text style={styles.emptyText}>
                Esta empresa ainda não possui unidades disponíveis para
                agendamento.
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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 28,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#463B48",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
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

  branchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDE7",
    padding: 18,
    marginBottom: 14,
  },

  branchCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
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

  branchName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 5,
  },

  branchAddress: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B7280",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoText: {
    fontSize: 12,
    color: "#9B8F99",
  },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
    paddingHorizontal: 25,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: "#7B7280",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2430",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
