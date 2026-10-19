import React from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Stack, useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";

import { baseApi } from "@/core/api/baseApi";

const COLORS = {
  primary: "#B5548F",

  primaryDark: "#9A4179",

  primaryLight: "#FBEEF5",

  background: "#FAF8FB",

  card: "#FFFFFF",

  text: "#221E2B",

  secondary: "#6C6472",

  muted: "#A79EAC",

  border: "#F0E8EE",

  success: "#3E8F64",

  danger: "#C0416F",
};

type CompanyProfile = {
  id: string;

  corporateName?: string | null;

  tradeName?: string | null;

  slug?: string | null;

  email?: string | null;

  phone?: string | null;

  logoUrl?: string | null;
};

type ProfileForm = {
  name: string;

  email: string;

  phone: string;

  logoUrl: string;
};

type UploadLogoResponse = {
  company?: CompanyProfile;

  logoUrl?: string;
};

const companyProfileApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getMyCompanyProfile: builder.query<{ company: CompanyProfile }, void>({
      query: () => ({ url: "/companies/me", method: "GET" }),

      transformResponse: (response: any) => response?.data ?? response,

      providesTags: ["Company"],
    }),

    updateMyCompanyProfile: builder.mutation<
      CompanyProfile,
      Partial<ProfileForm>
    >({
      query: (body) => ({
        url: "/companies/me",

        method: "PATCH",

        body,
      }),

      transformResponse: (response: any) => response?.data ?? response,

      invalidatesTags: ["Company"],
    }),

    uploadMyCompanyLogo: builder.mutation<UploadLogoResponse, FormData>({
      query: (body) => ({
        url: "/companies/me/logo",

        method: "POST",

        body,
      }),

      transformResponse: (response: any) => response?.data ?? response,

      invalidatesTags: ["Company"],
    }),
  }),
});

const {
  useGetMyCompanyProfileQuery,

  useUpdateMyCompanyProfileMutation,

  useUploadMyCompanyLogoMutation,
} = companyProfileApi;

