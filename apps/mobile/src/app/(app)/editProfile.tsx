import {
  ActivityIndicator,
  Alert,
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
import { router } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/core/auth/auth-context";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/features/profile/api/profileApi";

const COLORS = {
  primary: "#B55A91",
  primaryDark: "#93436F",
  primaryLight: "#FCECF4",
  background: "#FCFAFD",
  white: "#FFFFFF",
  text: "#2E2430",
  textSecondary: "#7B7280",
  textMuted: "#A59BA6",
  border: "#EEE5EC",
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhoneInput(value: string) {
  const numbers = onlyNumbers(value).slice(0, 11);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatBirthDateInput(value: string) {
  const numbers = onlyNumbers(value).slice(0, 8);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
}

function birthDateToApi(value: string) {
  const numbers = onlyNumbers(value);

  if (numbers.length !== 8) return undefined;

  const day = Number(numbers.slice(0, 2));
  const month = Number(numbers.slice(2, 4));
  const year = Number(numbers.slice(4, 8));

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function apiDateToInput(value?: string | null) {
  if (!value) return "";

  const dateString = String(value).slice(0, 10);
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return "";

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export default function EditProfileScreen() {
  const { user } = useAuth();

  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch,
  } = useGetMyProfileQuery();

  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [instagram, setInstagram] = useState("");
  const [preferences, setPreferences] = useState("");
  const [allergies, setAllergies] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!profile) return;

    setName(profile.name ?? user?.name ?? "");
    setPhone(formatPhoneInput(profile.phone ?? ""));
    setBirthDate(apiDateToInput(profile.birthDate));
    setGender(profile.gender ?? "");
    setInstagram(profile.instagram ?? "");
    setPreferences(profile.preferences ?? "");
    setAllergies(profile.allergies ?? "");
    setObservations(profile.observations ?? "");
  }, [profile, user]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const birthDateForApi = birthDate
        ? convertDateToApi(birthDate)
        : undefined;

      await updateProfile({
        name: name.trim(),
        phone: onlyNumbers(phone) || undefined,
        birthDate: birthDateForApi,
        gender: gender || undefined,
        instagram: instagram.trim() || undefined,
        preferences: preferences.trim() || undefined,
        notes: observations.trim() || undefined,
        allergies: allergies.trim() || undefined,
      }).unwrap();

      await refetch();

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);

      Alert.alert("Erro", "Não foi possível atualizar seu perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando seus dados...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={21} color={COLORS.text} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>Editar perfil</Text>
              <Text style={styles.subtitle}>Atualize seus dados pessoais.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>

            <View style={styles.card}>
              <Input
                label="Nome completo"
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
              />

              <Input
                label="E-mail"
                icon="mail-outline"
                value={profile?.email ?? user?.email ?? ""}
                editable={false}
                placeholder="Seu e-mail"
              />

              <Input
                label="Telefone"
                icon="call-outline"
                value={phone}
                onChangeText={(value) => setPhone(formatPhoneInput(value))}
                keyboardType="phone-pad"
                placeholder="(31) 99999-9999"
              />

              <Input
                label="Data de nascimento"
                icon="calendar-outline"
                value={birthDate}
                onChangeText={(value) =>
                  setBirthDate(formatBirthDateInput(value))
                }
                keyboardType="phone-pad"
                placeholder="DD/MM/YYYY"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gênero</Text>

            <View style={styles.genderContainer}>
              <GenderButton
                label="Masculino"
                selected={gender === "MALE"}
                onPress={() => setGender("MALE")}
              />

              <GenderButton
                label="Feminino"
                selected={gender === "FEMALE"}
                onPress={() => setGender("FEMALE")}
              />

              <GenderButton
                label="Outro"
                selected={gender === "OTHER"}
                onPress={() => setGender("OTHER")}
              />

              <GenderButton
                label="Prefiro não informar"
                selected={gender === "PREFER_NOT_TO_SAY"}
                onPress={() => setGender("PREFER_NOT_TO_SAY")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferências e atendimento</Text>

            <View style={styles.card}>
              <Input
                label="Instagram"
                icon="logo-instagram"
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@seuinstagram"
              />

              <Input
                label="Preferências"
                icon="heart-outline"
                value={preferences}
                onChangeText={setPreferences}
                placeholder="Ex.: prefiro atendimento pela manhã"
                multiline
              />

              <Input
                label="Alergias"
                icon="warning-outline"
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Informe possíveis alergias"
                multiline
              />

              <Input
                label="Observações"
                icon="document-text-outline"
                value={observations}
                onChangeText={setObservations}
                placeholder="Alguma informação importante?"
                multiline
                last
              />
            </View>
          </View>

          <Pressable
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
              isSaving && styles.saveButtonDisabled,
            ]}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={COLORS.white}
                />
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={isSaving}
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  multiline = false,
  last = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.inputContainer, !last && styles.inputBorder]}>
      <View style={styles.inputIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>

      <View style={styles.inputContent}>
        <Text style={styles.inputLabel}>{label}</Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input,
            !editable && styles.inputDisabled,
            multiline && styles.inputMultiline,
          ]}
        />
      </View>
    </View>
  );
}

function GenderButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.genderButton,
        selected && styles.genderButtonSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={19}
        color={selected ? COLORS.primary : COLORS.textMuted}
      />

      <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  container: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 28,
  },
  headerText: {
    flex: 1,
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
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 11,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 76,
  },
  inputBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    marginTop: 4,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
    minHeight: 25,
  },
  inputDisabled: {
    color: COLORS.textMuted,
  },
  inputMultiline: {
    minHeight: 70,
    lineHeight: 20,
  },
  genderContainer: {
    gap: 9,
  },
  genderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  genderButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  genderTextSelected: {
    color: COLORS.primaryDark,
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
