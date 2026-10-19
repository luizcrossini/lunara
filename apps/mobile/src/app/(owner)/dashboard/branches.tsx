import React from "react";

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
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { baseApi } from "@/core/api/baseApi";

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#9A4179",
  primaryLight: "#FBEEF5",

  accent: "#7967A8",
  accentLight: "#F1EDF9",

  background: "#FAF8FB",
  card: "#FFFFFF",

  text: "#221E2B",
  textSecondary: "#6C6472",
  textMuted: "#A79EAC",

  border: "#F0E8EE",
  borderStrong: "#E6DAE3",

  success: "#3E8F64",
  successLight: "#E8F6EE",

  warning: "#B97A2E",
  warningLight: "#FDF3E5",

  danger: "#C0416F",
  dangerLight: "#FBE7EF",
};

/* =========================================================
   TYPES
========================================================= */

type Address = {
  id?: string;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

type Branch = {
  id: string;
  name: string;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  address?: Address | null;
  createdAt?: string;
  updatedAt?: string;
};

type BranchForm = {
  name: string;
  email: string;
  phone: string;

  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
};

const EMPTY_FORM: BranchForm = {
  name: "",
  email: "",
  phone: "",

  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
};

/* =========================================================
   API
========================================================= */

const branchApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], void>({
      query: () => ({
        url: "/branches",
        method: "GET",
      }),

      transformResponse: (response: any) => {
        return response?.data ?? response ?? [];
      },

      providesTags: ["Company"],
    }),

    createBranch: builder.mutation<Branch, BranchForm>({
      query: (body) => ({
        url: "/branches",
        method: "POST",
        body,
      }),

      transformResponse: (response: any) => {
        return response?.data ?? response;
      },

      invalidatesTags: ["Company"],
    }),

    updateBranch: builder.mutation<
      Branch,
      { id: string; body: Partial<BranchForm> }
    >({
      query: ({ id, body }) => ({
        url: `/branches/${id}`,
        method: "PATCH",
        body,
      }),

      transformResponse: (response: any) => {
        return response?.data ?? response;
      },

      invalidatesTags: ["Company"],
    }),
  }),
});

const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
} = branchApi;

