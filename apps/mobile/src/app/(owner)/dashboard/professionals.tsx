import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { baseApi } from "@/core/api/baseApi";
import { authStorage } from "@/core/auth/auth-storage.service";

const COLORS = {
  primary: "#B5548F",
  primaryDark: "#9A4179",
  primaryLight: "#FBEEF5",
  background: "#FAF8FB",
  card: "#FFFFFF",
  text: "#221E2B",
  textSecondary: "#6C6472",
  textMuted: "#A79EAC",
  border: "#F0E8EE",
  success: "#3E8F64",
  successLight: "#E8F6EE",
  danger: "#C0416F",
  dangerLight: "#FBE7EF",
};

type Service = {
  id: string;
  name: string;
  durationMinutes?: number;
  color?: string | null;
  active?: boolean;
};

type ProfessionalService = {
  id: string;
  serviceId: string;
  price?: number | string | null;
  active?: boolean;
  service?: Service;
  professionalId?: string;
  professional?: { id?: string };
};

type Branch = { id: string; name: string; active?: boolean };

type Professional = {
  id: string;
  active?: boolean;
  bio?: string | null;
  specialties?: string | null;
  instagram?: string | null;
  website?: string | null;
  color?: string | null;
  commissionPercentage?: number | string | null;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    photoUrl?: string | null;
  };
  professionalServices?: ProfessionalService[];
  branches?: Array<{ id?: string; branchId?: string; branch?: { id?: string; name?: string } }>;
};

type ProfessionalForm = {
  userId: string;
  mode: "existing" | "new";
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string;
  instagram: string;
  website: string;
  color: string;
  commissionPercentage: string;
  active: boolean;
  branchIds: string[];
};

