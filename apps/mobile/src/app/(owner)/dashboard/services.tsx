import React, { useMemo, useState } from "react";

import { useRouter } from "expo-router";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { baseApi } from "@/core/api/baseApi";

import { useAuth } from "@/core/auth/auth-context";

/* ============================================================
   DESIGN
============================================================ */

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#963C73",
  primaryLight: "#FBEAF3",

  background: "#FAF8FB",
  card: "#FFFFFF",

  text: "#241F2B",
  secondary: "#756B7A",
  muted: "#A59AA9",

  border: "#EEE4EC",
  borderStrong: "#E2D5DF",

  success: "#368661",
  successLight: "#E8F6EE",

  danger: "#C44D72",
  dangerLight: "#FDEBF1",

  warning: "#B97A2E",
  warningLight: "#FDF3E5",
};

const SHADOW = {
  soft: {
    shadowColor: "#3D2A44",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  medium: {
    shadowColor: "#3D2A44",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
};

/* ============================================================
   TYPES
============================================================ */

type Branch = {
  id: string;
  name: string;
};

type ServiceBranch = {
  id: string;
  branchId: string;
  price: number | string;
  active: boolean;
  deletedAt?: string | null;

  branch?: Branch;
};

type Service = {
  id: string;

  name: string;

  description?: string | null;

  durationMinutes: number;

  color?: string | null;

  active: boolean;

  branches: ServiceBranch[];

  createdAt?: string;
  updatedAt?: string;
};

type ServiceBranchForm = {
  branchId: string;
  price: string;
  active: boolean;
};

type ServiceForm = {
  name: string;

  description: string;

  durationMinutes: string;

  color: string;

  active: boolean;

  branches: ServiceBranchForm[];
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  durationMinutes: "60",
  color: COLORS.primary,
  active: true,
  branches: [],
};

/* ============================================================
   HELPERS
============================================================ */

function unwrap<T>(response: any): T {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data as T;
  }

  if (Array.isArray(data?.items)) {
    return data.items as T;
  }

  if (Array.isArray(data?.data)) {
    return data.data as T;
  }

  if (Array.isArray(data?.results)) {
    return data.results as T;
  }

  return data as T;
}

function getErrorMessage(error: any) {
  return (
    error?.data?.message ??
    error?.error?.data?.message ??
    error?.message ??
    "Não foi possível concluir a operação."
  );
}

function normalizeColor(color?: string | null) {
  return color && /^#[0-9A-F]{6}$/i.test(color) ? color : COLORS.primary;
}

function formatDuration(minutes: number) {
  if (!minutes) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function formatCurrency(value: number | string) {
  const number = Number(value) || 0;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parsePrice(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function formatPriceInput(value: string) {
  return value.replace(/[^\d,]/g, "");
}

function getMinimumPrice(service: Service) {
  if (!service.branches?.length) {
    return 0;
  }

  return Math.min(...service.branches.map((item) => Number(item.price) || 0));
}

/* ============================================================
   API
============================================================ */

const servicesApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    /* --------------------------------------------------------
       SERVICES
    -------------------------------------------------------- */

    getServicesOwner: builder.query<Service[], void>({
      query: () => ({
        url: "/services",
        method: "GET",
        params: {
          page: 1,
          limit: 100,
        },
      }),

      transformResponse: (response) => unwrap<Service[]>(response) ?? [],

      providesTags: ["Company"],
    }),

    createServiceOwner: builder.mutation<
      Service,
      {
        name: string;
        description?: string;
        durationMinutes: number;
        color?: string;
        active?: boolean;

        branches: {
          branchId: string;
          price: number;
          active?: boolean;
        }[];
      }
    >({
      query: (body) => ({
        url: "/services",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Company"],
    }),

    updateServiceOwner: builder.mutation<
      Service,
      {
        id: string;

        body: {
          name?: string;
          description?: string;
          durationMinutes?: number;
          color?: string;
          active?: boolean;

          branches?: {
            branchId: string;
            price: number;
            active?: boolean;
          }[];
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: ["Company"],
    }),

    deleteServiceOwner: builder.mutation<void, string>({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Company"],
    }),

    /* --------------------------------------------------------
       BRANCHES
    -------------------------------------------------------- */

    getCompanyBranches: builder.query<Branch[], string>({
      query: (companyId) => ({
        url: `/branches/company/${companyId}`,
        method: "GET",
      }),

      transformResponse: (response) => unwrap<Branch[]>(response) ?? [],

      providesTags: ["Company"],
    }),
  }),
});

const {
  useGetServicesOwnerQuery,
  useCreateServiceOwnerMutation,
  useUpdateServiceOwnerMutation,
  useDeleteServiceOwnerMutation,
  useGetCompanyBranchesQuery,
} = servicesApi;

/* ============================================================
   SCREEN
============================================================ */

export default function OwnerServicesScreen() {
  const router = useRouter();
  const { companyId } = useAuth();

  /* ----------------------------------------------------------
     SERVICES
  ---------------------------------------------------------- */

  const {
    data: services = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetServicesOwnerQuery();

  /* ----------------------------------------------------------
     BRANCHES
  ---------------------------------------------------------- */

  const {
    data: branches = [],
    isLoading: branchesLoading,
    isFetching: branchesFetching,
  } = useGetCompanyBranchesQuery(companyId ?? "", {
    skip: !companyId,
  });

  /* ----------------------------------------------------------
     MUTATIONS
  ---------------------------------------------------------- */

  const [createService, { isLoading: creating }] =
    useCreateServiceOwnerMutation();

  const [updateService, { isLoading: updating }] =
    useUpdateServiceOwnerMutation();

  const [deleteService] = useDeleteServiceOwnerMutation();

  /* ----------------------------------------------------------
     UI STATE
  ---------------------------------------------------------- */

  const [search, setSearch] = useState("");

  const [onlyActive, setOnlyActive] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [editing, setEditing] = useState<Service | null>(null);

  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !term ||
        service.name.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term);

      const matchesActive = !onlyActive || service.active;

      return matchesSearch && matchesActive;
    });
  }, [services, search, onlyActive]);

  const activeCount = services.filter((service) => service.active).length;

  /* ==========================================================
     OPEN CREATE
  ========================================================== */

  function openCreate() {
    setEditing(null);

    setForm({
      ...EMPTY_FORM,

      branches: branches.map((branch) => ({
        branchId: branch.id,
        price: "",
        active: true,
      })),
    });

    setModalVisible(true);
  }

  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  function openEdit(service: Service) {
    setEditing(service);

    const existingBranches = new Map(
      service.branches.map((item) => [item.branchId, item]),
    );

    setForm({
      name: service.name ?? "",

      description: service.description ?? "",

      durationMinutes: String(service.durationMinutes ?? 60),

      color: normalizeColor(service.color),

      active: service.active !== false,

      branches: branches.map((branch) => {
        const existing = existingBranches.get(branch.id);

        return {
          branchId: branch.id,

          price: existing != null ? String(existing.price) : "",

          active: existing?.active ?? true,
        };
      }),
    });

    setModalVisible(true);
  }

  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  function closeModal() {
    if (creating || updating) {
      return;
    }

    setModalVisible(false);

    setEditing(null);

    setForm(EMPTY_FORM);
  }

  /* ==========================================================
     UPDATE FORM
  ========================================================== */

  function updateForm(changes: Partial<ServiceForm>) {
    setForm((current) => ({
      ...current,
      ...changes,
    }));
  }

  /* ==========================================================
     TOGGLE BRANCH
  ========================================================== */

  function toggleBranch(branchId: string) {
    setForm((current) => {
      const existing = current.branches.find(
        (item) => item.branchId === branchId,
      );

      if (existing) {
        return {
          ...current,

          branches: current.branches.map((item) =>
            item.branchId === branchId
              ? {
                  ...item,
                  active: !item.active,
                }
              : item,
          ),
        };
      }

      return {
        ...current,

        branches: [
          ...current.branches,

          {
            branchId,
            price: "",
            active: true,
          },
        ],
      };
    });
  }

  /* ==========================================================
     UPDATE BRANCH PRICE
  ========================================================== */

  function updateBranchPrice(branchId: string, price: string) {
    const formatted = formatPriceInput(price);

    setForm((current) => ({
      ...current,

      branches: current.branches.map((item) =>
        item.branchId === branchId
          ? {
              ...item,
              price: formatted,
            }
          : item,
      ),
    }));
  }

  /* ==========================================================
     IS BRANCH SELECTED
  ========================================================== */

  function isBranchSelected(branchId: string) {
    return form.branches.some(
      (item) => item.branchId === branchId && item.active,
    );
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async function handleSave() {
    const name = form.name.trim();

    if (!name) {
      Alert.alert("Atenção", "Informe o nome do serviço.");

      return;
    }

    const duration = Number(form.durationMinutes);

    if (!duration || duration < 1) {
      Alert.alert("Atenção", "Informe uma duração válida.");

      return;
    }

    const selectedBranches = form.branches.filter((branch) => branch.active);

    if (selectedBranches.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos uma filial.");

      return;
    }

    const invalidPrice = selectedBranches.some(
      (branch) => parsePrice(branch.price) <= 0,
    );

    if (invalidPrice) {
      Alert.alert(
        "Atenção",
        "Informe o preço de todas as filiais selecionadas.",
      );

      return;
    }

    const branchesPayload = selectedBranches.map((branch) => ({
      branchId: branch.branchId,

      price: parsePrice(branch.price),

      active: true,
    }));

    try {
      if (editing) {
        await updateService({
          id: editing.id,

          body: {
            name,

            description: form.description.trim() || undefined,

            durationMinutes: duration,

            color: form.color,

            active: form.active,

            branches: branchesPayload,
          },
        }).unwrap();

        Alert.alert("Sucesso", "Serviço atualizado com sucesso.");
      } else {
        await createService({
          name,

          description: form.description.trim() || undefined,

          durationMinutes: duration,

          color: form.color,

          active: form.active,

          branches: branchesPayload,
        }).unwrap();

        Alert.alert("Sucesso", "Serviço criado com sucesso.");
      }

      closeModal();

      await refetch();
    } catch (err) {
      Alert.alert("Não foi possível salvar", getErrorMessage(err));
    }
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  function confirmDelete(service: Service) {
    Alert.alert(
      "Excluir serviço",
      `Deseja realmente excluir "${service.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },

        {
          text: "Excluir",
          style: "destructive",

          onPress: async () => {
            try {
              await deleteService(service.id).unwrap();

              await refetch();

              Alert.alert("Sucesso", "Serviço excluído com sucesso.");
            } catch (err) {
              Alert.alert("Erro", getErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  /* ==========================================================
     REFRESH
  ========================================================== */

  const refreshing = isFetching || branchesFetching;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refetch();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={21} color={COLORS.text} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>CATÁLOGO DA EMPRESA</Text>

              <Text style={styles.title}>Serviços</Text>

              <Text style={styles.subtitle}>
                Cadastre seus serviços e defina em quais filiais eles estarão
                disponíveis.
              </Text>
            </View>
          </View>

          <Pressable style={styles.primaryHeaderButton} onPress={openCreate}>
            <Ionicons name="add" size={19} color="#FFFFFF" />

            <Text style={styles.primaryHeaderButtonText}>Novo serviço</Text>
          </Pressable>
        </View>

        {/* ====================================================
            METRICS
        ==================================================== */}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="sparkles-outline"
                size={19}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.metricLabel}>Serviços</Text>

            <Text style={styles.metricValue}>{services.length}</Text>

            <Text style={styles.metricDescription}>cadastrados</Text>
          </View>

          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: COLORS.successLight,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={COLORS.success}
              />
            </View>

            <Text style={styles.metricLabel}>Ativos</Text>

            <Text style={styles.metricValue}>{activeCount}</Text>

            <Text style={styles.metricDescription}>disponíveis</Text>
          </View>

          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: COLORS.primaryLight,
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={19}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.metricLabel}>Filiais</Text>

            <Text style={styles.metricValue}>{branches.length}</Text>

            <Text style={styles.metricDescription}>cadastradas</Text>
          </View>
        </View>

        {/* ====================================================
            SEARCH / FILTER
        ==================================================== */}

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color={COLORS.muted} />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar serviço..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
            />

            {!!search && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={19} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>Somente ativos</Text>

            <Switch
              value={onlyActive}
              onValueChange={setOnlyActive}
              trackColor={{
                false: COLORS.border,
                true: COLORS.primaryLight,
              }}
              thumbColor={onlyActive ? COLORS.primary : "#FFFFFF"}
            />
          </View>
        </View>

        {/* ====================================================
            BRANCH INFO
        ==================================================== */}

        {branchesLoading ? (
          <View style={styles.loadingBranches}>
            <ActivityIndicator color={COLORS.primary} />

            <Text style={styles.loadingBranchesText}>
              Carregando filiais...
            </Text>
          </View>
        ) : null}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {isError ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIconDanger}>
              <Ionicons
                name="alert-circle-outline"
                size={31}
                color={COLORS.danger}
              />
            </View>

            <Text style={styles.stateTitle}>Não foi possível carregar</Text>

            <Text style={styles.stateText}>{getErrorMessage(error)}</Text>

            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />

            <Text style={styles.stateTitle}>Carregando serviços...</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="sparkles-outline"
                size={30}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.stateTitle}>Nenhum serviço encontrado</Text>

            <Text style={styles.stateText}>
              Cadastre seu primeiro serviço ou ajuste a busca.
            </Text>

            <Pressable style={styles.retryButton} onPress={openCreate}>
              <Ionicons name="add" size={17} color="#FFFFFF" />

              <Text style={styles.retryButtonText}>Cadastrar serviço</Text>
            </Pressable>
          </View>
        ) : (
          /* ==================================================
             SERVICE LIST
          ================================================== */

          <View style={styles.list}>
            {filteredServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View
                  style={[
                    styles.serviceColor,
                    {
                      backgroundColor: normalizeColor(service.color),
                    },
                  ]}
                />

                <View style={styles.serviceMain}>
                  {/* SERVICE HEADER */}

                  <View style={styles.serviceTitleRow}>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.serviceName}>{service.name}</Text>

                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description || "Sem descrição"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        service.active
                          ? styles.statusActive
                          : styles.statusInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          service.active
                            ? styles.statusActiveText
                            : styles.statusInactiveText,
                        ]}
                      >
                        {service.active ? "Ativo" : "Inativo"}
                      </Text>
                    </View>
                  </View>

                  {/* META */}

                  <View style={styles.serviceMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={COLORS.secondary}
                      />

                      <Text style={styles.metaText}>
                        {formatDuration(service.durationMinutes)}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons
                        name="business-outline"
                        size={16}
                        color={COLORS.secondary}
                      />

                      <Text style={styles.metaText}>
                        {service.branches.length}{" "}
                        {service.branches.length === 1 ? "filial" : "filiais"}
                      </Text>
                    </View>
                  </View>

                  {/* BRANCH PRICES */}

                  <View style={styles.branchPrices}>
                    {service.branches.map((serviceBranch) => (
                      <View
                        key={serviceBranch.id}
                        style={styles.branchPriceRow}
                      >
                        <View style={styles.branchNameContainer}>
                          <View style={styles.branchDot} />

                          <Text style={styles.branchName} numberOfLines={1}>
                            {serviceBranch.branch?.name ?? "Filial"}
                          </Text>
                        </View>

                        <Text style={styles.branchPrice}>
                          {formatCurrency(serviceBranch.price)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* MIN PRICE */}

                  <View style={styles.minimumPriceRow}>
                    <Text style={styles.minimumPriceLabel}>A partir de</Text>

                    <Text style={styles.minimumPrice}>
                      {formatCurrency(getMinimumPrice(service))}
                    </Text>
                  </View>
                </View>

                {/* ACTIONS */}

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => openEdit(service)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color={COLORS.secondary}
                    />
                  </Pressable>

                  <Pressable
                    style={[styles.iconButton, styles.deleteIconButton]}
                    onPress={() => confirmDelete(service)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.danger}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            {/* HEADER */}

            <View style={styles.sheetHeader}>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.eyebrow}>
                  {editing ? "EDITAR SERVIÇO" : "NOVO SERVIÇO"}
                </Text>

                <Text style={styles.sheetTitle}>
                  {editing ? "Atualizar serviço" : "Cadastrar serviço"}
                </Text>
              </View>

              <Pressable style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              {/* NAME */}

              <Text style={styles.inputLabel}>Nome do serviço *</Text>

              <TextInput
                value={form.name}
                onChangeText={(value) =>
                  updateForm({
                    name: value,
                  })
                }
                placeholder="Ex.: Corte feminino"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />

              {/* DESCRIPTION */}

              <Text style={styles.inputLabel}>Descrição</Text>

              <TextInput
                value={form.description}
                onChangeText={(value) =>
                  updateForm({
                    description: value,
                  })
                }
                placeholder="Descreva brevemente o serviço"
                placeholderTextColor={COLORS.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.input, styles.textarea]}
              />

              {/* DURATION */}

              <Text style={styles.inputLabel}>Duração *</Text>

              <View style={styles.durationRow}>
                {["30", "45", "60", "90", "120"].map((duration) => (
                  <Pressable
                    key={duration}
                    onPress={() =>
                      updateForm({
                        durationMinutes: duration,
                      })
                    }
                    style={[
                      styles.durationOption,
                      form.durationMinutes === duration &&
                        styles.durationOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationOptionText,
                        form.durationMinutes === duration &&
                          styles.durationOptionTextActive,
                      ]}
                    >
                      {duration}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={form.durationMinutes}
                onChangeText={(value) =>
                  updateForm({
                    durationMinutes: value.replace(/\D/g, ""),
                  })
                }
                keyboardType="number-pad"
                placeholder="Ou informe outro valor"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />

              {/* BRANCHES */}

              <View style={styles.sectionHeader}>
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.inputLabel}>
                    Filiais onde o serviço será oferecido *
                  </Text>

                  <Text style={styles.inputHint}>
                    Selecione as filiais e defina o preço individual de cada
                    uma.
                  </Text>
                </View>

                <View style={styles.selectedCountBadge}>
                  <Text style={styles.selectedCountText}>
                    {form.branches.filter((item) => item.active).length}
                  </Text>
                </View>
              </View>

              {branches.length === 0 ? (
                <View style={styles.noBranchesCard}>
                  <Ionicons
                    name="business-outline"
                    size={25}
                    color={COLORS.warning}
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.noBranchesTitle}>
                      Nenhuma filial encontrada
                    </Text>

                    <Text style={styles.noBranchesText}>
                      Cadastre uma filial antes de criar o serviço.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.branchesFormList}>
                  {branches.map((branch) => {
                    const item = form.branches.find(
                      (current) => current.branchId === branch.id,
                    );

                    const selected = item?.active === true;

                    return (
                      <View
                        key={branch.id}
                        style={[
                          styles.branchFormCard,
                          selected && styles.branchFormCardSelected,
                        ]}
                      >
                        <Pressable
                          style={styles.branchSelectArea}
                          onPress={() => toggleBranch(branch.id)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selected && styles.checkboxSelected,
                            ]}
                          >
                            {selected && (
                              <Ionicons
                                name="checkmark"
                                size={15}
                                color="#FFFFFF"
                              />
                            )}
                          </View>

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text style={styles.branchFormName}>
                              {branch.name}
                            </Text>

                            <Text style={styles.branchFormHint}>
                              {selected
                                ? "Serviço disponível nesta filial"
                                : "Toque para disponibilizar"}
                            </Text>
                          </View>
                        </Pressable>

                        {selected && (
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.pricePrefix}>R$</Text>

                            <TextInput
                              value={item?.price ?? ""}
                              onChangeText={(value) =>
                                updateBranchPrice(branch.id, value)
                              }
                              keyboardType="decimal-pad"
                              placeholder="0,00"
                              placeholderTextColor={COLORS.muted}
                              style={styles.priceInput}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* COLOR */}

              <Text style={styles.inputLabel}>Cor de identificação</Text>

              <View style={styles.colorRow}>
                {[
                  "#B5548F",
                  "#7967A8",
                  "#4E91A6",
                  "#D18A4C",
                  "#4D9B79",
                  "#C44D72",
                ].map((color) => (
                  <Pressable
                    key={color}
                    onPress={() =>
                      updateForm({
                        color,
                      })
                    }
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color,
                      },
                      form.color === color && styles.colorOptionSelected,
                    ]}
                  >
                    {form.color === color && (
                      <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* ACTIVE */}

              <View style={styles.switchRow}>
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.switchTitle}>Serviço ativo</Text>

                  <Text style={styles.switchDescription}>
                    Serviços ativos podem ser disponibilizados para agendamento.
                  </Text>
                </View>

                <Switch
                  value={form.active}
                  onValueChange={(value) =>
                    updateForm({
                      active: value,
                    })
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={form.active ? COLORS.primary : "#FFFFFF"}
                />
              </View>

              {/* SAVE */}

              <Pressable
                style={[
                  styles.primaryButton,
                  (creating || updating || branchesLoading) &&
                    styles.disabledButton,
                ]}
                disabled={creating || updating || branchesLoading}
                onPress={handleSave}
              >
                {creating || updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.primaryButtonText}>
                  {editing ? "Salvar alterações" : "Cadastrar serviço"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  page: {
    padding: 20,
    paddingBottom: 50,

    maxWidth: 1440,

    width: "100%",

    alignSelf: "center",
  },

  /* ----------------------------------------------------------
     HEADER
  ---------------------------------------------------------- */

  header: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 20,

    marginBottom: 22,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    ...SHADOW.soft,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 11,

    fontWeight: "800",

    letterSpacing: 1.5,

    color: COLORS.primary,

    marginBottom: 6,
  },

  title: {
    fontSize: 30,

    lineHeight: 36,

    fontWeight: "800",

    color: COLORS.text,
  },

  subtitle: {
    marginTop: 7,

    fontSize: 14,

    lineHeight: 21,

    color: COLORS.secondary,

    maxWidth: 650,
  },

  primaryHeaderButton: {
    minHeight: 46,

    paddingHorizontal: 18,

    borderRadius: 14,

    backgroundColor: COLORS.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    ...SHADOW.soft,
  },

  primaryHeaderButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",
  },

  /* ----------------------------------------------------------
     METRICS
  ---------------------------------------------------------- */

  metricsRow: {
    flexDirection: "row",

    gap: 12,

    marginBottom: 18,
  },

  metricCard: {
    flex: 1,

    minHeight: 118,

    padding: 16,

    backgroundColor: COLORS.card,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: COLORS.border,

    ...SHADOW.soft,
  },

  metricIcon: {
    width: 36,

    height: 36,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    marginBottom: 12,
  },

  metricLabel: {
    fontSize: 12,

    color: COLORS.secondary,

    fontWeight: "700",
  },

  metricValue: {
    marginTop: 2,

    fontSize: 25,

    lineHeight: 30,

    fontWeight: "800",

    color: COLORS.text,
  },

  metricDescription: {
    fontSize: 11,

    color: COLORS.muted,

    marginTop: 2,
  },

  /* ----------------------------------------------------------
     TOOLBAR
  ---------------------------------------------------------- */

  toolbar: {
    flexDirection: "row",

    gap: 12,

    marginBottom: 18,
  },

  searchBox: {
    flex: 1,

    minHeight: 48,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.card,

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    gap: 9,
  },

  searchInput: {
    flex: 1,

    color: COLORS.text,

    fontSize: 14,

    minHeight: 46,
  },

  activeFilter: {
    minHeight: 48,

    paddingHorizontal: 14,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.card,

    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  activeFilterText: {
    fontSize: 12,

    fontWeight: "700",

    color: COLORS.secondary,
  },

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  loadingBranches: {
    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    marginBottom: 15,
  },

  loadingBranchesText: {
    color: COLORS.secondary,

    fontSize: 13,
  },

  /* ----------------------------------------------------------
     STATES
  ---------------------------------------------------------- */

  stateCard: {
    backgroundColor: COLORS.card,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,

    padding: 30,

    alignItems: "center",

    justifyContent: "center",

    minHeight: 240,

    ...SHADOW.soft,
  },

  emptyIcon: {
    width: 62,

    height: 62,

    borderRadius: 20,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 14,
  },

  stateIconDanger: {
    width: 62,

    height: 62,

    borderRadius: 20,

    backgroundColor: COLORS.dangerLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 14,
  },

  stateTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: COLORS.text,

    textAlign: "center",
  },

  stateText: {
    marginTop: 7,

    maxWidth: 430,

    textAlign: "center",

    fontSize: 13,

    lineHeight: 20,

    color: COLORS.secondary,
  },

  retryButton: {
    marginTop: 18,

    minHeight: 42,

    paddingHorizontal: 16,

    borderRadius: 12,

    backgroundColor: COLORS.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  retryButtonText: {
    color: "#FFFFFF",

    fontWeight: "800",

    fontSize: 13,
  },

  /* ----------------------------------------------------------
     LIST
  ---------------------------------------------------------- */

  list: {
    gap: 14,
  },

  serviceCard: {
    backgroundColor: COLORS.card,

    borderRadius: 19,

    borderWidth: 1,

    borderColor: COLORS.border,

    overflow: "hidden",

    flexDirection: "row",

    ...SHADOW.soft,
  },

  serviceColor: {
    width: 5,
  },

  serviceMain: {
    flex: 1,

    padding: 17,
  },

  serviceTitleRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: 12,
  },

  serviceName: {
    fontSize: 17,

    lineHeight: 22,

    fontWeight: "800",

    color: COLORS.text,
  },

  serviceDescription: {
    marginTop: 4,

    fontSize: 12,

    lineHeight: 18,

    color: COLORS.secondary,
  },

  statusBadge: {
    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 999,
  },

  statusActive: {
    backgroundColor: COLORS.successLight,
  },

  statusInactive: {
    backgroundColor: COLORS.dangerLight,
  },

  statusText: {
    fontSize: 10,

    fontWeight: "800",
  },

  statusActiveText: {
    color: COLORS.success,
  },

  statusInactiveText: {
    color: COLORS.danger,
  },

  serviceMeta: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 15,

    marginTop: 13,
  },

  metaItem: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  metaText: {
    fontSize: 12,

    color: COLORS.secondary,

    fontWeight: "600",
  },

  /* ----------------------------------------------------------
     BRANCH PRICES
  ---------------------------------------------------------- */

  branchPrices: {
    marginTop: 15,

    padding: 12,

    borderRadius: 13,

    backgroundColor: "#FBF9FB",

    borderWidth: 1,

    borderColor: COLORS.border,
  },

  branchPriceRow: {
    minHeight: 31,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  branchNameContainer: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    gap: 7,
  },

  branchDot: {
    width: 7,

    height: 7,

    borderRadius: 99,

    backgroundColor: COLORS.primary,
  },

  branchName: {
    flex: 1,

    fontSize: 12,

    color: COLORS.secondary,

    fontWeight: "600",
  },

  branchPrice: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.text,
  },

  minimumPriceRow: {
    marginTop: 11,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: 5,
  },

  minimumPriceLabel: {
    fontSize: 11,

    color: COLORS.muted,
  },

  minimumPrice: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.primary,
  },

  /* ----------------------------------------------------------
     ACTIONS
  ---------------------------------------------------------- */

  cardActions: {
    padding: 12,

    gap: 8,

    justifyContent: "flex-start",
  },

  iconButton: {
    width: 38,

    height: 38,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  deleteIconButton: {
    backgroundColor: COLORS.dangerLight,

    borderColor: COLORS.dangerLight,
  },

  /* ----------------------------------------------------------
     MODAL
  ---------------------------------------------------------- */

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(34,30,43,0.48)",
  },

  sheet: {
    width: "100%",

    maxHeight: "94%",

    backgroundColor: COLORS.card,

    borderTopLeftRadius: 26,

    borderTopRightRadius: 26,

    paddingTop: 20,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 20,

    paddingBottom: 16,
  },

  sheetTitle: {
    marginTop: 2,

    fontSize: 22,

    fontWeight: "800",

    color: COLORS.text,
  },

  closeButton: {
    width: 38,

    height: 38,

    borderRadius: 12,

    backgroundColor: "#F7F3F7",

    alignItems: "center",

    justifyContent: "center",
  },

  form: {
    paddingHorizontal: 20,

    paddingBottom: 35,
  },

  inputLabel: {
    marginTop: 15,

    marginBottom: 8,

    fontSize: 12,

    fontWeight: "800",

    color: COLORS.text,
  },

  input: {
    minHeight: 48,

    paddingHorizontal: 14,

    borderRadius: 13,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: "#FFFFFF",

    color: COLORS.text,

    fontSize: 14,
  },

  textarea: {
    minHeight: 88,

    paddingTop: 13,
  },

  inputHint: {
    marginTop: 5,

    fontSize: 11,

    lineHeight: 17,

    color: COLORS.muted,
  },

  /* ----------------------------------------------------------
     DURATION
  ---------------------------------------------------------- */

  durationRow: {
    flexDirection: "row",

    gap: 8,

    marginBottom: 9,
  },

  durationOption: {
    flex: 1,

    minHeight: 40,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  durationOptionActive: {
    backgroundColor: COLORS.primaryLight,

    borderColor: COLORS.primary,
  },

  durationOptionText: {
    fontSize: 12,

    fontWeight: "700",

    color: COLORS.secondary,
  },

  durationOptionTextActive: {
    color: COLORS.primary,
  },

  /* ----------------------------------------------------------
     BRANCH FORM
  ---------------------------------------------------------- */

  sectionHeader: {
    marginTop: 8,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  selectedCountBadge: {
    minWidth: 30,

    height: 30,

    borderRadius: 10,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  selectedCountText: {
    color: COLORS.primary,

    fontSize: 12,

    fontWeight: "800",
  },

  branchesFormList: {
    gap: 9,

    marginTop: 3,
  },

  branchFormCard: {
    borderRadius: 15,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: "#FFFFFF",

    padding: 12,
  },

  branchFormCardSelected: {
    borderColor: "#E7BFD5",

    backgroundColor: "#FFFBFD",
  },

  branchSelectArea: {
    flexDirection: "row",

    alignItems: "center",

    gap: 11,
  },

  checkbox: {
    width: 23,

    height: 23,

    borderRadius: 7,

    borderWidth: 1.5,

    borderColor: COLORS.borderStrong,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primary,
  },

  branchFormName: {
    fontSize: 14,

    fontWeight: "800",

    color: COLORS.text,
  },

  branchFormHint: {
    marginTop: 2,

    fontSize: 11,

    color: COLORS.muted,
  },

  priceInputContainer: {
    marginTop: 10,

    height: 45,

    borderRadius: 11,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 11,
  },

  pricePrefix: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.secondary,

    marginRight: 5,
  },

  priceInput: {
    flex: 1,

    height: 43,

    color: COLORS.text,

    fontSize: 15,

    fontWeight: "700",
  },

  noBranchesCard: {
    marginTop: 5,

    padding: 15,

    borderRadius: 15,

    backgroundColor: COLORS.warningLight,

    borderWidth: 1,

    borderColor: "#F0DDBF",

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
  },

  noBranchesTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.text,
  },

  noBranchesText: {
    marginTop: 3,

    fontSize: 11,

    lineHeight: 17,

    color: COLORS.secondary,
  },

  /* ----------------------------------------------------------
     COLOR
  ---------------------------------------------------------- */

  colorRow: {
    flexDirection: "row",

    gap: 11,

    marginTop: 2,
  },

  colorOption: {
    width: 35,

    height: 35,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  colorOptionSelected: {
    borderWidth: 3,

    borderColor: "#FFFFFF",

    shadowColor: "#000000",

    shadowOpacity: 0.15,

    shadowRadius: 4,

    elevation: 3,
  },

  /* ----------------------------------------------------------
     SWITCH
  ---------------------------------------------------------- */

  switchRow: {
    marginTop: 20,

    padding: 14,

    borderRadius: 15,

    backgroundColor: "#FBF9FB",

    borderWidth: 1,

    borderColor: COLORS.border,

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
  },

  switchTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.text,
  },

  switchDescription: {
    marginTop: 3,

    fontSize: 11,

    lineHeight: 16,

    color: COLORS.secondary,
  },

  /* ----------------------------------------------------------
     BUTTON
  ---------------------------------------------------------- */

  primaryButton: {
    minHeight: 50,

    marginTop: 20,

    borderRadius: 14,

    backgroundColor: COLORS.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    ...SHADOW.medium,
  },

  primaryButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
