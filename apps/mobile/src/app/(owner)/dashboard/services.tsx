import React, { useMemo, useState } from "react";
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
  success: "#368661",
  successLight: "#E8F6EE",
  danger: "#C44D72",
  dangerLight: "#FDEBF1",
};

type Category = {
  id: string;
  name: string;
  description?: string | null;
  active?: boolean;
};

type Service = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  color?: string | null;
  active: boolean;
  categoryId: string;
  category?: Category;
};

type ServiceForm = {
  name: string;
  description: string;
  durationMinutes: string;
  categoryId: string;
  color: string;
  active: boolean;
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  durationMinutes: "60",
  categoryId: "",
  color: "#B5548F",
  active: true,
};

function unwrap<T>(response: any): T {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data as T;
  if (Array.isArray(data?.items)) return data.items as T;
  if (Array.isArray(data?.data)) return data.data as T;
  if (Array.isArray(data?.results)) return data.results as T;
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

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function normalizeColor(color?: string | null) {
  return color && /^#[0-9A-F]{6}$/i.test(color) ? color : COLORS.primary;
}

const servicesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getServicesOwner: builder.query<Service[], void>({
      query: () => ({
        url: "/services",
        method: "GET",
        params: { page: 1, limit: 100 },
      }),
      transformResponse: (response) => unwrap<Service[]>(response) ?? [],
      providesTags: ["Company"],
    }),
    getCategoriesOwner: builder.query<Category[], void>({
      query: () => ({
        url: "/categories",
        method: "GET",
        params: { page: 1, limit: 100 },
      }),
      transformResponse: (response) => unwrap<Category[]>(response) ?? [],
      providesTags: ["Company"],
    }),
    createServiceOwner: builder.mutation<Service, Partial<ServiceForm>>({
      query: (body) => ({ url: "/services", method: "POST", body }),
      invalidatesTags: ["Company"],
    }),
    updateServiceOwner: builder.mutation<
      Service,
      { id: string; body: Partial<ServiceForm> }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    deleteServiceOwner: builder.mutation<void, string>({
      query: (id) => ({ url: `/services/${id}`, method: "DELETE" }),
      invalidatesTags: ["Company"],
    }),
    createCategoryOwner: builder.mutation<
      Category,
      { name: string; description?: string; active?: boolean }
    >({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      invalidatesTags: ["Company"],
    }),
  }),
});

const {
  useGetServicesOwnerQuery,
  useGetCategoriesOwnerQuery,
  useCreateServiceOwnerMutation,
  useUpdateServiceOwnerMutation,
  useDeleteServiceOwnerMutation,
  useCreateCategoryOwnerMutation,
} = servicesApi;

