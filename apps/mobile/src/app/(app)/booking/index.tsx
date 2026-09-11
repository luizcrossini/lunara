import { useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useGetCompaniesQuery } from "@/features/company/api/companyApi";

export default function BookingScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === "web" && width >= 900;

  const [search, setSearch] = useState("");
  const {
    data: companies = [],
    isLoading,
    isError,
    refetch,
  } = useGetCompaniesQuery();

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return companies;
    }

    return companies.filter((company) => {
      return (
        company.name.toLowerCase().includes(term) ||
        company.slug.toLowerCase().includes(term)
      );
    });
  }, [companies, search]);

  function handleSelectCompany(company: { id: string; slug: string }) {
    /*
      Próxima etapa:

      Vamos passar o ID do estabelecimento
      para a próxima tela.
    */

    router.push({
      pathname: "/booking/branch",
      params: {
        companyId: company.id,
        companyName: company.slug,
      },
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* =====================
              BACK BUTTON
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
              <Ionicons name="storefront-outline" size={28} color="#B55A91" />
            </View>

            <Text style={styles.title}>Onde você quer agendar?</Text>

            <Text style={styles.subtitle}>
              Encontre salões e clínicas disponíveis para realizar seu
              agendamento.
            </Text>
          </View>

          {/* =====================
              SEARCH
          ===================== */}

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={21} color="#9B8F99" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar salão ou clínica"
              placeholderTextColor="#9B8F99"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#9B8F99" />
              </Pressable>
            )}
          </View>

          {/* =====================
    RESULTS
===================== */}

          <View
            style={[styles.resultsGrid, isDesktop && styles.resultsGridDesktop]}
          >
            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#B55A91" />

                <Text style={styles.loadingText}>
                  Carregando estabelecimentos...
                </Text>
              </View>
            )}

            {isError && (
              <View style={styles.centerState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={30}
                    color="#B55A91"
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Não foi possível carregar os estabelecimentos
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
              filteredCompanies.map((company) => (
                <Pressable
                  key={company.id}
                  onPress={() => handleSelectCompany(company)}
                  style={({ pressed }) => [
                    styles.card,
                    isDesktop && styles.cardDesktop,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.companyPlaceholder}>
                    <Ionicons
                      name="storefront-outline"
                      size={48}
                      color="#B55A91"
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {company.slug}
                        </Text>

                        <Text style={styles.cardCategory}>@{company.slug}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.scheduleText}>
                        Ver horários disponíveis
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#B55A91"
                      />
                    </View>
                  </View>
                </Pressable>
              ))}
          </View>

          {/* =====================
              EMPTY STATE
          ===================== */}

          {!isLoading && !isError && filteredCompanies.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={30} color="#B55A91" />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhum estabelecimento encontrado
              </Text>

              <Text style={styles.emptyText}>Tente buscar por outro nome.</Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  contentDesktop: {
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
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
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#F4E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
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

  /* SEARCH */

  searchContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DDE7",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 28,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2E2430",

    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none" as any,
        }
      : {}),
  },

  /* RESULTS */

  resultsGrid: {
    gap: 16,
  },

  resultsGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#7B7280",
  },

  companyPlaceholder: {
    width: "100%",
    height: 170,
    backgroundColor: "#F4E8F0",
    alignItems: "center",
    justifyContent: "center",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8DDE7",
    overflow: "hidden",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  cardDesktop: {
    width: "31.8%",
  },

  cardPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  cardImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#F4E8F0",
  },

  cardContent: {
    padding: 18,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  cardTitleContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 4,
  },

  cardCategory: {
    fontSize: 12,
    color: "#7B7280",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#463B48",
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },

  locationText: {
    fontSize: 12,
    color: "#7B7280",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2EDF1",
  },

  scheduleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B55A91",
  },

  /* EMPTY */

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "#F4E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
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
    color: "#7B7280",
    textAlign: "center",
  },
});
