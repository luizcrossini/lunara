import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { useCreateAppointmentOrderMutation } from "@/features/appointment/api/appointmentOrderApi";

export default function BookingConfirmationScreen() {
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

    /*
    IDs necessários para salvar o agendamento
    */

    customerId,

    professionalServiceIds,

    date,

    startTime,
    endTime,
  } = useLocalSearchParams<{
    companyId?: string;
    companyName?: string;

    branchId?: string;
    branchName?: string;

    serviceIds?: string;
    serviceNames?: string;

    professionalBranchId?: string;

    professionalId?: string;
    professionalName?: string;

    customerId?: string;

    professionalServiceIds?: string;

    date?: string;

    startTime?: string;
    endTime?: string;
  }>();

  /*
  ========================================
  API MUTATION
  ========================================
  */

  const [createAppointmentOrder, { isLoading }] =
    useCreateAppointmentOrderMutation();

  /*
  ========================================
  LOG
  ========================================
  */

  /*
  ========================================
  SERVIÇOS
  ========================================
  */

  const services = serviceNames
    ? String(serviceNames)
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean)
    : [];

  /*
  ========================================
  PROFESSIONAL SERVICES IDS
  ========================================
  */

  const parsedProfessionalServiceIds = professionalServiceIds
    ? String(professionalServiceIds)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  /*
  ========================================
  FORMATA DATA
  ========================================
  */

  function formatDate(value?: string) {
    if (!value) {
      return "-";
    }

    const parsedDate = new Date(`${value}T12:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  /*
  ========================================
  FORMATA HORÁRIO
  ========================================
  */

  function formatTime(value?: string) {
    if (!value) {
      return "-";
    }

    const stringValue = String(value);

    /*
    Caso venha no formato:

    09:00
    */

    if (/^\d{2}:\d{2}/.test(stringValue)) {
      return stringValue.substring(0, 5);
    }

    /*
    Caso venha ISO
    */

    const parsedDate = new Date(stringValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return stringValue;
    }

    return parsedDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  /*
  ========================================
  CRIAR DATA/HORA ISO
  ========================================
  */

  function createDateTime(appointmentDate: string, time: string) {
    /*
    Se o horário já vier como ISO,
    retorna diretamente.
    */

    if (time.includes("T") || time.includes("Z")) {
      return time;
    }

    /*
    Monta:

    2026-08-29T09:00:00
    */

    return `${appointmentDate}T${time}:00`;
  }

  /*
  ========================================
  CONFIRMAR AGENDAMENTO
  ========================================
  */

  function handleConfirmAppointment() {
    if (!companyId) {
      Alert.alert("Erro", "Empresa não informada.");
      return;
    }

    if (!branchId) {
      Alert.alert("Erro", "Unidade não informada.");
      return;
    }

    if (!professionalId) {
      Alert.alert("Erro", "Profissional não informado.");
      return;
    }

    if (!customerId) {
      Alert.alert("Erro", "Cliente não informado.");
      return;
    }

    if (!date) {
      Alert.alert("Erro", "Data não informada.");
      return;
    }

    if (!startTime) {
      Alert.alert("Erro", "Horário de início não informado.");
      return;
    }

    if (!endTime) {
      Alert.alert("Erro", "Horário final não informado.");
      return;
    }

    if (parsedProfessionalServiceIds.length === 0) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar os serviços do profissional.",
      );

      return;
    }

    /*
  ========================================
  CHAMA A API DIRETAMENTE
  ========================================
  */

    void handleCreateAppointment();
  }

  async function handleCreateAppointment() {
    try {
      if (!branchId) {
        throw new Error("Branch ID não informado.");
      }

      if (!customerId) {
        throw new Error("Customer ID não informado.");
      }

      if (!date) {
        throw new Error("Data não informada.");
      }

      if (!startTime) {
        throw new Error("Horário inicial não informado.");
      }

      if (!endTime) {
        throw new Error("Horário final não informado.");
      }

      if (parsedProfessionalServiceIds.length === 0) {
        throw new Error("Nenhum Professional Service ID foi informado.");
      }

      const startsAt = createDateTime(String(date), String(startTime));

      const endsAt = createDateTime(String(date), String(endTime));

      const payload = {
        branchId: String(branchId),

        customerId: String(customerId),

        scheduledDate: String(date),

        source: "PUBLIC_LINK",

        items: parsedProfessionalServiceIds.map((professionalServiceId) => ({
          professionalServiceId,

          startsAt,

          endsAt,
        })),
      };

      const appointment = await createAppointmentOrder(payload).unwrap();

      router.replace({
        pathname: "/booking/success",
        params: {
          companyId: String(companyId),
          companyName: String(companyName ?? ""),
          branchId: String(branchId),
          branchName: String(branchName ?? ""),
          serviceIds: String(serviceIds ?? ""),
          serviceNames: String(serviceNames ?? ""),
          professionalBranchId: String(professionalBranchId ?? ""),
          professionalId: String(professionalId),
          professionalName: String(professionalName ?? ""),
          customerId: String(customerId),
          date: String(date),
          startTime: String(startTime),
          endTime: String(endTime),
        },
      });
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "Não foi possível realizar o agendamento.";

      Alert.alert(
        "Não foi possível agendar",
        Array.isArray(message) ? message.join("\n") : String(message),
      );
    }
  }
  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>Confirmar agendamento</Text>

          <Text style={styles.headerSubtitle}>
            Revise os dados antes de confirmar
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* LOCAL */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOCAL</Text>

          <Text style={styles.cardTitle}>{companyName || "Empresa"}</Text>

          <Text style={styles.cardDescription}>{branchName || "Unidade"}</Text>
        </View>

        {/* SERVIÇOS */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            SERVIÇO
            {services.length > 1 ? "S" : ""}
          </Text>

          {services.length > 0 ? (
            services.map((service, index) => (
              <View key={`${service}-${index}`} style={styles.serviceRow}>
                <Text style={styles.serviceBullet}>•</Text>

                <Text style={styles.serviceName}>{service}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardDescription}>
              Nenhum serviço selecionado
            </Text>
          )}
        </View>

        {/* PROFISSIONAL */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>PROFISSIONAL</Text>

          <Text style={styles.cardTitle}>
            {professionalName || "Não informado"}
          </Text>
        </View>

        {/* DATA */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>DATA</Text>

          <Text style={styles.cardTitle}>{formatDate(String(date || ""))}</Text>
        </View>

        {/* HORÁRIO */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>HORÁRIO</Text>

          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(startTime)}</Text>

            <Text style={styles.timeSeparator}>até</Text>

            <Text style={styles.time}>{formatTime(endTime)}</Text>
          </View>
        </View>

        {/* RESUMO */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo do agendamento</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Serviços</Text>

            <Text style={styles.summaryValue}>{services.length}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profissional</Text>

            <Text style={styles.summaryValue}>{professionalName || "-"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Data</Text>

            <Text style={styles.summaryValue}>
              {formatDate(String(date || ""))}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Horário</Text>

            <Text style={styles.summaryValue}>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>
        </View>

        <Text style={styles.notice}>
          Ao confirmar, seu horário será reservado de acordo com a
          disponibilidade do profissional.
        </Text>
      </ScrollView>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirmAppointment}
          disabled={isLoading}
          style={[
            styles.confirmButton,

            isLoading && styles.confirmButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar agendamento</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
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
    backgroundColor: "#F8FAFC",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
  },

  backText: {
    fontSize: 24,
    color: "#0F172A",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  cardDescription: {
    marginTop: 5,
    fontSize: 14,
    color: "#64748B",
  },

  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  serviceBullet: {
    fontSize: 20,
    marginRight: 8,
    color: "#8B5CF6",
  },

  serviceName: {
    fontSize: 16,
    color: "#0F172A",
  },

  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  time: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  timeSeparator: {
    fontSize: 14,
    color: "#64748B",
  },

  summaryCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 18,
    marginTop: 6,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 14,
  },

  notice: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    paddingHorizontal: 10,
  },

  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  confirmButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmButtonDisabled: {
    opacity: 0.6,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
