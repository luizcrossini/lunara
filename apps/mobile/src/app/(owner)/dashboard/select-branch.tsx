import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { baseApi } from "@/core/api/baseApi";
import { authStorage } from "@/core/auth/auth-storage.service";

type Branch = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  active?: boolean;
};

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#963C73",
  primaryLight: "#FBEAF3",
  background: "#FAF8FB",
  card: "#FFFFFF",
  text: "#241F2B",
  secondary: "#756B7A",
  border: "#EEE4EC",
  success: "#368661",
};

function unwrap<T>(response: any): T[] {
  const data = response?.data ?? response;
  const candidates = [
    data,
    data?.items,
    data?.results,
    data?.branches,
    data?.data,
    data?.data?.items,
    data?.data?.branches,
  ];

  return (candidates.find(Array.isArray) ?? []) as T[];
}

function getErrorMessage(error: any) {
  return (
    error?.data?.message ??
    error?.error?.data?.message ??
    error?.message ??
    "Não foi possível carregar as filiais."
  );
}

const branchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOwnerBranches: builder.query<Branch[], string>({
      query: (companyId) => ({
        url: `/branches/company/${companyId}`,
        method: "GET",
      }),
      transformResponse: (response) => unwrap<Branch>(response),
      providesTags: ["Company"],
    }),
  }),
});

const { useGetOwnerBranchesQuery } = branchApi;

export default function OwnerBranchSelectorScreen() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    authStorage.getCompanyId().then((id) => {
      if (mounted) setCompanyId(id);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const query = useGetOwnerBranchesQuery(companyId ?? "", {
    skip: !companyId,
  });

  const branches = useMemo(
    () => (query.data ?? []).filter((branch) => branch.active !== false),
    [query.data],
  );

  async function handleContinue() {
    if (!selectedBranchId) {
      Alert.alert("Selecione uma filial", "Escolha uma filial para continuar.");
      return;
    }

    try {
      setSaving(true);
      await authStorage.setActiveBranch(selectedBranchId);
      router.replace("/(owner)/dashboard");
    } catch (error) {
      Alert.alert("Não foi possível continuar", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={query.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.brandMark}>
          <Ionicons name="location-outline" size={25} color={COLORS.primary} />
        </View>
        <Text style={styles.eyebrow}>CONFIGURAÇÃO DO ESPAÇO</Text>
        <Text style={styles.title}>Escolha sua filial</Text>
        <Text style={styles.subtitle}>
          Selecione a unidade que você deseja gerenciar. Os serviços,
          profissionais e agendamentos serão carregados para essa filial.
        </Text>

        {query.isLoading || !companyId ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Carregando suas filiais...</Text>
          </View>
        ) : query.isError ? (
          <View style={styles.stateCard}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={COLORS.primary}
            />
            <Text style={styles.stateTitle}>Não foi possível carregar</Text>
            <Text style={styles.stateText}>{getErrorMessage(query.error)}</Text>
            <Pressable style={styles.secondaryButton} onPress={query.refetch}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : branches.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons
              name="business-outline"
              size={32}
              color={COLORS.primary}
            />
            <Text style={styles.stateTitle}>Nenhuma filial cadastrada</Text>
            <Text style={styles.stateText}>
              Cadastre uma filial antes de acessar o catálogo e a agenda.
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/(owner)/dashboard/branches")}
            >
              <Text style={styles.secondaryButtonText}>Cadastrar filial</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {branches.map((branch) => {
              const selected = selectedBranchId === branch.id;

              return (
                <Pressable
                  key={branch.id}
                  onPress={() => setSelectedBranchId(branch.id)}
                  style={[
                    styles.branchCard,
                    selected && styles.branchCardSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.branchIcon,
                      selected && styles.branchIconSelected,
                    ]}
                  >
                    <Ionicons
                      name="business-outline"
                      size={23}
                      color={selected ? "#FFFFFF" : COLORS.primary}
                    />
                  </View>
                  <View style={styles.branchContent}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    {!!(branch.address || branch.city) && (
                      <Text style={styles.branchAddress}>
                        {[branch.address, branch.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    )}
                    <Text style={styles.branchHint}>
                      Selecionar esta unidade
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={25}
                    color={selected ? COLORS.primary : "#CBBFC9"}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!selectedBranchId || saving}
          onPress={handleContinue}
          style={[
            styles.primaryButton,
            (!selectedBranchId || saving) && styles.disabledButton,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          )}
          <Text style={styles.primaryButtonText}>Continuar para o painel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  page: {
    padding: 24,
    paddingBottom: 120,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 600,
  },
  list: { gap: 12, marginTop: 28 },
  branchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  branchCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFF8FC",
  },
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  branchIconSelected: { backgroundColor: COLORS.primary },
  branchContent: { flex: 1 },
  branchName: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  branchAddress: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  branchHint: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 30,
    marginTop: 28,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  stateText: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 9,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingVertical: 12,
    marginTop: 18,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  disabledButton: { opacity: 0.45 },
});
