import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect, useState } from "react";

import { apiClient } from "@/core/api/axios";

type CustomerBranch = {
  id?: string;

  branchId?: string;

  active?: boolean;

  lastVisitAt?: string | null;

  branch?: {
    id?: string;

    name?: string;
  };

  name?: string;
};

type AppointmentItem = {
  id?: string;

  startsAt?: string;

  endsAt?: string;

  price?: number | string;

  professionalService?: {
    professional?: {
      user?: {
        name?: string;
      };
    };

    serviceBranch?: {
      price?: number | string;

      service?: {
        id?: string;

        name?: string;

        durationMinutes?: number;
      };
    };
  };
};

type Appointment = {
  id: string;

  status?: string;

  scheduledDate?: string;

  startAt?: string;

  scheduledAt?: string;

  date?: string;

  branch?: {
    id?: string;

    name?: string;
  };

  items?: AppointmentItem[];

  services?: Array<{
    id?: string;

    name?: string;

    price?: number | string;
  }>;

  service?: {
    name?: string;

    price?: number | string;
  };
};

type Customer = {
  id: string;

  userId?: string;

  name?: string;

  email?: string;

  phone?: string;

  instagram?: string | null;

  observations?: string | null;

  allergies?: string | null;

  preferences?: string | null;

  photoUrl?: string | null;

  createdAt?: string;

  user?: {
    id?: string;

    name?: string;

    email?: string;

    phone?: string;

    photoUrl?: string | null;

    birthDate?: string | null;

    gender?: string | null;

    status?: string;
  };

  branches?: CustomerBranch[];

  appointments?: Appointment[];

  lastAttendedBranch?: {
    id?: string;
    name?: string;
    attendedAt?: string;
  } | null;

  loyaltyAccount?: {
    points?: number;

    balance?: number;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",

    timeStyle: "short",
  });
}

function formatCurrency(value?: number | string | null) {
  if (value == null || value === "") return null;

  const amount = Number(value);

  if (!Number.isFinite(amount)) return null;

  return amount.toLocaleString("pt-BR", {
    style: "currency",

    currency: "BRL",
  });
}

function formatPhone(phone?: string | null) {
  if (!phone) return "Não informado";

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

function getStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",

    CONFIRMED: "Confirmado",

    COMPLETED: "Concluído",

    CANCELLED: "Cancelado",

    CANCELED: "Cancelado",

    NO_SHOW: "Não compareceu",
  };

  return labels[status ?? ""] ?? status ?? "Não informado";
}

function getAppointmentDate(appointment: Appointment) {
  return (
    appointment.scheduledDate ??
    appointment.startAt ??
    appointment.scheduledAt ??
    appointment.date
  );
}

function getAppointmentServices(appointment: Appointment) {
  const itemServices =
    appointment.items?.map((item) => ({
      name:
        item.professionalService?.serviceBranch?.service?.name ??
        "Serviço não informado",

      price: item.price ?? item.professionalService?.serviceBranch?.price,

      professional: item.professionalService?.professional?.user?.name,
    })) ?? [];

  if (itemServices.length > 0) return itemServices;

  if (appointment.services?.length) {
    return appointment.services.map((service) => ({
      name: service.name ?? "Serviço não informado",

      price: service.price,

      professional: undefined,
    }));
  }

  if (appointment.service?.name) {
    return [
      {
        name: appointment.service.name,

        price: appointment.service.price,

        professional: undefined,
      },
    ];
  }

  return [];
}

