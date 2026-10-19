import React, { useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  useGetCustomersQuery,
  type CustomerProfile,
} from "@/features/customer/api/customerApi";

const COLORS = {
  primary: "#B55A91",

  primaryDark: "#93436F",

  primaryLight: "#FCECF4",

  background: "#FAF8FB",

  white: "#FFFFFF",

  text: "#2E2430",

  textSecondary: "#7B7280",

  textMuted: "#A59BA6",

  border: "#EEE5EC",

  success: "#2E9B62",

  successLight: "#EAF8F0",

  warning: "#B97A2E",

  warningLight: "#FDF3E5",
};

function formatPhone(phone?: string | null) {
  if (!phone) {
    return "Telefone não informado";
  }

  const numbers = phone.replace(/\D/g, "");

  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,

      7,
    )}-${numbers.slice(7)}`;
  }

  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,

      6,
    )}-${numbers.slice(6)}`;
  }

  return phone;
}

function formatDate(date?: string | null) {
  if (!date) {
    return "Não informado";
  }

  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;

    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  const day = String(parsed.getDate()).padStart(2, "0");

  const month = String(parsed.getMonth() + 1).padStart(2, "0");

  const year = parsed.getFullYear();

  return `${day}/${month}/${year}`;
}

function getInitials(name?: string | null) {
  if (!name) {
    return "C";
  }

  return name

    .trim()

    .split(/\s+/)

    .filter(Boolean)

    .slice(0, 2)

    .map((part) => part.charAt(0))

    .join("")

    .toUpperCase();
}

function getCustomerName(customer: CustomerProfile) {
  return customer.name ?? customer.user?.name ?? "Cliente";
}

function getCustomerPhone(customer: CustomerProfile) {
  return customer.phone ?? customer.user?.phone ?? null;
}

