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
  primaryDark: "#923E73",
  primaryLight: "#F9EAF2",
  accent: "#7967A8",
  accentLight: "#F0ECF8",
  background: "#F7F5F8",
  card: "#FFFFFF",
  text: "#28232D",
  textSecondary: "#746C78",
  textMuted: "#A79EAC",
  border: "#F0E8EE",
  success: "#3E8F64",
  successLight: "#E8F5ED",
  danger: "#C0416F",
  dangerLight: "#F9E9EF",
};
type ServiceBranch = {
  id: string;
  serviceId?: string;
  branchId?: string;
  price?: number | string | null;
  active?: boolean;
  branch?: { id?: string; name?: string };
};
type Service = {
  id: string;
  name: string;
  durationMinutes?: number;
  color?: string | null;
  active?: boolean;
  serviceBranchId?: string;
  branches?: ServiceBranch[];
};
type ProfessionalService = {
  id: string;
  serviceBranchId: string;
  price?: number | string | null;
  active?: boolean;
  service?: Service;
  professionalId?: string;
  professional?: { id?: string };
};
type Branch = { id: string; name: string; active?: boolean };
type Weekday =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";
type BranchWorkingHour = {
  id: string;
  branchId: string;
  weekday: Weekday;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  sortOrder?: number;
};
type ProfessionalWorkingHour = {
  id: string;
  professionalBranchId: string;
  weekday: Weekday;
  startTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  endTime: string;
  isWorking: boolean;
};
type ScheduleMode = "branch" | "custom";
type ScheduleDayDraft = {
  weekday: Weekday;
  label: string;
  mode: ScheduleMode;
  isWorking: boolean;
  startTime: string;
  breakStart: string;
  breakEnd: string;
  endTime: string;
  existingId?: string;
};
const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terça-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];
const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "18:00";
function extractTime(value?: string | null): string {
  if (!value) return "";
  const match = String(value).match(/(?:T|\s)(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  const direct = String(value).match(/^(\d{2}):(\d{2})/);
  return direct ? `${direct[1]}:${direct[2]}` : "";
}
function toApiTime(value: string): string {
  const normalized = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(normalized)
    ? normalized
    : normalized
      ? extractTime(normalized)
      : "";
}
function buildScheduleDraft(
  branchHours: BranchWorkingHour[],
  professionalHours: ProfessionalWorkingHour[],
): ScheduleDayDraft[] {
  return WEEKDAYS.map(({ value, label }) => {
    const branchDay = branchHours
      .filter((item) => item.weekday === value && item.isOpen)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
    const professionalDay = professionalHours.find(
      (item) => item.weekday === value,
    );
    const firstBranch = branchDay[0];
    const lastBranch = branchDay[branchDay.length - 1];
    if (professionalDay) {
      return {
        weekday: value,
        label,
        mode: "custom",
        isWorking: professionalDay.isWorking,
        startTime:
          extractTime(professionalDay.startTime) ||
          extractTime(firstBranch?.openTime) ||
          DEFAULT_START_TIME,
        breakStart: extractTime(professionalDay.breakStart),
        breakEnd: extractTime(professionalDay.breakEnd),
        endTime:
          extractTime(professionalDay.endTime) ||
          extractTime(lastBranch?.closeTime) ||
          DEFAULT_END_TIME,
        existingId: professionalDay.id,
      };
    }
    return {
      weekday: value,
      label,
      mode: "branch",
      isWorking: branchDay.length > 0,
      startTime: extractTime(firstBranch?.openTime) || DEFAULT_START_TIME,
      breakStart: "",
      breakEnd: "",
      endTime: extractTime(lastBranch?.closeTime) || DEFAULT_END_TIME,
    };
  });
}
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
  branches?: Array<{
    id?: string;
    branchId?: string;
    branch?: { id?: string; name?: string };
  }>;
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
  if (!response || typeof response !== "object") return []; // Aceita os formatos mais comuns da API:
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
  } // Fallback para respostas com mais um nível de aninhamento.
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
    getBranches: builder.query<Branch[], void>({
      query: () => ({
        url: "/branches",
        method: "GET",
      }),
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
      transformResponse: (response: any, _meta: any, branchId: string) => {
        const items = unwrap(response);
        return items
          .map((service: Service) => {
            const serviceBranch = (service.branches ?? []).find(
              (branch) =>
                branch.branchId === branchId || branch.branch?.id === branchId,
            );
            return {
              ...service,
              serviceBranchId: serviceBranch?.id,
              branches: serviceBranch ? [serviceBranch] : [],
            };
          })
          .filter((service) => Boolean(service.serviceBranchId));
      },
      providesTags: ["Company"],
    }),
    getProfessionalServices: builder.query<ProfessionalService[], void>({
      query: () => ({
        url: "/professional-services",
        method: "GET",
        params: { page: 1, limit: 100 },
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
        branchId: string;
        color: string;
        commissionPercentage: number;
        active: boolean;
      }
    >({
      query: (body) => ({
        url: "/professional-branches",
        method: "POST",
        headers: { "x-branch-id": body.branchId },
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    updateProfessionalBranch: builder.mutation<
      any,
      {
        id: string;
        branchId: string;
        color: string;
        commissionPercentage: number;
        active: boolean;
      }
    >({
      query: ({ id, branchId, ...body }) => ({
        url: `/professional-branches/${id}`,
        method: "PATCH",
        headers: { "x-branch-id": branchId },
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    deleteProfessionalBranch: builder.mutation<
      any,
      { id: string; branchId: string }
    >({
      query: ({ id, branchId }) => ({
        url: `/professional-branches/${id}`,
        method: "DELETE",
        headers: { "x-branch-id": branchId },
      }),
      invalidatesTags: ["Company"],
    }),
    createProfessionalService: builder.mutation<
      any,
      {
        professionalId: string;
        serviceBranchId: string;
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
    getBranchWorkingHours: builder.query<BranchWorkingHour[], string>({
      query: (branchId) => ({
        url: "/branch-working-hours",
        method: "GET",
        params: { branchId, page: 1, limit: 100 },
      }),
      transformResponse: (response: any) =>
        unwrap(response) as BranchWorkingHour[],
      providesTags: ["Company"],
    }),
    getProfessionalWorkingHours: builder.query<
      ProfessionalWorkingHour[],
      string
    >({
      query: (professionalBranchId) => ({
        url: "/professional-working-hours",
        method: "GET",
        params: {
          professionalBranchId,
          page: 1,
          limit: 100,
        },
      }),
      transformResponse: (response: any) =>
        unwrap(response) as ProfessionalWorkingHour[],
      providesTags: ["Company"],
    }),
    createProfessionalWorkingHour: builder.mutation<
      ProfessionalWorkingHour,
      {
        professionalBranchId: string;
        weekday: Weekday;
        startTime: string;
        breakStart?: string;
        breakEnd?: string;
        endTime: string;
        isWorking: boolean;
      }
    >({
      query: (body) => ({
        url: "/professional-working-hours",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    updateProfessionalWorkingHour: builder.mutation<
      ProfessionalWorkingHour,
      {
        id: string;
        professionalBranchId?: string;
        weekday?: Weekday;
        startTime?: string;
        breakStart?: string | null;
        breakEnd?: string | null;
        endTime?: string;
        isWorking?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/professional-working-hours/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    deleteProfessionalWorkingHour: builder.mutation<any, string>({
      query: (id) => ({
        url: `/professional-working-hours/${id}`,
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
  useDeleteProfessionalBranchMutation,
  useCreateProfessionalServiceMutation,
  useUpdateProfessionalServiceMutation,
  useDeleteProfessionalServiceMutation,
  useGetBranchWorkingHoursQuery,
  useGetProfessionalWorkingHoursQuery,
  useCreateProfessionalWorkingHourMutation,
  useUpdateProfessionalWorkingHourMutation,
  useDeleteProfessionalWorkingHourMutation,
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
    Record<
      string,
      { linked: boolean; price: string; id?: string; serviceBranchId?: string }
    >
  >({});
  const [userLookup, setUserLookup] = React.useState<any | null>(null);
  const [lookupMessage, setLookupMessage] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const [serviceBranchId, setServiceBranchId] = React.useState("");
  const [scheduleBranchId, setScheduleBranchId] = React.useState("");
  const [scheduleDrafts, setScheduleDrafts] = React.useState<
    Record<string, ScheduleDayDraft[]>
  >({});
  const [scheduleSaving, setScheduleSaving] = React.useState(false);
  const scheduleProfessionalBranchId = React.useMemo(() => {
    if (!editing || !scheduleBranchId) return "";
    return (
      (editing.branches ?? []).find(
        (item) => (item.branchId ?? item.branch?.id) === scheduleBranchId,
      )?.id ?? ""
    );
  }, [editing, scheduleBranchId]);
  const {
    data: branchWorkingHours = [],
    isLoading: branchWorkingHoursLoading,
  } = useGetBranchWorkingHoursQuery(scheduleBranchId, {
    skip: !scheduleBranchId,
  });
  const {
    data: professionalWorkingHours = [],
    isLoading: professionalWorkingHoursLoading,
  } = useGetProfessionalWorkingHoursQuery(scheduleProfessionalBranchId, {
    skip: !scheduleProfessionalBranchId,
  });
  const [createProfessionalWorkingHour] =
    useCreateProfessionalWorkingHourMutation();
  const [updateProfessionalWorkingHour] =
    useUpdateProfessionalWorkingHourMutation();
  const [deleteProfessionalWorkingHour] =
    useDeleteProfessionalWorkingHourMutation();
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
  const { data: branches = [] } = useGetBranchesQuery();
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
  const [deleteBranch] = useDeleteProfessionalBranchMutation();
  const [createProfessionalService] = useCreateProfessionalServiceMutation();
  const [updateProfessionalService] = useUpdateProfessionalServiceMutation();
  const [deleteProfessionalService] = useDeleteProfessionalServiceMutation();
  React.useEffect(() => {
    if (!form.branchIds.length) {
      setScheduleBranchId("");
      return;
    }
    if (!scheduleBranchId || !form.branchIds.includes(scheduleBranchId)) {
      setScheduleBranchId(form.branchIds[0]);
    }
  }, [form.branchIds, scheduleBranchId]);
  React.useEffect(() => {
    if (!scheduleBranchId) return;
    if (branchWorkingHoursLoading || professionalWorkingHoursLoading) return;
    setScheduleDrafts((current) => {
      if (current[scheduleBranchId]) return current;
      return {
        ...current,
        [scheduleBranchId]: buildScheduleDraft(
          branchWorkingHours,
          professionalWorkingHours,
        ),
      };
    });
  }, [
    scheduleBranchId,
    branchWorkingHours,
    professionalWorkingHours,
    branchWorkingHoursLoading,
    professionalWorkingHoursLoading,
  ]);
  function resetScheduleDrafts() {
    setScheduleDrafts({});
    setScheduleBranchId("");
  }
  function updateScheduleDay(
    weekday: Weekday,
    patch: Partial<ScheduleDayDraft>,
  ) {
    if (!scheduleBranchId) return;
    setScheduleDrafts((current) => ({
      ...current,
      [scheduleBranchId]: (current[scheduleBranchId] ?? []).map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    }));
  }
  function getBranchPeriodsLabel(weekday: Weekday) {
    const periods = branchWorkingHours
      .filter((item) => item.weekday === weekday && item.isOpen)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
    if (!periods.length) return "Filial fechada";
    return periods
      .map(
        (period) =>
          `${extractTime(period.openTime)}–${extractTime(period.closeTime)}`,
      )
      .join(" • ");
  }
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
    resetScheduleDrafts();
    setForm(emptyForm());
    setModalVisible(true);
  }
  function openEdit(professional: Professional) {
    setEditing(professional);
    resetScheduleDrafts();
    const initialBranchIds = (professional.branches ?? [])
      .map((item) => item.branchId ?? item.branch?.id)
      .filter((id): id is string => Boolean(id));
    setScheduleBranchId(initialBranchIds[0] ?? "");
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
      branchIds: initialBranchIds,
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
      { linked: boolean; price: string; id?: string; serviceBranchId?: string }
    > = {};
    services.forEach((service) => {
      const serviceBranchId = service.serviceBranchId;
      const relation =
        professional.professionalServices?.find(
          (item) => item.serviceBranchId === serviceBranchId,
        ) ??
        professionalServices.find(
          (item) =>
            item.professional?.id === professional.id &&
            item.serviceBranchId === serviceBranchId,
        );
      draft[service.id] = {
        linked: Boolean(relation && relation.active !== false),
        price: String(relation?.price ?? ""),
        id: relation?.id,
        serviceBranchId,
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
  async function saveWorkingHours(
    professionalBranchIdsByBranchId: Record<string, string>,
  ) {
    for (const branchId of form.branchIds) {
      const professionalBranchId = professionalBranchIdsByBranchId[branchId];
      const draft = scheduleDrafts[branchId];
      if (!professionalBranchId || !draft) continue;
      for (const day of draft) {
        if (day.mode === "branch") {
          if (day.existingId) {
            await deleteProfessionalWorkingHour(day.existingId).unwrap();
          }
          continue;
        }
        const startTime = toApiTime(day.startTime) || DEFAULT_START_TIME;
        const endTime = toApiTime(day.endTime) || DEFAULT_END_TIME;
        const payload = {
          professionalBranchId,
          weekday: day.weekday,
          startTime,
          endTime,
          isWorking: day.isWorking,
          ...(day.breakStart && day.breakEnd
            ? {
                breakStart: toApiTime(day.breakStart),
                breakEnd: toApiTime(day.breakEnd),
              }
            : {}),
        };
        if (day.existingId) {
          await updateProfessionalWorkingHour({
            id: day.existingId,
            professionalBranchId,
            weekday: day.weekday,
            startTime,
            endTime,
            breakStart:
              day.breakStart && day.breakEnd ? toApiTime(day.breakStart) : null,
            breakEnd:
              day.breakStart && day.breakEnd ? toApiTime(day.breakEnd) : null,
            isWorking: day.isWorking,
          }).unwrap();
        } else {
          await createProfessionalWorkingHour(payload).unwrap();
        }
      }
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
    if (!form.branchIds.length) {
      Alert.alert(
        "Filial obrigatória",
        "Selecione pelo menos uma filial para o profissional.",
      );
      return;
    }
    try {
      setScheduleSaving(true);
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
        if (!createdUser?.id) {
          throw new Error("A API não retornou o usuário criado.");
        }
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
      if (!professionalId) {
        throw new Error("Profissional não retornado pela API.");
      }
      const commissionPercentage =
        Number(form.commissionPercentage.replace(",", ".")) || 0;
      const currentBranches = editing?.branches ?? [];
      const selectedBranchIds = new Set(form.branchIds);
      const professionalBranchIdsByBranchId: Record<string, string> = {};
      for (const currentBranch of currentBranches) {
        const currentBranchId =
          currentBranch.branchId ?? currentBranch.branch?.id;
        if (!currentBranch.id || !currentBranchId) continue;
        if (!selectedBranchIds.has(currentBranchId)) {
          await deleteBranch({
            id: currentBranch.id,
            branchId: currentBranchId,
          }).unwrap();
        } else {
          professionalBranchIdsByBranchId[currentBranchId] = currentBranch.id;
        }
      }
      for (const selectedBranchId of form.branchIds) {
        const existingBranch = currentBranches.find(
          (item) =>
            (item.branchId ?? item.branch?.id) === selectedBranchId &&
            Boolean(item.id),
        );
        const branchPayload = {
          professionalId,
          branchId: selectedBranchId,
          color: form.color,
          commissionPercentage,
          active: form.active,
        };
        if (existingBranch?.id) {
          const updatedBranch = await updateBranch({
            id: existingBranch.id,
            branchId: selectedBranchId,
            color: branchPayload.color,
            commissionPercentage: branchPayload.commissionPercentage,
            active: branchPayload.active,
          }).unwrap();
          professionalBranchIdsByBranchId[selectedBranchId] =
            updatedBranch?.id ?? existingBranch.id;
        } else {
          const createdBranch = await createBranch(branchPayload).unwrap();
          if (!createdBranch?.id) {
            throw new Error(
              `A API não retornou o vínculo profissional-filial da filial ${selectedBranchId}.`,
            );
          }
          professionalBranchIdsByBranchId[selectedBranchId] = createdBranch.id;
        }
      }
      await saveWorkingHours(professionalBranchIdsByBranchId);
      setModalVisible(false);
      resetScheduleDrafts();
      await refetch();
      Alert.alert(
        "Sucesso",
        editing
          ? "Profissional atualizado, filiais e horários salvos."
          : "Profissional cadastrado. O e-mail de acesso com a senha temporária foi enviado ao profissional.",
      );
    } catch (error) {
      console.error("[saveProfessional]", error);
      Alert.alert("Não foi possível salvar", getErrorMessage(error));
    } finally {
      setScheduleSaving(false);
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
          const selectedBranchId = serviceBranchId;
          const resolvedServiceBranchId =
            item.serviceBranchId ??
            service.serviceBranchId ??
            service.branches?.find(
              (branch) =>
                branch.branchId === selectedBranchId ||
                branch.branch?.id === selectedBranchId,
            )?.id;
          if (!resolvedServiceBranchId) {
            Alert.alert(
              "Serviço indisponível",
              `Não foi possível identificar o vínculo do serviço "${service.name}" com a filial selecionada.`,
            );
            return;
          }
          await createProfessionalService({
            professionalId: editing.id,
            serviceBranchId: resolvedServiceBranchId,
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
        contentContainerStyle={[styles.page, isMobile && styles.pageMobile]}
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
        <View style={[styles.heading, isMobile && styles.headingMobile]}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>GESTÃO DA EQUIPE</Text>
            <Text style={styles.title}>Profissionais</Text>
            <Text style={styles.subtitle}>
              Cadastre profissionais, altere seus dados e defina os serviços que cada um pode realizar.
            </Text>
          </View>
          <Pressable style={[styles.primaryButton, isMobile && styles.primaryButtonMobile]} onPress={openCreate}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Novo profissional</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={24} color={COLORS.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome, e-mail ou especialidade..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.eyebrow}>EQUIPE</Text>
              <Text style={styles.sectionTitle}>
                {filteredProfessionals.length} profissional(is)
              </Text>
            </View>
            <View style={styles.teamIcon}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
          </View>

          {isLoading || isFetching ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateText}>Carregando profissionais...</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle-outline" size={40} color={COLORS.danger} />
              <Text style={styles.emptyTitle}>Não foi possível carregar a equipe</Text>
              <Pressable style={styles.secondaryButton} onPress={refetch}>
                <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : filteredProfessionals.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
              <Text style={styles.stateText}>Cadastre um profissional ou ajuste sua busca.</Text>
              {!search && (
                <Pressable style={styles.secondaryButton} onPress={openCreate}>
                  <Ionicons name="add" size={17} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Novo profissional</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.table}>
              {!isMobile && (
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeading, styles.personColumn]}>PROFISSIONAL</Text>
                  <Text style={[styles.tableHeading, styles.statusColumn]}>STATUS</Text>
                  <Text style={[styles.tableHeading, styles.servicesColumn]}>SERVIÇOS</Text>
                  <Text style={[styles.tableHeading, styles.actionsColumn]}>AÇÕES</Text>
                </View>
              )}
              {filteredProfessionals.map((professional) => {
                const name = professional.user?.name ?? "Profissional sem nome";
                const linkedCount =
                  professional.professionalServices?.filter((item) => item.active !== false).length ?? 0;
                const active = professional.active !== false;
                return (
                  <View key={professional.id} style={[styles.tableRow, isMobile && styles.tableRowMobile]}>
                    <Pressable
                      style={[styles.personColumn, styles.personCell]}
                      onPress={() => openEdit(professional)}
                    >
                      <View style={styles.avatar}>
                        {professional.user?.photoUrl ? (
                          <Image source={{ uri: professional.user.photoUrl }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={styles.professionalInfo}>
                        <Text style={styles.professionalName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.professionalEmail} numberOfLines={1}>
                          {professional.user?.email ?? "E-mail não informado"}
                        </Text>
                      </View>
                      {isMobile && <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />}
                    </Pressable>
                    <View style={[styles.statusColumn, isMobile && styles.mobileTableCell]}>
                      {isMobile && <Text style={styles.mobileFieldLabel}>STATUS</Text>}
                      <View style={[styles.statusBadge, active ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                        <View style={[styles.statusDot, { backgroundColor: active ? COLORS.success : COLORS.danger }]} />
                        <Text style={[styles.statusText, { color: active ? COLORS.success : COLORS.danger }]}>
                          {active ? "Ativo" : "Inativo"}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.servicesColumn, isMobile && styles.mobileTableCell]}>
                      {isMobile && <Text style={styles.mobileFieldLabel}>SERVIÇOS</Text>}
                      <View style={styles.serviceCountWrap}>
                        <Ionicons name="list-outline" size={21} color={COLORS.textSecondary} />
                        <Text style={styles.serviceCount}>{linkedCount} serviço(s)</Text>
                      </View>
                    </View>
                    <View style={[styles.actionsColumn, styles.actionCell]}>
                      {isMobile && <Text style={styles.mobileFieldLabel}>AÇÕES</Text>}
                      <Pressable
                        style={styles.servicesButton}
                        onPress={() => openServices(professional)}
                      >
                        <Ionicons name="sparkles-outline" size={17} color={COLORS.primary} />
                        <Text style={styles.servicesButtonText}>Definir serviços</Text>
                      </Pressable>
                      {!isMobile && (
                        <Pressable style={styles.rowChevron} onPress={() => openEdit(professional)} hitSlop={8}>
                          <Ionicons name="chevron-forward" size={21} color={COLORS.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
                          Usuário selecionado:
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
                <Text style={styles.helperText}>
                  Selecione uma ou mais filiais onde este profissional poderá
                  atender.
                </Text>
                {branches.map((branch) => {
                  const selected = form.branchIds.includes(branch.id);
                  return (
                    <Pressable
                      key={branch.id}
                      style={[
                        styles.branchOption,
                        selected && styles.branchOptionSelected,
                      ]}
                      onPress={() =>
                        setForm((old) => ({
                          ...old,
                          branchIds: selected
                            ? old.branchIds.filter((id) => id !== branch.id)
                            : [...old.branchIds, branch.id],
                        }))
                      }
                    >
                      <Ionicons
                        name={selected ? "checkbox" : "square-outline"}
                        size={20}
                        color={selected ? COLORS.primary : COLORS.textMuted}
                      />
                      <Text style={styles.branchOptionText}>{branch.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.scheduleSection}>
                <Text style={styles.fieldLabel}>Horário de trabalho</Text>
                <Text style={styles.helperText}>
                  Por padrão, o profissional segue o horário da filial. Ative
                  "Horário personalizado" somente quando ele tiver uma escala
                  diferente.
                </Text>
                {form.branchIds.length > 1 ? (
                  <View style={styles.scheduleBranchTabs}>
                    {form.branchIds.map((branchId) => {
                      const branch = branches.find(
                        (item) => item.id === branchId,
                      );
                      const selected = scheduleBranchId === branchId;
                      return (
                        <Pressable
                          key={branchId}
                          style={[
                            styles.scheduleBranchTab,
                            selected && styles.scheduleBranchTabSelected,
                          ]}
                          onPress={() => setScheduleBranchId(branchId)}
                        >
                          <Ionicons
                            name="business-outline"
                            size={15}
                            color={selected ? COLORS.primary : COLORS.textMuted}
                          />
                          <Text
                            style={[
                              styles.scheduleBranchTabText,
                              selected && styles.scheduleBranchTabTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {branch?.name ?? "Filial"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
                {!scheduleBranchId ? (
                  <View style={styles.scheduleEmpty}>
                    <Text style={styles.scheduleEmptyText}>
                      Selecione uma filial para configurar o horário.
                    </Text>
                  </View>
                ) : branchWorkingHoursLoading ||
                  (editing && professionalWorkingHoursLoading) ? (
                  <View style={styles.scheduleLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.scheduleLoadingText}>
                      Carregando horários...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.scheduleDays}>
                    {(scheduleDrafts[scheduleBranchId] ?? []).map((day) => {
                      const followsBranch = day.mode === "branch";
                      return (
                        <View key={day.weekday} style={styles.scheduleDayCard}>
                          <View style={styles.scheduleDayHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.scheduleDayTitle}>
                                {day.label}
                              </Text>
                              <Text style={styles.scheduleBranchSummary}>
                                Filial: {getBranchPeriodsLabel(day.weekday)}
                              </Text>
                            </View>
                            <View style={styles.scheduleFollowRow}>
                              <Text
                                style={[
                                  styles.scheduleFollowLabel,
                                  {
                                    color: followsBranch
                                      ? COLORS.success
                                      : COLORS.textMuted,
                                  },
                                ]}
                              >
                                {followsBranch
                                  ? "Segue filial"
                                  : "Personalizado"}
                              </Text>
                              <Switch
                                value={followsBranch}
                                onValueChange={(value) => {
                                  if (value) {
                                    updateScheduleDay(day.weekday, {
                                      mode: "branch",
                                    });
                                  } else {
                                    updateScheduleDay(day.weekday, {
                                      mode: "custom",
                                      isWorking: day.isWorking,
                                    });
                                  }
                                }}
                                trackColor={{
                                  false: COLORS.border,
                                  true: COLORS.primaryLight,
                                }}
                                thumbColor={
                                  followsBranch
                                    ? COLORS.primary
                                    : COLORS.textMuted
                                }
                              />
                            </View>
                          </View>
                          {!followsBranch ? (
                            <View style={styles.scheduleCustomArea}>
                              <View style={styles.scheduleWorkRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.scheduleInputLabel}>
                                    Dia de trabalho
                                  </Text>
                                  <Text style={styles.scheduleInputHint}>
                                    Desative para marcar folga neste dia.
                                  </Text>
                                </View>
                                <Switch
                                  value={day.isWorking}
                                  onValueChange={(value) =>
                                    updateScheduleDay(day.weekday, {
                                      isWorking: value,
                                    })
                                  }
                                  trackColor={{
                                    false: COLORS.border,
                                    true: COLORS.primaryLight,
                                  }}
                                  thumbColor={
                                    day.isWorking
                                      ? COLORS.primary
                                      : COLORS.textMuted
                                  }
                                />
                              </View>
                              {day.isWorking ? (
                                <>
                                  <View style={styles.scheduleTimeGrid}>
                                    <View style={styles.scheduleTimeField}>
                                      <Text style={styles.scheduleInputLabel}>
                                        Entrada
                                      </Text>
                                      <TextInput
                                        value={day.startTime}
                                        onChangeText={(value) =>
                                          updateScheduleDay(day.weekday, {
                                            startTime: value,
                                          })
                                        }
                                        placeholder="08:00"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="default"
                                        style={styles.scheduleTimeInput}
                                        maxLength={5}
                                      />
                                    </View>
                                    <View style={styles.scheduleTimeField}>
                                      <Text style={styles.scheduleInputLabel}>
                                        Saída
                                      </Text>
                                      <TextInput
                                        value={day.endTime}
                                        onChangeText={(value) =>
                                          updateScheduleDay(day.weekday, {
                                            endTime: value,
                                          })
                                        }
                                        placeholder="18:00"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="default"
                                        style={styles.scheduleTimeInput}
                                        maxLength={5}
                                      />
                                    </View>
                                  </View>
                                  <View style={styles.scheduleTimeGrid}>
                                    <View style={styles.scheduleTimeField}>
                                      <Text style={styles.scheduleInputLabel}>
                                        Início do intervalo
                                      </Text>
                                      <TextInput
                                        value={day.breakStart}
                                        onChangeText={(value) =>
                                          updateScheduleDay(day.weekday, {
                                            breakStart: value,
                                          })
                                        }
                                        placeholder="12:00"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="default"
                                        style={styles.scheduleTimeInput}
                                        maxLength={5}
                                      />
                                    </View>
                                    <View style={styles.scheduleTimeField}>
                                      <Text style={styles.scheduleInputLabel}>
                                        Fim do intervalo
                                      </Text>
                                      <TextInput
                                        value={day.breakEnd}
                                        onChangeText={(value) =>
                                          updateScheduleDay(day.weekday, {
                                            breakEnd: value,
                                          })
                                        }
                                        placeholder="13:00"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="default"
                                        style={styles.scheduleTimeInput}
                                        maxLength={5}
                                      />
                                    </View>
                                  </View>
                                </>
                              ) : (
                                <View style={styles.scheduleOffBadge}>
                                  <Ionicons
                                    name="moon-outline"
                                    size={15}
                                    color={COLORS.textMuted}
                                  />
                                  <Text style={styles.scheduleOffText}>
                                    Folga do profissional
                                  </Text>
                                </View>
                              )}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
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
                  <Text style={styles.secondaryButtonText}>
                    Tentar novamente
                  </Text>
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
                    (link) => link.serviceBranchId === service.serviceBranchId,
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
  root: { flex: 1, backgroundColor: "#FBF8FA" },
  page: {
    paddingHorizontal: 38, paddingTop: 20, paddingBottom: 42,
    maxWidth: 1680, width: "100%", alignSelf: "center",
  },
  pageMobile: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  topbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 4, paddingBottom: 17, marginBottom: 30,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 220, height: 72 },
  backButton: {
    minHeight: 52, paddingHorizontal: 20, borderRadius: 15,
    borderWidth: 1, borderColor: "#EADCE6", backgroundColor: COLORS.card,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  backText: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  heading: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: 24, marginBottom: 34, paddingHorizontal: 34, paddingVertical: 30,
    minHeight: 198, borderRadius: 22, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: "#EDE2EA",
  },
  eyebrow: { color: COLORS.primary, fontSize: 13, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
  title: { color: COLORS.text, fontSize: 40, fontWeight: "900", letterSpacing: -1.2 },
  subtitle: { color: "#81788A", fontSize: 17, lineHeight: 26, marginTop: 10, maxWidth: 850 },
  primaryButton: {
    backgroundColor: COLORS.primary, minHeight: 64, paddingHorizontal: 25,
    borderRadius: 15, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 12,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
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
    minHeight: 76, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: "#EDE2EA", borderRadius: 17, paddingHorizontal: 25,
    flexDirection: "row", alignItems: "center", gap: 18, marginBottom: 32,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 16 },
  listCard: {
    backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1,
    borderColor: "#EDE2EA", padding: 34,
  },
  listHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 22, paddingBottom: 0,
  },
  sectionTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.7 },
  professionalItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 14 },
  professionalCard: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 4 },
  avatar: {
    width: 76, height: 76, borderRadius: 40, backgroundColor: "#F8E6F0",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: COLORS.primary, fontSize: 28, fontWeight: "900" },
  professionalInfo: { flex: 1, minWidth: 0, gap: 7 },
  professionalName: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  professionalEmail: { color: COLORS.textSecondary, fontSize: 14 },
  professionalMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 17, paddingVertical: 10, borderRadius: 99 },
  statusText: { fontSize: 13, fontWeight: "900" },
  serviceCount: { color: COLORS.textSecondary, fontSize: 14 },
  servicesButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    backgroundColor: COLORS.primaryLight, borderRadius: 14, paddingHorizontal: 19,
    paddingVertical: 16,
  },
  servicesButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: "900" },
  headingCopy: { flex: 1, minWidth: 0 },
  headingMobile: { flexDirection: "column", alignItems: "stretch", paddingHorizontal: 22, paddingVertical: 23, gap: 20 },
  primaryButtonMobile: { alignSelf: "stretch", minHeight: 54 },
  teamIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  table: { borderWidth: 1, borderColor: "#EDE2EA", borderRadius: 16, overflow: "hidden" },
  tableHeader: { minHeight: 55, flexDirection: "row", alignItems: "center", backgroundColor: "#F8F5F8", paddingHorizontal: 24 },
  tableHeading: { color: "#93899A", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  personColumn: { flex: 3.2, minWidth: 0 },
  statusColumn: { flex: 1.2, minWidth: 110 },
  servicesColumn: { flex: 1.35, minWidth: 130 },
  actionsColumn: { flex: 1.55, minWidth: 210 },
  tableRow: { minHeight: 120, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 17, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  tableRowMobile: { flexDirection: "column", alignItems: "stretch", paddingHorizontal: 16, paddingVertical: 17, gap: 15 },
  personCell: { flexDirection: "row", alignItems: "center", gap: 20, paddingVertical: 4 },
  statusBadgeActive: { backgroundColor: COLORS.successLight },
  statusBadgeInactive: { backgroundColor: COLORS.dangerLight },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  serviceCountWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionCell: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowChevron: { paddingHorizontal: 5, paddingVertical: 8 },
  mobileTableCell: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  mobileFieldLabel: { color: "#93899A", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.72 },
  centerState: { minHeight: 230, alignItems: "center", justifyContent: "center", gap: 12, padding: 22 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  stateText: { color: COLORS.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryButtonText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: "900" },
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
  scheduleSection: {
    marginBottom: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  scheduleBranchTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  scheduleBranchTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  scheduleBranchTabSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  scheduleBranchTabText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    flexShrink: 1,
  },
  scheduleBranchTabTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: "900",
  },
  scheduleDays: {
    gap: 9,
  },
  scheduleDayCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.card,
    padding: 12,
  },
  scheduleDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleDayTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  scheduleBranchSummary: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  scheduleFollowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  scheduleFollowLabel: {
    fontSize: 8,
    fontWeight: "900",
  },
  scheduleCustomArea: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scheduleWorkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  scheduleInputLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 5,
  },
  scheduleInputHint: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  scheduleTimeGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  scheduleTimeField: {
    flex: 1,
  },
  scheduleTimeInput: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 11,
    backgroundColor: COLORS.background,
  },
  scheduleOffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  scheduleOffText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  scheduleEmpty: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  scheduleEmptyText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  scheduleLoading: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  scheduleLoadingText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
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
  branchOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  branchOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  branchOptionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
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