function Field({
  label,

  value,

  onChangeText,

  placeholder,

  keyboardType,

  autoCapitalize = "sentences",

  helper,
}: {
  label: string;

  value: string;

  onChangeText: (value: string) => void;

  placeholder?: string;

  keyboardType?: "default" | "email-address" | "phone-pad" | "url";

  autoCapitalize?: "none" | "sentences" | "words" | "characters";

  helper?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}

        onChangeText={onChangeText}

        placeholder={placeholder}

        placeholderTextColor={COLORS.muted}

        keyboardType={keyboardType ?? "default"}

        autoCapitalize={autoCapitalize}

        autoCorrect={false}

        style={styles.input}
      />

      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

export default function CompanyProfileScreen() {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useGetMyCompanyProfileQuery();

  const [updateProfile, { isLoading: isSaving }] =
    useUpdateMyCompanyProfileMutation();

  const [uploadLogo, { isLoading: isUploadingLogo }] =
    useUploadMyCompanyLogoMutation();

  const [selectedLogoUri, setSelectedLogoUri] = React.useState<string | null>(
    null,
  );

  const company = data?.company;

  const [name, setName] = React.useState("");

  const [email, setEmail] = React.useState("");

  const [phone, setPhone] = React.useState("");

  const [logoUrl, setLogoUrl] = React.useState("");

  const [initializedCompanyId, setInitializedCompanyId] = React.useState("");

  React.useEffect(() => {
    if (!company || initializedCompanyId === company.id) return;

    setName(company.tradeName ?? company.corporateName ?? "");

    setEmail(company.email ?? "");

    setPhone(company.phone ?? "");

    setLogoUrl(company.logoUrl ?? "");

    setInitializedCompanyId(company.id);
  }, [company, initializedCompanyId]);

  async function handleChooseLogo() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",

          "Permita o acesso às fotos para selecionar a imagem do estabelecimento.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      const mimeType = asset.mimeType ?? "image/jpeg";

      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
        Alert.alert(
          "Formato não suportado",

          "Escolha uma imagem JPG, PNG ou WebP.",
        );

        return;
      }

      setSelectedLogoUri(asset.uri);

      const formData = new FormData();
      const fileName = asset.fileName ?? `company-logo-${Date.now()}.jpg`;

      if (Platform.OS === "web") {
        // No navegador, converte a URI em um Blob real.
        const imageResponse = await fetch(asset.uri);

        if (!imageResponse.ok) {
          throw new Error("Não foi possível ler a imagem selecionada.");
        }

        const blob = await imageResponse.blob();

        formData.append("file", blob, fileName);
      } else {
        // Android e iOS: formato de arquivo do React Native.
        formData.append("file", {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      const response = await uploadLogo(formData).unwrap();
      const uploadedUrl = response?.logoUrl ?? response?.company?.logoUrl;

      if (!uploadedUrl) {
        throw new Error("O servidor não retornou a URL da imagem enviada.");
      }

      setLogoUrl(uploadedUrl);
      setSelectedLogoUri(null);
      await refetch();

      Alert.alert(
        "Imagem salva",
        "A imagem foi enviada e vinculada ao perfil da empresa.",
      );
    } catch (error: any) {
      setSelectedLogoUri(null);

      const message =
        error?.data?.message ??
        error?.message ??
        "Não foi possível enviar a imagem. Tente novamente.";

      Alert.alert(
        "Erro no upload",

        Array.isArray(message) ? message.join("\n") : message,
      );
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      Alert.alert(
        "Verifique o nome",

        "O nome deve ter pelo menos 3 caracteres.",
      );

      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("E-mail inválido", "Informe um endereço de e-mail válido.");

      return;
    }

    if (phone.trim() && (phone.trim().length < 8 || phone.trim().length > 25)) {
      Alert.alert(
        "Telefone inválido",

        "Informe um telefone entre 8 e 25 caracteres.",
      );

      return;
    }

    try {
      await updateProfile({
        name: trimmedName,

        email: email.trim() || undefined,

        phone: phone.trim() || undefined,

        logoUrl: logoUrl.trim(),
      }).unwrap();

      Alert.alert("Perfil atualizado", "Os dados da empresa foram salvos.");

      refetch();
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.data?.error ??
        "Não foi possível salvar os dados. Tente novamente.";

      Alert.alert(
        "Erro ao salvar",

        Array.isArray(message) ? message.join("\n") : message,
      );
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: "Perfil da empresa" }} />

        <ActivityIndicator size="large" color={COLORS.primary} />

        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !company) {
    return (
      <SafeAreaView style={styles.centered}>
        <Stack.Screen options={{ title: "Perfil da empresa" }} />

        <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />

        <Text style={styles.errorTitle}>
          Não foi possível carregar o perfil
        </Text>

        <Text style={styles.errorText}>
          Confira sua conexão e se sua conta está vinculada a uma empresa.
        </Text>

        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.saveButtonText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Perfil da empresa" }} />

      <KeyboardAvoidingView
        style={styles.flex}

        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.primary} />

            <Text style={styles.backLinkText}>Voltar ao dashboard</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="storefront-outline"

                size={25}

                color={COLORS.primary}
              />
            </View>

            <Text style={styles.title}>Perfil da empresa</Text>

            <Text style={styles.subtitle}>
              Mantenha os dados do seu estabelecimento atualizados.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Imagem do estabelecimento</Text>

            <View style={styles.logoArea}>
              {selectedLogoUri || logoUrl.trim() ? (
                <Image
                  source={{ uri: selectedLogoUri || logoUrl.trim() }}

                  style={styles.logoPreview}

                  resizeMode="cover"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons
                    name="image-outline"

                    size={30}

                    color={COLORS.primary}
                  />
                </View>
              )}

              <View style={styles.logoCopy}>
                <Text style={styles.logoTitle}>Logo da empresa</Text>

                <Text style={styles.logoDescription}>
                  Escolha a Imagem do seu empreendimento! Ela será salva automaticamente
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.imageButton,

                pressed && styles.saveButtonPressed,

                isUploadingLogo && styles.saveButtonDisabled,
              ]}

              onPress={handleChooseLogo}

              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"

                    size={19}

                    color={COLORS.primary}
                  />

                  <Text style={styles.imageButtonText}>
                    {logoUrl ? "Trocar imagem" : "Selecionar imagem"}
                  </Text>
                </>
              )}
            </Pressable>

            <Text style={styles.helper}>
              Formatos: JPG, PNG ou WebP. Tamanho máximo: 5 MB.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dados da empresa</Text>

            <Field
              label="Nome do estabelecimento"

              value={name}

              onChangeText={setName}

              placeholder="Ex.: Studio Bella"
            />

            <Field
              label="E-mail de contato"

              value={email}

              onChangeText={setEmail}

              placeholder="contato@empresa.com.br"

              keyboardType="email-address"

              autoCapitalize="none"
            />

            <Field
              label="Telefone"

              value={phone}

              onChangeText={setPhone}

              placeholder="(31) 99999-9999"

              keyboardType="phone-pad"
            />

            <View style={styles.slugInfo}>
              <Ionicons
                name="link-outline"

                size={17}

                color={COLORS.secondary}
              />

              <View style={styles.slugCopy}>
                <Text style={styles.slugLabel}>
                  Identificador do estabelecimento
                </Text>

                <Text style={styles.slugValue}>
                  {company.slug || "Não informado"}
                </Text>

                <Text style={styles.helper}>
                  O identificador não é editado nesta tela.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,

              (pressed || isSaving) && styles.saveButtonPressed,

              isSaving && styles.saveButtonDisabled,
            ]}

            onPress={handleSave}

            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"

                  size={20}

                  color="#FFFFFF"
                />

                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.footerNote}>
            As alterações serão salvas no cadastro da empresa.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  safeArea: { flex: 1, backgroundColor: COLORS.background },

  centered: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: 24,

    backgroundColor: COLORS.background,
  },

  loadingText: { marginTop: 12, color: COLORS.secondary, fontSize: 13 },

  errorTitle: {
    marginTop: 12,

    color: COLORS.text,

    fontSize: 18,

    fontWeight: "800",

    textAlign: "center",
  },

  errorText: {
    marginTop: 8,

    marginBottom: 18,

    color: COLORS.secondary,

    textAlign: "center",

    lineHeight: 21,
  },

  retryButton: {
    backgroundColor: COLORS.primary,

    paddingHorizontal: 18,

    paddingVertical: 12,

    borderRadius: 12,
  },

  page: {
    width: "100%",

    maxWidth: 850,

    alignSelf: "center",

    padding: 22,

    paddingBottom: 48,

    gap: 18,
  },

  backLink: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    alignSelf: "flex-start",
  },

  backLinkText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },

  header: { marginTop: 4, marginBottom: 2 },

  headerIcon: {
    width: 48,

    height: 48,

    borderRadius: 15,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 13,
  },

  title: { color: COLORS.text, fontSize: 27, fontWeight: "900" },

  subtitle: {
    color: COLORS.secondary,

    fontSize: 13,

    lineHeight: 20,

    marginTop: 7,
  },

  card: {
    backgroundColor: COLORS.card,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    padding: 20,

    gap: 16,
  },

  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },

  logoArea: { flexDirection: "row", alignItems: "center", gap: 14 },

  logoPreview: {
    width: 88,

    height: 88,

    borderRadius: 18,

    backgroundColor: COLORS.primaryLight,
  },

  logoPlaceholder: {
    width: 88,

    height: 88,

    borderRadius: 18,

    backgroundColor: COLORS.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  logoCopy: { flex: 1, gap: 5 },

  logoTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },

  logoDescription: { color: COLORS.secondary, fontSize: 12, lineHeight: 18 },

  field: { gap: 7 },

  label: { color: COLORS.text, fontSize: 12, fontWeight: "800" },

  input: {
    minHeight: 48,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 12,

    backgroundColor: "#FFFEFF",

    paddingHorizontal: 14,

    paddingVertical: 12,

    color: COLORS.text,

    fontSize: 14,
  },

  helper: { color: COLORS.secondary, fontSize: 11, lineHeight: 16 },

  slugInfo: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: 10,

    backgroundColor: COLORS.background,

    borderRadius: 12,

    padding: 13,
  },

  slugCopy: { flex: 1, gap: 4 },

  slugLabel: { color: COLORS.secondary, fontSize: 11, fontWeight: "700" },

  slugValue: { color: COLORS.text, fontSize: 13, fontWeight: "800" },

  imageButton: {
    minHeight: 48,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: COLORS.primary,

    backgroundColor: COLORS.primaryLight,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,

    paddingHorizontal: 16,
  },

  imageButtonText: {
    color: COLORS.primaryDark,

    fontSize: 13,

    fontWeight: "800",
  },

  saveButton: {
    minHeight: 52,

    borderRadius: 14,

    backgroundColor: COLORS.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,

    paddingHorizontal: 18,
  },

  saveButtonPressed: { backgroundColor: COLORS.primaryDark },

  saveButtonDisabled: { opacity: 0.75 },

  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  footerNote: {
    color: COLORS.muted,

    fontSize: 11,

    textAlign: "center",

    marginTop: -8,
  },
});