function CustomerCard({
  customer,

  onPress,
}: {
  customer: CustomerProfile;

  onPress: () => void;
}) {
  const name = getCustomerName(customer);

  const phone = getCustomerPhone(customer);

  const branches = customer.branches ?? [];

  // Prioriza a filial do último atendimento; usa CustomerBranch como fallback.
  const latestBranch =
    customer.lastAppointment?.branch?.name ??
    [...branches].sort((a, b) => {
      const dateA = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
      const dateB = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
      return dateB - dateA;
    })[0]?.branchName ??
    null;

  const latestVisitDate =
    customer.lastAppointment?.scheduledDate ?? customer.lastVisitAt;

  const visits = customer.totalVisits ?? 0;

  return (
    <Pressable
      onPress={onPress}

      style={({ pressed }) => [
        styles.customerCard,

        pressed && styles.customerCardPressed,
      ]}
    >
      <View style={styles.customerAvatar}>
        <Text style={styles.customerAvatarText}>{getInitials(name)}</Text>
      </View>

      <View style={styles.customerContent}>
        <View style={styles.customerHeader}>
          <View style={styles.customerNameContainer}>
            <Text style={styles.customerName} numberOfLines={1}>
              {name}
            </Text>

            {customer.status === "ACTIVE" && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />

                <Text style={styles.activeBadgeText}>Ativo</Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </View>

        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={15} color={COLORS.textMuted} />

          <Text style={styles.contactText} numberOfLines={1}>
            {formatPhone(phone)}
          </Text>
        </View>

        <View style={styles.branchRow}>
          <Ionicons name="business-outline" size={15} color={COLORS.primary} />
          <Text style={styles.branchText} numberOfLines={1}>
            Última filial: {latestBranch ?? "Ainda não identificada"}
          </Text>
        </View>

        <View style={styles.customerFooter}>
          <View style={styles.visitInfo}>
            <Ionicons
              name="calendar-outline"

              size={15}

              color={COLORS.primary}
            />

            <Text style={styles.visitText}>
              {visits} {visits === 1 ? "atendimento" : "atendimentos"}
            </Text>
          </View>

          <Text style={styles.lastVisit}>
            Último atendimento: {formatDate(latestVisitDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function OwnerCustomers() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCustomersQuery({
      page: 1,

      limit: 50,

      search: search.trim() || undefined,

      sort: "updatedAt",

      order: "desc",
    });

  const customers = useMemo(() => data?.items ?? [], [data?.items]);

  function openCustomer(customer: CustomerProfile) {
    router.push({
      pathname: "/(owner)/dashboard/customer-details",

      params: {
        id: customer.id,
      },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}

        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}

            onRefresh={refetch}

            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.container}>
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={23} color={COLORS.text} />
            </Pressable>

            <View style={styles.headerIcon}>
              <Ionicons
                name="people-outline"
                size={25}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>Clientes</Text>
              <Text style={styles.subtitle}>
                Gerencie os clientes do seu empreendimento.
              </Text>
            </View>
          </View>

          {/* SEARCH */}

          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"

              size={20}

              color={COLORS.textMuted}
            />

            <TextInput
              value={search}

              onChangeText={setSearch}

              placeholder="Buscar cliente..."

              placeholderTextColor={COLORS.textMuted}

              style={styles.searchInput}

              autoCapitalize="none"

              autoCorrect={false}

              returnKeyType="search"
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"

                  size={20}

                  color={COLORS.textMuted}
                />
              </Pressable>
            )}
          </View>

          {/* SUMMARY */}

          {!isLoading && !isError && (
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryNumber}>
                  {data?.total ?? customers.length}
                </Text>

                <Text style={styles.summaryLabel}>
                  {data?.total === 1 ? "cliente" : "clientes"}
                </Text>
              </View>

              {isFetching && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
            </View>
          )}

          {/* LOADING */}

          {isLoading && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />

              <Text style={styles.stateTitle}>Carregando clientes...</Text>

              <Text style={styles.stateText}>
                Buscando os clientes da sua empresa.
              </Text>
            </View>
          )}

          {/* ERROR */}

          {!isLoading && isError && (
            <View style={styles.stateContainer}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name="alert-circle-outline"

                  size={30}

                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.stateTitle}>Não foi possível carregar</Text>

              <Text style={styles.stateText}>
                Verifique sua conexão e tente novamente.
              </Text>

              <Pressable onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {/* EMPTY */}

          {!isLoading && !isError && customers.length === 0 && (
            <View style={styles.stateContainer}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={search.trim() ? "search-outline" : "people-outline"}

                  size={30}

                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.stateTitle}>
                {search.trim()
                  ? "Nenhum cliente encontrado"
                  : "Nenhum cliente ainda"}
              </Text>

              <Text style={styles.stateText}>
                {search.trim()
                  ? "Tente buscar pelo nome, e-mail ou telefone."
                  : "Os clientes aparecerão aqui após concluírem um atendimento."}
              </Text>
            </View>
          )}

          {/* LIST */}

          {!isLoading && !isError && customers.length > 0 && (
            <View style={styles.list}>
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}

                  customer={customer}

                  onPress={() => openCustomer(customer)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,

    paddingBottom: 40,
  },

  container: {
    width: "100%",

    maxWidth: 900,

    alignSelf: "center",

    paddingHorizontal: 22,

    paddingTop: 26,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 24,
  },

  headerIcon: {
    width: 52,

    height: 52,

    borderRadius: 17,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 14,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 27,

    fontWeight: "800",

    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,

    fontSize: 14,

    color: COLORS.textSecondary,
  },

  searchContainer: {
    minHeight: 52,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 16,

    paddingHorizontal: 16,

    marginBottom: 20,
  },

  searchInput: {
    flex: 1,

    marginLeft: 10,

    paddingVertical: 13,

    fontSize: 14,

    color: COLORS.text,
  },

  summaryRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 12,
  },

  summaryNumber: {
    fontSize: 21,

    fontWeight: "800",

    color: COLORS.text,
  },

  summaryLabel: {
    marginTop: 1,

    fontSize: 12,

    color: COLORS.textSecondary,
  },

  list: {
    gap: 12,
  },

  customerCard: {
    flexDirection: "row",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,

    padding: 16,
  },

  customerCardPressed: {
    opacity: 0.72,

    transform: [{ scale: 0.99 }],
  },

  customerAvatar: {
    width: 52,

    height: 52,

    borderRadius: 18,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 13,
  },

  customerAvatarText: {
    fontSize: 17,

    fontWeight: "800",

    color: COLORS.primary,
  },

  customerContent: {
    flex: 1,

    minWidth: 0,
  },

  customerHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  customerNameContainer: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    minWidth: 0,
  },

  customerName: {
    flexShrink: 1,

    fontSize: 16,

    fontWeight: "800",

    color: COLORS.text,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activeBadge: {
    flexDirection: "row",

    alignItems: "center",

    marginLeft: 8,

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 8,

    backgroundColor: COLORS.successLight,
  },

  activeDot: {
    width: 5,

    height: 5,

    borderRadius: 3,

    backgroundColor: COLORS.success,

    marginRight: 4,
  },

  activeBadgeText: {
    fontSize: 9,

    fontWeight: "700",

    color: COLORS.success,
  },

  contactRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 7,
  },

  contactText: {
    flex: 1,

    marginLeft: 7,

    fontSize: 12,

    color: COLORS.textSecondary,
  },

  branchRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,
  },

  branchText: {
    flex: 1,

    marginLeft: 7,

    fontSize: 12,

    color: COLORS.textSecondary,
  },

  customerFooter: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 13,

    paddingTop: 11,

    borderTopWidth: 1,

    borderTopColor: COLORS.border,
  },

  visitInfo: {
    flexDirection: "row",

    alignItems: "center",
  },

  visitText: {
    marginLeft: 6,

    fontSize: 11,

    fontWeight: "700",

    color: COLORS.primary,
  },

  lastVisit: {
    fontSize: 10,

    color: COLORS.textMuted,
  },

  stateContainer: {
    alignItems: "center",

    justifyContent: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,

    paddingHorizontal: 25,

    paddingVertical: 45,

    marginTop: 4,
  },

  stateIcon: {
    width: 62,

    height: 62,

    borderRadius: 20,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 15,
  },

  stateTitle: {
    fontSize: 16,

    fontWeight: "800",

    color: COLORS.text,

    textAlign: "center",
  },

  stateText: {
    maxWidth: 330,

    marginTop: 7,

    fontSize: 13,

    lineHeight: 19,

    color: COLORS.textSecondary,

    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,

    paddingHorizontal: 22,

    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: COLORS.primary,
  },

  retryButtonText: {
    fontSize: 13,

    fontWeight: "700",

    color: COLORS.white,
  },
});