/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(error: any): string {
  if (!error) {
    return "Ocorreu um erro inesperado.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.data?.message) {
    if (Array.isArray(error.data.message)) {
      return error.data.message.join("\n");
    }

    return String(error.data.message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return "Não foi possível concluir a operação.";
}

function formatPhone(value?: string | null) {
  if (!value) {
    return "Telefone não informado";
  }

  return value;
}

function formatAddress(address?: Address | null) {
  if (!address) {
    return "Endereço não informado";
  }

  const parts = [
    address.street,
    address.number,
    address.district,
    address.city,
    address.state,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
}

/* =========================================================
   INPUT
========================================================= */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

/* =========================================================
   BRANCH CARD
========================================================= */

function BranchCard({
  branch,
  onEdit,
}: {
  branch: Branch;
  onEdit: (branch: Branch) => void;
}) {
  return (
    <View style={styles.branchCard}>
      <View style={styles.branchCardTop}>
        <View style={styles.branchIcon}>
          <Ionicons name="business-outline" size={22} color={COLORS.primary} />
        </View>

        <View style={styles.branchMain}>
          <Text style={styles.branchName} numberOfLines={1}>
            {branch.name}
          </Text>

          <Text style={styles.branchSlug} numberOfLines={1}>
            /{branch.slug ?? "sem-slug"}
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />

          <Text style={styles.activeBadgeText}>Ativa</Text>
        </View>
      </View>

      <View style={styles.branchDivider} />

      <View style={styles.branchInfo}>
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={17}
            color={COLORS.textSecondary}
          />

          <Text style={styles.infoText} numberOfLines={2}>
            {formatAddress(branch.address)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="call-outline"
            size={17}
            color={COLORS.textSecondary}
          />

          <Text style={styles.infoText} numberOfLines={1}>
            {formatPhone(branch.phone)}
          </Text>
        </View>

        {branch.email ? (
          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={17}
              color={COLORS.textSecondary}
            />

            <Text style={styles.infoText} numberOfLines={1}>
              {branch.email}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => onEdit(branch)}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
      >
        <Ionicons name="create-outline" size={17} color={COLORS.primary} />

        <Text style={styles.editButtonText}>Editar unidade</Text>

        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

/* =========================================================
   FORM MODAL
========================================================= */

function BranchFormModal({
  visible,
  editingBranch,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  editingBranch: Branch | null;
  form: BranchForm;
  saving: boolean;
  onChange: (field: keyof BranchForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.formModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <View style={styles.modalIcon}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View>
                  <Text style={styles.modalTitle}>
                    {editingBranch ? "Editar unidade" : "Nova unidade"}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editingBranch
                      ? "Atualize os dados da unidade"
                      : "Cadastre uma nova unidade"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.formSectionTitle}>Dados da unidade</Text>

              <Field
                label="Nome da unidade"
                value={form.name}
                onChangeText={(value) => onChange("name", value)}
                placeholder="Ex.: LUNARA Centro"
                required
              />

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Field
                    label="E-mail"
                    value={form.email}
                    onChangeText={(value) => onChange("email", value)}
                    placeholder="contato@lunara.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formColumn}>
                  <Field
                    label="Telefone"
                    value={form.phone}
                    onChangeText={(value) => onChange("phone", value)}
                    placeholder="(31) 99999-9999"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={styles.formSectionTitle}>Endereço</Text>

              <Field
                label="CEP"
                value={form.zipCode}
                onChangeText={(value) => onChange("zipCode", value)}
                placeholder="00000-000"
                keyboardType="phone-pad"
                required
              />

              <View style={styles.formRow}>
                <View style={[styles.formColumn, styles.streetColumn]}>
                  <Field
                    label="Rua"
                    value={form.street}
                    onChangeText={(value) => onChange("street", value)}
                    placeholder="Rua / Avenida"
                    required
                  />
                </View>

                <View style={styles.numberColumn}>
                  <Field
                    label="Número"
                    value={form.number}
                    onChangeText={(value) => onChange("number", value)}
                    placeholder="123"
                    required
                  />
                </View>
              </View>

              <Field
                label="Complemento"
                value={form.complement}
                onChangeText={(value) => onChange("complement", value)}
                placeholder="Sala, loja, andar..."
              />

              <Field
                label="Bairro"
                value={form.district}
                onChangeText={(value) => onChange("district", value)}
                placeholder="Centro"
                required
              />

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Field
                    label="Cidade"
                    value={form.city}
                    onChangeText={(value) => onChange("city", value)}
                    placeholder="Belo Horizonte"
                    required
                  />
                </View>

                <View style={styles.stateColumn}>
                  <Field
                    label="UF"
                    value={form.state}
                    onChangeText={(value) =>
                      onChange("state", value.toUpperCase())
                    }
                    placeholder="MG"
                    autoCapitalize="characters"
                    required
                  />
                </View>
              </View>

              <View style={styles.requiredHint}>
                <Text style={styles.requiredHintText}>
                  * Campos obrigatórios
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={onSubmit}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  saving && styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />

                    <Text style={styles.saveButtonText}>
                      {editingBranch ? "Salvar alterações" : "Criar unidade"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* =========================================================
   SCREEN
========================================================= */

export default function BranchesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 760;

  const {
    data: branches = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetBranchesQuery();

  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();

  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const [modalVisible, setModalVisible] = React.useState(false);

  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null);

  const [form, setForm] = React.useState<BranchForm>(EMPTY_FORM);

  const saving = isCreating || isUpdating;

  function openCreateModal() {
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);

    setForm({
      name: branch.name ?? "",
      email: branch.email ?? "",
      phone: branch.phone ?? "",

      street: branch.address?.street ?? "",
      number: branch.address?.number ?? "",
      complement: branch.address?.complement ?? "",
      district: branch.address?.district ?? "",
      city: branch.address?.city ?? "",
      state: branch.address?.state ?? "",
      zipCode: branch.address?.zipCode ?? "",
    });

    setModalVisible(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingBranch(null);
    setForm(EMPTY_FORM);
  }

  function updateForm(field: keyof BranchForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Informe o nome da unidade.");
      return false;
    }

    if (!form.street.trim()) {
      Alert.alert("Campo obrigatório", "Informe a rua da unidade.");
      return false;
    }

    if (!form.number.trim()) {
      Alert.alert("Campo obrigatório", "Informe o número da unidade.");
      return false;
    }

    if (!form.district.trim()) {
      Alert.alert("Campo obrigatório", "Informe o bairro.");
      return false;
    }

    if (!form.city.trim()) {
      Alert.alert("Campo obrigatório", "Informe a cidade.");
      return false;
    }

    if (!form.state.trim() || form.state.trim().length !== 2) {
      Alert.alert("Estado inválido", "Informe a UF com 2 caracteres. Ex.: MG.");
      return false;
    }

    if (!form.zipCode.trim()) {
      Alert.alert("Campo obrigatório", "Informe o CEP.");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingBranch) {
        await updateBranch({
          id: editingBranch.id,
          body: {
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,

            street: form.street.trim(),
            number: form.number.trim(),
            complement: form.complement.trim() || undefined,
            district: form.district.trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
            zipCode: form.zipCode.trim(),
          },
        }).unwrap();

        Alert.alert(
          "Unidade atualizada",
          "Os dados foram atualizados com sucesso.",
        );
      } else {
        await createBranch({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),

          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim(),
          district: form.district.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          zipCode: form.zipCode.trim(),
        }).unwrap();

        Alert.alert("Unidade criada", "A unidade foi cadastrada com sucesso.");
      }

      closeModal();
      await refetch();
    } catch (error) {
      Alert.alert("Não foi possível salvar", getErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[styles.page, isMobile && styles.pageMobile]}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={[styles.header, isMobile && styles.headerMobile]}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </Pressable>

            <View>
              <Text style={styles.eyebrow}>CONFIGURAÇÃO</Text>

              <Text style={styles.title}>Unidades</Text>

              <Text style={styles.subtitle}>
                Gerencie as unidades do seu negócio.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openCreateModal}
            style={({ pressed }) => [
              styles.newButton,
              isMobile && styles.newButtonMobile,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />

            <Text style={styles.newButtonText}>Nova unidade</Text>
          </Pressable>
        </View>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <View style={[styles.summaryRow, isMobile && styles.summaryRowMobile]}>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: COLORS.primaryLight,
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>UNIDADES</Text>

              <Text style={styles.summaryValue}>{branches.length}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: COLORS.successLight,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={COLORS.success}
              />
            </View>

            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>STATUS</Text>

              <Text style={styles.summaryStatus}>Operação ativa</Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            BRANCHES
        ===================================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>SUAS UNIDADES</Text>

            <Text style={styles.sectionTitle}>Filiais cadastradas</Text>
          </View>

          <Pressable
            onPress={() => refetch()}
            disabled={isFetching}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
            ]}
          >
            {isFetching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={18}
                color={COLORS.primary}
              />
            )}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />

            <Text style={styles.loadingText}>Carregando unidades...</Text>
          </View>
        ) : branches.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="business-outline"
                size={36}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>Nenhuma unidade cadastrada</Text>

            <Text style={styles.emptyText}>
              Cadastre a primeira unidade para começar a configurar a operação
              da sua empresa.
            </Text>

            <Pressable
              onPress={openCreateModal}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />

              <Text style={styles.emptyButtonText}>Criar primeira unidade</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[styles.branchGrid, isMobile && styles.branchGridMobile]}
          >
            {branches.map((branch) => (
              <View
                key={branch.id}
                style={[
                  styles.branchGridItem,
                  !isMobile && styles.branchGridItemDesktop,
                ]}
              >
                <BranchCard branch={branch} onEdit={openEditModal} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* =======================================================
          FORM MODAL
      ======================================================= */}

      <BranchFormModal
        visible={modalVisible}
        editingBranch={editingBranch}
        form={form}
        saving={saving}
        onChange={updateForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  page: {
    padding: 22,
    paddingBottom: 60,
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },

  pageMobile: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 25,
  },

  headerMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    flex: 1,
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
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 5,
  },

  title: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 5,
  },

  newButton: {
    minHeight: 45,
    paddingHorizontal: 17,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  newButtonMobile: {
    width: "100%",
  },

  newButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 30,
  },

  summaryRowMobile: {
    flexDirection: "column",
  },

  summaryCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryContent: {
    flex: 1,
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },

  summaryStatus: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  refreshButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  branchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },

  branchGridMobile: {
    flexDirection: "column",
  },

  branchGridItem: {
    width: "100%",
  },

  branchGridItemDesktop: {
    width: "48%",
    minWidth: 320,
    flexGrow: 1,
  },

  branchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },

  branchCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  branchIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  branchMain: {
    flex: 1,
    minWidth: 0,
  },

  branchName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  branchSlug: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  activeBadge: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: COLORS.successLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },

  activeBadgeText: {
    color: COLORS.success,
    fontSize: 8.5,
    fontWeight: "900",
  },

  branchDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  branchInfo: {
    gap: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },

  editButton: {
    marginTop: 17,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: "900",
    flex: 1,
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  emptyState: {
    minHeight: 330,
    backgroundColor: COLORS.card,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 430,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  emptyButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },

  /* =======================================================
     MODAL
  ======================================================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(34,30,43,0.45)",
    justifyContent: "flex-end",
  },

  modalKeyboard: {
    width: "100%",
    maxHeight: "94%",
  },

  formModal: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "94%",
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: "hidden",
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 17,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },

  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  formContent: {
    padding: 20,
    paddingBottom: 25,
  },

  formSectionTitle: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 5,
  },

  field: {
    marginBottom: 13,
    flex: 1,
  },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: "800",
    marginBottom: 6,
  },

  input: {
    minHeight: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 11.5,
  },

  inputMultiline: {
    minHeight: 85,
    paddingTop: 12,
  },

  formRow: {
    flexDirection: "row",
    gap: 12,
  },

  formColumn: {
    flex: 1,
  },

  streetColumn: {
    flex: 3,
  },

  numberColumn: {
    flex: 1,
  },

  stateColumn: {
    width: 100,
  },

  requiredHint: {
    marginTop: 4,
    marginBottom: 8,
  },

  requiredHintText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  modalFooter: {
    padding: 15,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    minHeight: 45,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: "900",
  },

  saveButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.75,
  },
});