const unwrap = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  // Aceita os formatos mais comuns da API:
  // [], { items: [] }, { data: [] }, { data: { items: [] } },
  // { data: { data: [] } }, { services: [] }, etc.
  const candidates = [
    response.items,
    response.data,
    response.services,
    response.results,
    response.data?.items,
    response.data?.services,
    response.data?.results,
    response.data?.data,
    response.data?.data?.items,
    response.data?.data?.services,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  // Fallback para respostas com mais um nível de aninhamento.
  for (const value of Object.values(response)) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = unwrap(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const professionalsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProfessionals: builder.query<Professional[], void>({
      query: () => ({
        url: "/professional-profiles",
        method: "GET",
        params: { page: 1, limit: 100 },
      }),
      transformResponse: (response: any) => unwrap(response),
      providesTags: ["Company"],
    }),
    getBranches: builder.query<Branch[], string>({
      query: (companyId) => ({ url: `/branches/company/${companyId}`, method: "GET" }),
      transformResponse: (response: any) => unwrap(response),
      providesTags: ["Company"],
    }),
    getServices: builder.query<Service[], string>({
      query: (branchId) => ({
        url: "/services",
        method: "GET",
        params: { page: 1, limit: 100 },
        headers: { "x-branch-id": branchId },
      }),
      transformResponse: (response: any) => unwrap(response),
      providesTags: ["Company"],
    }),
    getProfessionalServices: builder.query<ProfessionalService[], void>({
      query: () => ({
        url: "/professional-services",
        method: "GET",
        params: { page: 1, limit: 500 },
      }),
      transformResponse: (response: any) => unwrap(response),
      providesTags: ["Company"],
    }),
    findUserByEmail: builder.query<any, string>({
      query: (email) => ({
        url: "/users",
        method: "GET",
        params: { email: email.trim(), page: 1, limit: 10 },
      }),
      transformResponse: (response: any) => {
        const items = unwrap(response);
        return Array.isArray(items) ? (items[0] ?? null) : items;
      },
    }),
    createUser: builder.mutation<
      any,
      { name: string; email: string; phone: string }
    >({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
    }),
    createProfessional: builder.mutation<Professional, ProfessionalForm>({
      query: (body) => ({
        url: "/professional-profiles",
        method: "POST",
        body: {
          userId: body.userId.trim(),
          bio: body.bio.trim() || undefined,
          specialties: body.specialties.trim() || undefined,
          instagram: body.instagram.trim() || undefined,
          website: body.website.trim() || undefined,
          active: body.active,
        },
      }),
      invalidatesTags: ["Company"],
    }),
    updateProfessional: builder.mutation<
      Professional,
      { id: string; body: Partial<ProfessionalForm> }
    >({
      query: ({ id, body }) => ({
        url: `/professional-profiles/${id}`,
        method: "PATCH",
        body: {
          bio: body.bio?.trim() || undefined,
          specialties: body.specialties?.trim() || undefined,
          instagram: body.instagram?.trim() || undefined,
          website: body.website?.trim() || undefined,
          active: body.active,
        },
      }),
      invalidatesTags: ["Company"],
    }),
    createProfessionalBranch: builder.mutation<
      any,
      {
        professionalId: string;
        color: string;
        commissionPercentage: number;
        active: boolean;
      }
    >({
      query: (body) => ({
        url: "/professional-branches",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    updateProfessionalBranch: builder.mutation<
      any,
      {
        id: string;
        color: string;
        commissionPercentage: number;
        active: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/professional-branches/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    createProfessionalService: builder.mutation<
      any,
      {
        professionalId: string;
        serviceId: string;
        price: number;
        active: boolean;
      }
    >({
      query: (body) => ({
        url: "/professional-services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    updateProfessionalService: builder.mutation<
      any,
      { id: string; price?: number; active?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/professional-services/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    deleteProfessionalService: builder.mutation<any, string>({
      query: (id) => ({
        url: `/professional-services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

const {
  useGetProfessionalsQuery,
  useGetServicesQuery,
  useGetBranchesQuery,
  useGetProfessionalServicesQuery,
  useCreateProfessionalMutation,
  useLazyFindUserByEmailQuery,
  useCreateUserMutation,
  useUpdateProfessionalMutation,
  useCreateProfessionalBranchMutation,
  useUpdateProfessionalBranchMutation,
  useCreateProfessionalServiceMutation,
  useUpdateProfessionalServiceMutation,
  useDeleteProfessionalServiceMutation,
} = professionalsApi;

function money(value?: number | string | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function getErrorMessage(error: any) {
  return String(
    error?.data?.message ??
      error?.error ??
      "Não foi possível concluir a operação.",
  );
}

function emptyForm(): ProfessionalForm {
  return {
    userId: "",
    mode: "existing",
    name: "",
    email: "",
    phone: "",
    bio: "",
    specialties: "",
    instagram: "",
    website: "",
    color: "#B5548F",
    commissionPercentage: "0",
    active: true,
    branchIds: [],
  };
}

const AGENDA_COLORS = [
  "#B5548F",
  "#9A4179",
  "#D9467A",
  "#E76F51",
  "#F4A261",
  "#E9C46A",
  "#8A9A5B",
  "#2A9D8F",
  "#168AAD",
  "#457B9D",
  "#4361EE",
  "#6C63FF",
  "#7B2CBF",
  "#9D4EDD",
  "#6D597A",
  "#495057",
  "#343A40",
  "#D62828",
  "#F72585",
  "#FF8FAB",
  "#C77DFF",
  "#80B918",
  "#52B788",
  "#00B4D8",
];

function AgendaColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [paletteWidth, setPaletteWidth] = React.useState(0);
  const normalizedValue = String(value || "").toUpperCase();
  const selectedColor = AGENDA_COLORS.find(
    (color) => color.toUpperCase() === normalizedValue,
  );
  const previewColor = /^#[0-9A-F]{6}$/i.test(value) ? value : COLORS.primary;

  function selectColorFromTouch(event: any) {
    if (!paletteWidth) return;

    const { locationX, locationY } = event.nativeEvent;
    const cellSize = 41;
    const columns = Math.max(1, Math.floor((paletteWidth + 10) / cellSize));
    const column = Math.floor(locationX / cellSize);
    const row = Math.floor(locationY / cellSize);
    const index = row * columns + column;
    const color = AGENDA_COLORS[index];

    if (color) onChange(color);
  }

  return (
    <View style={styles.colorPickerContainer}>
      <View style={styles.colorPickerPreviewRow}>
        <View
          style={[styles.colorPickerPreview, { backgroundColor: previewColor }]}
        />
        <View style={styles.colorPickerPreviewInfo}>
          <Text style={styles.colorPickerPreviewTitle}>Cor selecionada</Text>
          <Text style={styles.colorPickerHex}>
            {String(value || COLORS.primary).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.colorPickerHint}>
        Toque ou arraste entre as opções para escolher a cor da agenda.
      </Text>

      <View
        style={styles.colorPalette}
        onLayout={(event) => setPaletteWidth(event.nativeEvent.layout.width)}
        onTouchStart={selectColorFromTouch}
        onTouchMove={selectColorFromTouch}
      >
        {AGENDA_COLORS.map((color) => {
          const isSelected =
            selectedColor?.toUpperCase() === color.toUpperCase();

          return (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar cor ${color}`}
              onPress={() => onChange(color)}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                isSelected && styles.colorSwatchSelected,
              ]}
            >
              {isSelected ? (
                <Ionicons name="checkmark" size={17} color="#FFFFFF" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customColorRow}>
        <Text style={styles.customColorLabel}>Hexadecimal</Text>
        <TextInput
          value={value}
          onChangeText={(color) => onChange(color.toUpperCase())}
          placeholder="#B5548F"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          maxLength={7}
          style={styles.customColorInput}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function ServiceRow({
  service,
  linked,
  link,
  onToggle,
  onPrice,
}: {
  service: Service;
  linked?: ProfessionalService;
  link: boolean;
  onToggle: () => void;
  onPrice: (value: string) => void;
}) {
  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceToggle}>
        <Text
          style={[
            styles.toggleLabel,
            { color: link ? COLORS.success : COLORS.textMuted },
          ]}
        >
          {link ? "Sim" : "Não"}
        </Text>
        <Switch
          value={link}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={link ? COLORS.primary : "#FFFFFF"}
        />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{service.name}</Text>
        <Text style={styles.serviceMeta}>
          {service.durationMinutes
            ? `${service.durationMinutes} minutos`
            : "Duração não informada"}
        </Text>
      </View>
      {link ? (
        <TextInput
          value={String(linked?.price ?? "")}
          onChangeText={onPrice}
          placeholder="R$ 0,00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          style={styles.priceInput}
        />
      ) : null}
    </View>
  );
}

function ProfessionalCard({
  professional,
  onPress,
}: {
  professional: Professional;
  onPress: () => void;
}) {
  const name = professional.user?.name ?? "Profissional sem nome";
  const linkedCount =
    professional.professionalServices?.filter((item) => item.active !== false)
      .length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.professionalCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.avatar}>
        {professional.user?.photoUrl ? (
          <Image
            source={{ uri: professional.user.photoUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.professionalInfo}>
        <Text style={styles.professionalName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.professionalEmail} numberOfLines={1}>
          {professional.user?.email ?? "E-mail não informado"}
        </Text>
        <View style={styles.professionalMetaRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  professional.active === false
                    ? COLORS.dangerLight
                    : COLORS.successLight,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    professional.active === false
                      ? COLORS.danger
                      : COLORS.success,
                },
              ]}
            >
              {professional.active === false ? "Inativo" : "Ativo"}
            </Text>
          </View>
          <Text style={styles.serviceCount}>{linkedCount} serviço(s)</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

export default function OwnerProfessionals() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  const [search, setSearch] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [serviceModalVisible, setServiceModalVisible] = React.useState(false);
  const [editing, setEditing] = React.useState<Professional | null>(null);
  const [form, setForm] = React.useState<ProfessionalForm>(emptyForm());
  const [serviceDraft, setServiceDraft] = React.useState<
    Record<string, { linked: boolean; price: string; id?: string }>
  >({});
  const [userLookup, setUserLookup] = React.useState<any | null>(null);
  const [lookupMessage, setLookupMessage] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const [serviceBranchId, setServiceBranchId] = React.useState("");

  React.useEffect(() => {
    authStorage.getSession().then((session) => {
      if (session?.companyId) setCompanyId(session.companyId);
    });
  }, []);

  const {
    data: professionals = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProfessionalsQuery();

  const { data: branches = [] } = useGetBranchesQuery(companyId, { skip: !companyId });
  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesRequestError,
    refetch: refetchServices,
  } = useGetServicesQuery(serviceBranchId, { skip: !serviceBranchId });
  const { data: professionalServices = [] } = useGetProfessionalServicesQuery();

  const [createProfessional, { isLoading: creating }] =
    useCreateProfessionalMutation();
  const [triggerFindUserByEmail, { isFetching: searchingUser }] =
    useLazyFindUserByEmailQuery();
  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [updateProfessional, { isLoading: updating }] =
    useUpdateProfessionalMutation();
  const [createBranch] = useCreateProfessionalBranchMutation();
  const [updateBranch] = useUpdateProfessionalBranchMutation();
  const [createProfessionalService] = useCreateProfessionalServiceMutation();
  const [updateProfessionalService] = useUpdateProfessionalServiceMutation();
  const [deleteProfessionalService] = useDeleteProfessionalServiceMutation();

  const filteredProfessionals = React.useMemo(
    () =>
      professionals.filter((professional) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        return [
          professional.user?.name,
          professional.user?.email,
          professional.user?.phone,
          professional.specialties,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      }),
    [professionals, search],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalVisible(true);
  }

  function openEdit(professional: Professional) {
    setEditing(professional);
    setForm({
      userId: professional.user?.id ?? "",
      mode: "existing",
      name: professional.user?.name ?? "",
      email: professional.user?.email ?? "",
      phone: professional.user?.phone ?? "",
      bio: professional.bio ?? "",
      specialties: professional.specialties ?? "",
      instagram: professional.instagram ?? "",
      website: professional.website ?? "",
      color: professional.color ?? "#B5548F",
      commissionPercentage: String(professional.commissionPercentage ?? "0"),
      active: professional.active !== false,
      branchIds: (professional.branches ?? [])
        .map((item) => item.branchId ?? item.branch?.id)
        .filter((id): id is string => Boolean(id)),
    });
    setModalVisible(true);
  }

  function openServices(professional: Professional) {
    setEditing(professional);

    const selectedBranchId =
      (professional.branches ?? [])
        .map((item) => item.branchId ?? item.branch?.id)
        .find((id): id is string => Boolean(id)) ??
      form.branchIds[0] ??
      "";

    setServiceBranchId(selectedBranchId);
    const draft: Record<
      string,
      { linked: boolean; price: string; id?: string }
    > = {};
    services.forEach((service) => {
      const relation =
        professional.professionalServices?.find(
          (item) => item.serviceId === service.id,
        ) ??
        professionalServices.find(
          (item) =>
            item.professional?.id === professional.id &&
            item.serviceId === service.id,
        );
      draft[service.id] = {
        linked: Boolean(relation && relation.active !== false),
        price: String(relation?.price ?? ""),
        id: relation?.id,
      };
    });
    setServiceDraft(draft);
    setServiceModalVisible(true);
  }

  async function searchExistingUser() {
    const email = form.email.trim().toLowerCase();
    if (!email) {
      Alert.alert("Campo obrigatório", "Informe o e-mail para buscar.");
      return;
    }

    try {
      const result = await triggerFindUserByEmail(email).unwrap();
      if (!result?.id) {
        setUserLookup(null);
        setForm((old) => ({ ...old, userId: "" }));
        setLookupMessage("Nenhum usuário encontrado com esse e-mail.");
        return;
      }

      setUserLookup(result);
      setForm((old) => ({
        ...old,
        userId: result.id,
        name: result.name ?? old.name,
        phone: result.phone ?? old.phone,
      }));
      setLookupMessage(
        "Usuário encontrado. O identificador será usado apenas internamente.",
      );
    } catch (error) {
      setUserLookup(null);
      setLookupMessage(getErrorMessage(error));
    }
  }

  async function saveProfessional() {
    if (!editing && !form.userId.trim() && form.mode === "existing") {
      Alert.alert(
        "Usuário não selecionado",
        "Busque um usuário existente pelo e-mail antes de continuar.",
      );
      return;
    }

    try {
      let professionalId = editing?.id;
      let userId = form.userId.trim();

      if (!editing && form.mode === "new") {
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
          Alert.alert(
            "Campos obrigatórios",
            "Informe nome, e-mail e telefone para criar o usuário.",
          );
          return;
        }

        const createdUser = await createUser({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
        }).unwrap();

        if (!createdUser?.id)
          throw new Error("A API não retornou o usuário criado.");
        userId = createdUser.id;
        setForm((old) => ({ ...old, userId }));
      }

      if (editing) {
        await updateProfessional({
          id: editing.id,
          body: {
            bio: form.bio,
            specialties: form.specialties,
            instagram: form.instagram,
            website: form.website,
            active: form.active,
          },
        }).unwrap();
      } else {
        const created = await createProfessional({ ...form, userId }).unwrap();
        professionalId = created.id;
      }

      if (!professionalId)
        throw new Error("Profissional não retornado pela API.");

      if (!form.branchIds.length) {
        throw new Error("Selecione pelo menos uma filial para o profissional.");
      }

      const commissionPercentage =
        Number(form.commissionPercentage.replace(",", ".")) || 0;

      for (const selectedBranchId of form.branchIds) {
        const existingBranch = editing?.branches?.find(
          (item) => (item.branchId ?? item.branch?.id) === selectedBranchId,
        );

        const branchPayload = {
          professionalId,
          branchId: selectedBranchId,
          color: form.color,
          commissionPercentage,
          active: form.active,
        };

        if (existingBranch?.id) {
          await updateBranch({ id: existingBranch.id, color: branchPayload.color, commissionPercentage: branchPayload.commissionPercentage, active: branchPayload.active }).unwrap();
        } else {
          await createBranch(branchPayload).unwrap();
        }
      }

      setModalVisible(false);
      await refetch();
      Alert.alert(
        "Sucesso",
        editing
          ? "Profissional atualizado."
          : "Profissional cadastrado. O e-mail de acesso com a senha temporária foi enviado ao profissional.",
      );
    } catch (error) {
      Alert.alert("Não foi possível salvar", getErrorMessage(error));
    }
  }

  async function saveServices() {
    if (!editing) return;

    try {
      for (const service of services) {
        const item = serviceDraft[service.id];
        if (!item) continue;

        const normalizedPrice = String(item.price || "")
          .replace(",", ".")
          .trim();
        const price = Number(normalizedPrice);

        if (
          item.linked &&
          (!normalizedPrice || !Number.isFinite(price) || price <= 0)
        ) {
          Alert.alert(
            "Preço obrigatório",
            `Informe um preço válido e maior que zero para o serviço "${service.name}".`,
          );
          return;
        }

        if (item.linked && item.id) {
          await updateProfessionalService({
            id: item.id,
            price,
            active: true,
          }).unwrap();
        } else if (item.linked && !item.id) {
          await createProfessionalService({
            professionalId: editing.id,
            serviceId: service.id,
            price,
            active: true,
          }).unwrap();
        } else if (!item.linked && item.id) {
          await deleteProfessionalService(item.id).unwrap();
        }
      }

      setServiceModalVisible(false);
      await refetch();
      Alert.alert("Sucesso", "Serviços do profissional atualizados.");
    } catch (error) {
      Alert.alert(
        "Não foi possível atualizar os serviços",
        getErrorMessage(error),
      );
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo da LUNARA"
            />
          </View>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.text} />
            {!isMobile && <Text style={styles.backText}>Voltar</Text>}
          </Pressable>
        </View>

        <View style={styles.heading}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>GESTÃO DA EQUIPE</Text>
            <Text style={styles.title}>Profissionais</Text>
            <Text style={styles.subtitle}>
              Cadastre profissionais, altere seus dados e defina os serviços que
              cada um pode realizar.
            </Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={openCreate}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            {!isMobile && (
              <Text style={styles.primaryButtonText}>Novo profissional</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome, e-mail ou especialidade..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
        </View>

        {isLoading || isFetching ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Carregando profissionais...</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={COLORS.danger}
            />
            <Text style={styles.emptyTitle}>
              Não foi possível carregar a equipe
            </Text>
            <Pressable style={styles.secondaryButton} onPress={refetch}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : filteredProfessionals.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name="people-outline"
              size={42}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>
              Nenhum profissional encontrado
            </Text>
            <Text style={styles.stateText}>
              Cadastre um profissional ou ajuste sua busca.
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.eyebrow}>EQUIPE</Text>
                <Text style={styles.sectionTitle}>
                  {filteredProfessionals.length} profissional(is)
                </Text>
              </View>
              <Ionicons
                name="people-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            {filteredProfessionals.map((professional) => (
              <View key={professional.id} style={styles.professionalItem}>
                <ProfessionalCard
                  professional={professional}
                  onPress={() => openEdit(professional)}
                />
                <Pressable
                  style={styles.servicesButton}
                  onPress={() => openServices(professional)}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.servicesButtonText}>
                    Definir serviços
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>
                  {editing ? "EDITAR PROFISSIONAL" : "NOVO PROFISSIONAL"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {editing ? "Dados do profissional" : "Cadastrar profissional"}
                </Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={19} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!editing && (
                <>
                  <View style={styles.modeToggle}>
                    <Pressable
                      style={[
                        styles.modeOption,
                        form.mode === "existing" && styles.modeOptionActive,
                      ]}
                      onPress={() =>
                        setForm((old) => ({
                          ...old,
                          mode: "existing",
                          userId: "",
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.modeOptionText,
                          form.mode === "existing" &&
                            styles.modeOptionTextActive,
                        ]}
                      >
                        Buscar existente
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.modeOption,
                        form.mode === "new" && styles.modeOptionActive,
                      ]}
                      onPress={() =>
                        setForm((old) => ({ ...old, mode: "new", userId: "" }))
                      }
                    >
                      <Text
                        style={[
                          styles.modeOptionText,
                          form.mode === "new" && styles.modeOptionTextActive,
                        ]}
                      >
                        Cadastrar novo
                      </Text>
                    </Pressable>
                  </View>

                  {form.mode === "existing" ? (
                    <>
                      <Field
                        label="E-mail do usuário *"
                        value={form.email}
                        onChangeText={(value) => {
                          setForm((old) => ({
                            ...old,
                            email: value,
                            userId: "",
                          }));
                          setUserLookup(null);
                          setLookupMessage("");
                        }}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                      />
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={searchExistingUser}
                        disabled={searchingUser}
                      >
                        {searchingUser ? (
                          <ActivityIndicator color={COLORS.primary} />
                        ) : (
                          <Ionicons
                            name="search-outline"
                            size={17}
                            color={COLORS.primary}
                          />
                        )}
                        <Text style={styles.secondaryButtonText}>
                          Buscar usuário
                        </Text>
                      </Pressable>
                      {userLookup ? (
                        <Text style={styles.lookupSuccess}>
                          Usuário selecionado:{" "}
                          {userLookup.name ?? userLookup.email}
                        </Text>
                      ) : null}
                      {lookupMessage ? (
                        <Text style={styles.lookupMessage}>
                          {lookupMessage}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Field
                        label="Nome completo *"
                        value={form.name}
                        onChangeText={(value) =>
                          setForm((old) => ({ ...old, name: value }))
                        }
                        placeholder="Nome do profissional"
                      />
                      <Field
                        label="E-mail *"
                        value={form.email}
                        onChangeText={(value) =>
                          setForm((old) => ({ ...old, email: value }))
                        }
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                      />
                      <Field
                        label="Telefone *"
                        value={form.phone}
                        onChangeText={(value) =>
                          setForm((old) => ({ ...old, phone: value }))
                        }
                        placeholder="(31) 99999-9999"
                        keyboardType="phone-pad"
                      />
                    </>
                  )}
                </>
              )}
              <Field
                label="Biografia"
                value={form.bio}
                onChangeText={(value) =>
                  setForm((old) => ({ ...old, bio: value }))
                }
                multiline
                placeholder="Apresentação do profissional"
              />
              <Field
                label="Especialidades"
                value={form.specialties}
                onChangeText={(value) =>
                  setForm((old) => ({ ...old, specialties: value }))
                }
                placeholder="Ex.: cabelo, unhas, estética"
              />
              <Field
                label="Instagram"
                value={form.instagram}
                onChangeText={(value) =>
                  setForm((old) => ({ ...old, instagram: value }))
                }
                placeholder="@usuario"
              />
              <Field
                label="Website"
                value={form.website}
                onChangeText={(value) =>
                  setForm((old) => ({ ...old, website: value }))
                }
                placeholder="https://"
              />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Filiais do profissional *</Text>
                <Text style={styles.helperText}>Selecione uma ou mais filiais onde este profissional poderá atender.</Text>
                {branches.map((branch) => {
                  const selected = form.branchIds.includes(branch.id);
                  return (
                    <Pressable key={branch.id} style={[styles.branchOption, selected && styles.branchOptionSelected]} onPress={() => setForm((old) => ({ ...old, branchIds: selected ? old.branchIds.filter((id) => id !== branch.id) : [...old.branchIds, branch.id] }))}>
                      <Ionicons name={selected ? "checkbox" : "square-outline"} size={20} color={selected ? COLORS.primary : COLORS.textMuted} />
                      <Text style={styles.branchOptionText}>{branch.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.colorField}>
                <Text style={styles.fieldLabel}>Cor na agenda</Text>
                <AgendaColorPicker
                  value={form.color}
                  onChange={(color) => setForm((old) => ({ ...old, color }))}
                />
              </View>
              <Field
                label="Comissão (%)"
                value={form.commissionPercentage}
                onChangeText={(value) =>
                  setForm((old) => ({ ...old, commissionPercentage: value }))
                }
                placeholder="0"
                keyboardType="numeric"
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Profissional ativo</Text>
                  <Text style={styles.switchSubtitle}>
                    Permitir que ele seja utilizado nos agendamentos.
                  </Text>
                </View>
                <Switch
                  value={form.active}
                  onValueChange={(value) =>
                    setForm((old) => ({ ...old, active: value }))
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primaryLight,
                  }}
                  thumbColor={form.active ? COLORS.primary : COLORS.textMuted}
                />
              </View>

              <Pressable
                style={[
                  styles.primaryButtonWide,
                  (creating || updating) && styles.disabled,
                ]}
                disabled={creating || updating}
                onPress={saveProfessional}
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
                  {editing ? "Salvar alterações" : "Cadastrar profissional"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={serviceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>SERVIÇOS AUTORIZADOS</Text>
                <Text style={styles.sheetTitle}>
                  {editing?.user?.name ?? "Profissional"}
                </Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => setServiceModalVisible(false)}
              >
                <Ionicons name="close" size={19} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            {!serviceBranchId ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="business-outline"
                  size={28}
                  color={COLORS.danger}
                />
                <Text style={styles.emptyStateText}>
                  Este profissional ainda não está vinculado a uma filial.
                  Selecione uma filial antes de cadastrar os serviços.
                </Text>
              </View>
            ) : servicesLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : servicesError ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={COLORS.danger}
                />
                <Text style={styles.emptyStateText}>
                  Não foi possível carregar os serviços. Verifique a filial
                  selecionada e tente novamente.
                </Text>
                <Text style={styles.errorDetails}>
                  {JSON.stringify(servicesRequestError ?? {})}
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => refetchServices()}
                >
                  <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetDescription}>
                  Selecione os serviços que este profissional pode executar e
                  defina o preço específico que será cobrado por este
                  profissional. O preço é obrigatório para serviços ativados.
                </Text>
                {services.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Nenhum serviço encontrado.
                    </Text>
                  </View>
                ) : null}
                {services.map((service) => {
                  const item = serviceDraft[service.id] ?? {
                    linked: false,
                    price: "",
                  };
                  const relation = editing?.professionalServices?.find(
                    (link) => link.serviceId === service.id,
                  );
                  return (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      linked={
                        relation
                          ? { ...relation, price: item.price }
                          : { id: item.id, price: item.price }
                      }
                      link={item.linked}
                      onToggle={() =>
                        setServiceDraft((old) => ({
                          ...old,
                          [service.id]: { ...item, linked: !item.linked },
                        }))
                      }
                      onPrice={(price) =>
                        setServiceDraft((old) => ({
                          ...old,
                          [service.id]: { ...item, price },
                        }))
                      }
                    />
                  );
                })}
                <Pressable
                  style={styles.primaryButtonWide}
                  onPress={saveServices}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>Salvar serviços</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  page: {
    padding: 22,
    paddingBottom: 50,
    maxWidth: 1440,
    width: "100%",
    alignSelf: "center",
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 100, height: 100 },
  backButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  backText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  heading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: "900" },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 650,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  primaryButtonWide: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 12,
  },
  searchBox: {
    minHeight: 48,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 12 },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "900" },
  professionalItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 12,
  },
  professionalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: COLORS.primaryDark, fontSize: 21, fontWeight: "900" },
  professionalInfo: { flex: 1, minWidth: 0, gap: 4 },
  professionalName: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  professionalEmail: { color: COLORS.textSecondary, fontSize: 10 },
  professionalMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 8, fontWeight: "900" },
  serviceCount: { color: COLORS.textMuted, fontSize: 10 },
  servicesButton: {
    alignSelf: "flex-start",
    marginLeft: 66,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  servicesButtonText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "900",
  },
  pressed: { opacity: 0.7 },
  centerState: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: { color: COLORS.textSecondary, fontSize: 11, textAlign: "center" },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: COLORS.text, fontSize: 11, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(34,30,43,0.45)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  sheetTitle: { color: COLORS.text, fontSize: 21, fontWeight: "900" },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  field: { marginBottom: 15 },
  fieldLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 12,
    backgroundColor: COLORS.background,
  },
  multilineInput: { minHeight: 88, paddingTop: 12, textAlignVertical: "top" },
  colorField: { marginBottom: 15 },
  colorPickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    padding: 14,
  },
  colorPickerPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  colorPickerPreview: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,30,43,0.12)",
  },
  colorPickerPreviewInfo: { flex: 1, gap: 3 },
  colorPickerPreviewTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  colorPickerHex: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  colorPickerHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: COLORS.text,
    transform: [{ scale: 1.12 }],
  },
  customColorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  customColorLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  customColorInput: {
    width: 105,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 9,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  branchOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.background },
  branchOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  branchOptionText: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: "800" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  switchTitle: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  switchSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },
  sheetDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 15,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 13,
  },
  serviceCheck: { width: 27, alignItems: "center" },
  serviceToggle: { alignItems: "center", justifyContent: "center", gap: 2 },
  toggleLabel: { fontSize: 9, fontWeight: "900" },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  modeOptionActive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeOptionText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800" },
  modeOptionTextActive: { color: COLORS.primary, fontWeight: "900" },
  lookupSuccess: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
  },
  lookupMessage: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 14,
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorDetails: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
  },
  secondaryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyStateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceTitle: { color: COLORS.text, fontSize: 12, fontWeight: "900" },
  serviceMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  priceInput: {
    width: 88,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    color: COLORS.text,
    fontSize: 11,
    textAlign: "right",
  },
  disabled: { opacity: 0.55 },
});