export default function OwnerServicesScreen() {
  const {
    data: services = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetServicesOwnerQuery();

  const { data: categories = [], refetch: refetchCategories } =
    useGetCategoriesOwnerQuery();

  const [createService, { isLoading: creating }] =
    useCreateServiceOwnerMutation();
  const [updateService, { isLoading: updating }] =
    useUpdateServiceOwnerMutation();
  const [deleteService] = useDeleteServiceOwnerMutation();
  const [createCategory, { isLoading: creatingCategory }] =
    useCreateCategoryOwnerMutation();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyActive, setOnlyActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [categoryName, setCategoryName] = useState("");

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !term ||
        service.name.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "all" || service.categoryId === categoryFilter;

      const matchesActive = !onlyActive || service.active;

      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [services, search, categoryFilter, onlyActive]);

  const activeCount = services.filter((item) => item.active).length;

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "",
    });
    setModalVisible(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      name: service.name ?? "",
      description: service.description ?? "",
      durationMinutes: String(service.durationMinutes ?? 60),
      categoryId: service.categoryId ?? service.category?.id ?? "",
      color: normalizeColor(service.color),
      active: service.active !== false,
    });
    setModalVisible(true);
  }

  function closeModal() {
    if (!creating && !updating) setModalVisible(false);
  }

  async function handleSave() {
    const name = form.name.trim();
    const duration = Number(form.durationMinutes);

    if (!name) {
      Alert.alert("Campo obrigatório", "Informe o nome do serviço.");
      return;
    }

    if (!form.categoryId) {
      Alert.alert(
        "Categoria obrigatória",
        "Selecione uma categoria para o serviço.",
      );
      return;
    }

    if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
      Alert.alert(
        "Duração inválida",
        "Informe uma duração entre 5 e 1440 minutos.",
      );
      return;
    }

    const body = {
      name,
      description: form.description.trim() || undefined,
      durationMinutes: duration,
      categoryId: form.categoryId,
      color: normalizeColor(form.color),
      active: form.active,
    };

    try {
      if (editing) {
        await updateService({ id: editing.id, body }).unwrap();
        Alert.alert("Tudo certo", "Serviço atualizado com sucesso.");
      } else {
        await createService(body).unwrap();
        Alert.alert("Tudo certo", "Serviço cadastrado com sucesso.");
      }

      setModalVisible(false);
      refetch();
    } catch (err) {
      Alert.alert("Não foi possível salvar", getErrorMessage(err));
    }
  }

  function confirmDelete(service: Service) {
    Alert.alert(
      "Excluir serviço?",
      `O serviço "${service.name}" será removido desta filial.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteService(service.id).unwrap();
              Alert.alert(
                "Serviço removido",
                "O serviço foi removido com sucesso.",
              );
              refetch();
            } catch (err) {
              Alert.alert("Não foi possível excluir", getErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  async function handleCreateCategory() {
    const name = categoryName.trim();

    if (!name) {
      Alert.alert("Campo obrigatório", "Informe o nome da categoria.");
      return;
    }

    try {
      const created = await createCategory({
        name,
        active: true,
      }).unwrap();

      setCategoryModalVisible(false);
      setCategoryName("");
      await refetchCategories();

      if (created?.id) {
        setForm((current) => ({ ...current, categoryId: created.id }));
      }
    } catch (err) {
      Alert.alert("Não foi possível criar", getErrorMessage(err));
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => {
              refetch();
              refetchCategories();
            }}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>CATÁLOGO DA FILIAL</Text>
            <Text style={styles.title}>Serviços</Text>
            <Text style={styles.subtitle}>
              Organize o catálogo do seu salão e deixe cada atendimento pronto
              para agendamento.
            </Text>
          </View>

          <Pressable style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Novo serviço</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: COLORS.primaryLight },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.summaryValue}>{services.length}</Text>
            <Text style={styles.summaryLabel}>Total de serviços</Text>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: COLORS.successLight },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Ativos</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: "#F0EDF8" }]}>
              <Ionicons name="layers-outline" size={20} color="#7967A8" />
            </View>
            <Text style={styles.summaryValue}>{categories.length}</Text>
            <Text style={styles.summaryLabel}>Categorias</Text>
          </View>
        </View>

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
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            <Pressable
              onPress={() => setCategoryFilter("all")}
              style={[
                styles.filterChip,
                categoryFilter === "all" && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === "all" && styles.filterChipTextActive,
                ]}
              >
                Todas
              </Text>
            </Pressable>

            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setCategoryFilter(category.id)}
                style={[
                  styles.filterChip,
                  categoryFilter === category.id && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    categoryFilter === category.id &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => setOnlyActive((current) => !current)}
              style={[styles.filterChip, onlyActive && styles.filterChipActive]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={15}
                color={onlyActive ? "#FFFFFF" : COLORS.secondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  onlyActive && styles.filterChipTextActive,
                ]}
              >
                Ativos
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Seu catálogo</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredServices.length} serviço(s) encontrado(s)
            </Text>
          </View>

          <Pressable
            style={styles.categoryButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={17}
              color={COLORS.primary}
            />
            <Text style={styles.categoryButtonText}>Categoria</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateTitle}>Carregando serviços...</Text>
            <Text style={styles.stateText}>
              Estamos preparando seu catálogo.
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.stateCard}>
            <Ionicons
              name="alert-circle-outline"
              size={35}
              color={COLORS.danger}
            />
            <Text style={styles.stateTitle}>Não foi possível carregar</Text>
            <Text style={styles.stateText}>{getErrorMessage(error)}</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </Pressable>
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
              Cadastre seu primeiro serviço ou ajuste os filtros da busca.
            </Text>
            <Pressable style={styles.retryButton} onPress={openCreate}>
              <Ionicons name="add" size={17} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Cadastrar serviço</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View
                  style={[
                    styles.serviceColor,
                    { backgroundColor: normalizeColor(service.color) },
                  ]}
                />

                <View style={styles.serviceMain}>
                  <View style={styles.serviceTitleRow}>
                    <Text style={styles.serviceName}>{service.name}</Text>
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

                  <Text style={styles.categoryLabel}>
                    {service.category?.name ??
                      categories.find(
                        (category) => category.id === service.categoryId,
                      )?.name ??
                      "Sem categoria"}
                  </Text>

                  {!!service.description && (
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}

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
                        name="calendar-outline"
                        size={16}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.metaText}>Agendamento online</Text>
                    </View>
                  </View>
                </View>

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
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
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
            >
              <Text style={styles.inputLabel}>Nome do serviço *</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
                placeholder="Ex.: Corte feminino"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                value={form.description}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, description: value }))
                }
                placeholder="Explique brevemente como é o serviço"
                placeholderTextColor={COLORS.muted}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textarea]}
              />

              <Text style={styles.inputLabel}>Categoria *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryOptions}
              >
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        categoryId: category.id,
                      }))
                    }
                    style={[
                      styles.categoryOption,
                      form.categoryId === category.id &&
                        styles.categoryOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        form.categoryId === category.id &&
                          styles.categoryOptionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.addCategoryOption}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                  <Text style={styles.addCategoryText}>Nova</Text>
                </Pressable>
              </ScrollView>

              <Text style={styles.inputLabel}>Duração (minutos) *</Text>
              <View style={styles.durationRow}>
                {["30", "45", "60", "90", "120"].map((duration) => (
                  <Pressable
                    key={duration}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        durationMinutes: duration,
                      }))
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
                  setForm((current) => ({
                    ...current,
                    durationMinutes: value.replace(/\D/g, ""),
                  }))
                }
                keyboardType="number-pad"
                placeholder="Ou informe outro valor"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />

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
                      setForm((current) => ({ ...current, color }))
                    }
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      form.color === color && styles.colorOptionSelected,
                    ]}
                  >
                    {form.color === color && (
                      <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Serviço ativo</Text>
                  <Text style={styles.switchDescription}>
                    Serviços ativos podem ser disponibilizados para agendamento.
                  </Text>
                </View>
                <Switch
                  value={form.active}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, active: value }))
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={form.active ? COLORS.primary : "#FFFFFF"}
                />
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  (creating || updating) && styles.disabledButton,
                ]}
                disabled={creating || updating}
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

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.centerModalBackdrop}>
          <View style={styles.categorySheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>CATÁLOGO</Text>
                <Text style={styles.sheetTitle}>Nova categoria</Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nome da categoria *</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Ex.: Cabelos, Unhas, Estética"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              autoFocus
            />

            <Pressable
              style={[
                styles.primaryButton,
                creatingCategory && styles.disabledButton,
              ]}
              disabled={creatingCategory}
              onPress={handleCreateCategory}
            >
              {creatingCategory ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.primaryButtonText}>Criar categoria</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  page: {
    padding: 20,
    paddingBottom: 44,
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: COLORS.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.secondary,
    maxWidth: 680,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 13,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryValue: { fontSize: 25, fontWeight: "900", color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.secondary, marginTop: 4 },
  toolbar: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filtersRow: { gap: 8, paddingTop: 12, paddingBottom: 2 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { color: COLORS.secondary, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#FFFFFF" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  sectionSubtitle: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  categoryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  list: { gap: 12 },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    gap: 12,
  },
  serviceColor: { width: 5, borderRadius: 8, alignSelf: "stretch" },
  serviceMain: { flex: 1, minWidth: 0 },
  serviceTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  serviceName: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: "900" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { backgroundColor: COLORS.successLight },
  statusInactive: { backgroundColor: COLORS.dangerLight },
  statusText: { fontSize: 10, fontWeight: "800" },
  statusActiveText: { color: COLORS.success },
  statusInactiveText: { color: COLORS.danger },
  categoryLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  serviceDescription: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  serviceMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 12,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: COLORS.secondary, fontSize: 11, fontWeight: "600" },
  cardActions: { gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8F4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconButton: { backgroundColor: COLORS.dangerLight },
  stateCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    alignItems: "center",
    padding: 32,
    marginTop: 8,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  stateText: {
    color: COLORS.secondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 420,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 18,
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(35, 25, 39, 0.35)",
  },
  centerModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(35, 25, 39, 0.35)",
  },
  sheet: {
    maxHeight: "94%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  categorySheet: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { paddingBottom: 24 },
  inputLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 14,
  },
  textarea: { minHeight: 92, paddingTop: 13, textAlignVertical: "top" },
  categoryOptions: { gap: 8, paddingBottom: 3 },
  categoryOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryOptionTextActive: { color: "#FFFFFF" },
  addCategoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addCategoryText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  durationRow: { flexDirection: "row", gap: 8, marginBottom: 9 },
  durationOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  durationOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationOptionText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  durationOptionTextActive: { color: "#FFFFFF" },
  colorRow: { flexDirection: "row", gap: 13, flexWrap: "wrap" },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 23,
    padding: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
  },
  switchTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  switchDescription: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    minHeight: 52,
    marginTop: 22,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  disabledButton: { opacity: 0.6 },
});