export default function CustomerDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];

    customerId?: string | string[];
  }>();

  const customerId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id ??
      (Array.isArray(params.customerId)
        ? params.customerId[0]
        : params.customerId));

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      if (!customerId) {
        setError("ID do cliente não informado.");

        setLoading(false);

        return;
      }

      try {
        setLoading(true);

        setError("");

        const response = await apiClient.get(
          `/customers/${encodeURIComponent(customerId)}`,
        );

        const payload = response.data;

        // A API pode retornar { success, timestamp, data }.

        // Também aceita respostas diretas ou { customer: ... }.

        const customerData =
          payload?.data?.customer ??
          payload?.data ??
          payload?.customer ??
          payload;

        if (!customerData || typeof customerData !== "object") {
          throw new Error("A API não retornou um cadastro válido.");
        }

        console.log(
          "[CUSTOMER DETAILS] Cadastro recebido:",

          customerData.id,

          customerData.user?.name ?? customerData.name,

          "Filiais:",

          customerData.branches?.length ?? 0,

          "Agendamentos:",

          customerData.appointments?.length ?? 0,
        );

        if (active) {
          setCustomer(customerData as Customer);
        }
      } catch (err: any) {
        console.error(
          "[CUSTOMER DETAILS] Erro:",

          err?.response?.status,

          err?.response?.data ?? err?.message,
        );

        if (active) {
          const message = err?.response?.data?.message;

          setError(
            Array.isArray(message)
              ? message.join(", ")
              : typeof message === "string"
                ? message
                : err?.message
                  ? `Falha ao carregar cliente: ${err.message}`
                  : "Não foi possível carregar os dados do cliente.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCustomer();

    return () => {
      active = false;
    };
  }, [customerId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: "Detalhes do cliente" }} />

        <ActivityIndicator size="large" color="#8B5CF6" />

        <Text style={styles.loadingText}>Carregando cliente...</Text>
      </SafeAreaView>
    );
  }

  if (error || !customer) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: "Detalhes do cliente" }} />

        <Text style={styles.errorTitle}>Não foi possível abrir o cliente</Text>

        <Text style={styles.errorText}>
          {error || "Cliente não encontrado."}
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const name = customer.user?.name ?? customer.name ?? "Cliente";

  const email = customer.user?.email ?? customer.email ?? "Não informado";

  const phone = formatPhone(customer.user?.phone ?? customer.phone);

  const appointments = [...(customer.appointments ?? [])].sort((a, b) => {
    const dateA = new Date(getAppointmentDate(a) ?? 0).getTime();

    const dateB = new Date(getAppointmentDate(b) ?? 0).getTime();

    return dateB - dateA;
  });

  // As filiais podem vir em branches[].branch.name.

  // O histórico também pode informar a filial usada.

  const branchNames = Array.from(
    new Set(
      [
        ...(customer.branches ?? []).map(
          (item) => item.branch?.name ?? item.name,
        ),

        ...appointments.map((appointment) => appointment.branch?.name),
      ].filter((branchName): branchName is string => Boolean(branchName)),
    ),
  );

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;

  const loyaltyPoints =
    customer.loyaltyAccount?.points ?? customer.loyaltyAccount?.balance ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Detalhes do cliente" }} />

      <ScrollView
        contentContainerStyle={styles.content}

        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Voltar para clientes</Text>
        </Pressable>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.trim().charAt(0).toUpperCase() || "C"}
            </Text>
          </View>

          <Text style={styles.customerName}>{name}</Text>

          {customer.user?.status && (
            <Text style={styles.userStatus}>
              {customer.user.status === "ACTIVE"
                ? "Cadastro ativo"
                : customer.user.status}
            </Text>
          )}
        </View>

        <View style={styles.lastVisitCard}>
          <View style={styles.lastVisitIcon}>
            <Text style={styles.lastVisitIconText}>✦</Text>
          </View>
          <View style={styles.lastVisitContent}>
            <Text style={styles.lastVisitLabel}>ÚLTIMO ATENDIMENTO</Text>
            <Text style={styles.lastVisitBranch}>
              {customer.lastAttendedBranch?.name ?? "Ainda não identificado"}
            </Text>
            <Text style={styles.lastVisitDate}>
              {customer.lastAttendedBranch?.attendedAt
                ? formatDate(customer.lastAttendedBranch.attendedAt)
                : "A filial será exibida após um atendimento concluído."}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados do cliente</Text>

          <InfoRow label="E-mail" value={email} />

          <InfoRow label="Telefone" value={phone} />

          {customer.user?.birthDate && (
            <InfoRow
              label="Data de nascimento"

              value={new Date(customer.user.birthDate).toLocaleDateString(
                "pt-BR",

                {
                  timeZone: "UTC",
                },
              )}
            />
          )}

          {customer.user?.gender && (
            <InfoRow
              label="Gênero"

              value={
                customer.user.gender === "MALE"
                  ? "Masculino"
                  : customer.user.gender === "FEMALE"
                    ? "Feminino"
                    : customer.user.gender
              }
            />
          )}

          {customer.instagram && (
            <InfoRow
              label="Instagram"

              value={`@${customer.instagram.replace(/^@/, "")}`}
            />
          )}

          <InfoRow
            label="Filial(is)"

            value={
              branchNames.length > 0
                ? branchNames.join(", ")
                : "Nenhuma filial identificada"
            }
          />

          {customer.createdAt && (
            <InfoRow
              label="Cliente desde"

              value={new Date(customer.createdAt).toLocaleDateString("pt-BR")}
            />
          )}
        </View>

        {(customer.observations ||
          customer.allergies ||
          customer.preferences) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Observações e preferências</Text>

            {customer.observations && (
              <InfoRow label="Observações" value={customer.observations} />
            )}

            {customer.allergies && (
              <InfoRow label="Alergias" value={customer.allergies} />
            )}

            {customer.preferences && (
              <InfoRow label="Preferências" value={customer.preferences} />
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumo</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{appointments.length}</Text>

              <Text style={styles.summaryLabel}>Agendamentos</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{completedCount}</Text>

              <Text style={styles.summaryLabel}>Concluídos</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{loyaltyPoints}</Text>

              <Text style={styles.summaryLabel}>Pontos/saldo</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Histórico de agendamentos</Text>

          {appointments.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum agendamento foi retornado pela API. Se houver agendamentos
              cadastrados, será necessário revisar os filtros da consulta no
              backend.
            </Text>
          ) : (
            appointments.map((appointment, index) => {
              const services = getAppointmentServices(appointment);

              const prices = services

                .map((service) =>
                  service.price == null || service.price === ""
                    ? null
                    : Number(service.price),
                )

                .filter(
                  (price): price is number =>
                    price !== null && Number.isFinite(price),
                );

              const total =
                prices.length > 0
                  ? prices.reduce((sum, price) => sum + price, 0)
                  : null;

              return (
                <View
                  key={appointment.id ?? String(index)}

                  style={[
                    styles.appointmentItem,

                    index === appointments.length - 1 &&
                      styles.lastAppointmentItem,
                  ]}
                >
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>
                      {formatDate(getAppointmentDate(appointment))}
                    </Text>

                    <Text style={styles.status}>
                      {getStatusLabel(appointment.status)}
                    </Text>
                  </View>

                  <Text style={styles.appointmentService}>
                    {services.length > 0
                      ? services.map((service) => service.name).join(", ")
                      : "Serviço não informado"}
                  </Text>

                  <Text style={styles.appointmentBranch}>
                    Filial: {appointment.branch?.name ?? "Não informada"}
                  </Text>

                  {services.some((service) => service.professional) && (
                    <Text style={styles.appointmentBranch}>
                      Profissional:{" "}
                      {Array.from(
                        new Set(
                          services

                            .map((service) => service.professional)

                            .filter(Boolean),
                        ),
                      ).join(", ")}
                    </Text>
                  )}

                  {total !== null && (
                    <Text style={styles.appointmentPrice}>
                      {formatCurrency(total)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5F7",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    gap: 16,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    backgroundColor: "#F8F5F7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: "#827783",
    fontSize: 14,
  },
  errorTitle: {
    color: "#352735",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#827783",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  backButtonText: {
    color: "#8D617F",
    fontSize: 14,
    fontWeight: "700",
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "#EEE5EC",
    shadowColor: "#382336",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 16,
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0E5EE",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E7D5E2",
  },
  avatarText: {
    color: "#76516F",
    fontSize: 29,
    fontWeight: "700",
  },
  customerName: {
    color: "#352735",
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  customerSubtitle: {
    color: "#827783",
    fontSize: 14,
    marginTop: 4,
  },
  userStatus: {
    overflow: "hidden",
    color: "#467A65",
    backgroundColor: "#EAF4EF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lastVisitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F0E7EF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7D8E5",
  },
  lastVisitIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  lastVisitIconText: {
    color: "#8D617F",
    fontSize: 23,
  },
  lastVisitContent: {
    flex: 1,
    gap: 3,
  },
  lastVisitLabel: {
    color: "#8D617F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  lastVisitBranch: {
    color: "#352735",
    fontSize: 16,
    fontWeight: "700",
  },
  lastVisitDate: {
    color: "#827783",
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEE5EC",
    shadowColor: "#382336",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 1,
  },
  sectionTitle: {
    color: "#352735",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EDF2",
  },
  infoLabel: {
    color: "#948895",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  infoValue: {
    color: "#433543",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAF6F9",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#F1E7EF",
  },
  summaryValue: {
    color: "#8D617F",
    fontSize: 23,
    fontWeight: "700",
  },
  summaryLabel: {
    color: "#827783",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
  emptyText: {
    color: "#827783",
    fontSize: 13,
    lineHeight: 21,
  },
  appointmentItem: {
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8EF",
    gap: 8,
  },
  lastAppointmentItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  appointmentDate: {
    color: "#433543",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    flex: 1,
  },
  status: {
    color: "#8D617F",
    backgroundColor: "#F3EAF2",
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "700",
  },
  appointmentService: {
    color: "#352735",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  appointmentBranch: {
    color: "#827783",
    fontSize: 12,
    lineHeight: 18,
  },
  appointmentPrice: {
    color: "#467A65",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: "#8D617F",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
