import { useState } from "react";

import {
  ActivityIndicator,
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

import { useLocalSearchParams, useRouter } from "expo-router";

import { baseApi } from "@/core/api/baseApi";
import { authStorage } from "@/core/auth/auth-storage.service";
import { useAuth } from "@/core/auth/auth-context";

type AccountType = "customer" | "business";

type RegisterRequest = {
  type: AccountType;
  name: string;
  email: string;
  password: string;
  corporateName?: string;
  tradeName?: string;
  documentType?: "CPF" | "CNPJ";
  document?: string;
  companyEmail?: string;
};

type RegisterResponse = {
  user: {
    id: string;
    name?: string;
    email: string;
    [key: string]: unknown;
  };
  accessToken: string;
  refreshToken: string;
};

type RegisterError = {
  message: string;
  field?: "name" | "email" | "password" | "confirmPassword" | "corporateName" | "tradeName" | "document" | "companyEmail";
};

const registerApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
  }),
});

const { useRegisterMutation } = registerApi;

const COLORS = {
  background: "#FCFAFD",
  white: "#FFFFFF",
  primary: "#B55A91",
  primaryDark: "#93436F",
  text: "#2E2430",
  secondary: "#7B7280",
  border: "#E8DDE7",
  error: "#B42318",
  errorBackground: "#FFF1F3",
};

export default function RegisterScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ type?: string }>();

  const accountType: AccountType =
    params.type === "business" ? "business" : "customer";

  const { signIn } = useAuth();

  const [register, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dados adicionais exigidos somente para contas empresariais.
  const [corporateName, setCorporateName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [documentType, setDocumentType] = useState<"CPF" | "CNPJ">("CNPJ");
  const [document, setDocument] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerError, setRegisterError] = useState<RegisterError | null>(
    null,
  );

  function clearError(field?: RegisterError["field"]) {
    if (!field || registerError?.field === field) {
      setRegisterError(null);
    }
  }

  function getErrorMessage(error: any): RegisterError {
    const message = error?.data?.message ?? error?.message;
    const status = error?.status;

    if (status === 409) {
      const conflictMessage = Array.isArray(message)
        ? String(message[0])
        : typeof message === "string"
          ? message
          : "Este e-mail ou CNPJ já está cadastrado.";
      return { message: conflictMessage };
    }

    if (status === 429) {
      return {
        message:
          "Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
      };
    }

    if (status === "FETCH_ERROR") {
      return {
        message:
          "Não foi possível conectar à Lunara. Verifique sua conexão e a URL da API.",
      };
    }

    if (Array.isArray(message) && message.length > 0) {
      return { message: String(message[0]) };
    }

    if (typeof message === "string") {
      return { message };
    }

    return {
      message: "Não foi possível criar sua conta. Tente novamente.",
    };
  }

  function validateForm(): boolean {
    if (!name.trim()) {
      setRegisterError({
        message: "Informe seu nome completo.",
        field: "name",
      });
      return false;
    }

    if (name.trim().length < 3) {
      setRegisterError({
        message: "O nome deve ter pelo menos 3 caracteres.",
        field: "name",
      });
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setRegisterError({
        message: "Informe seu e-mail.",
        field: "email",
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setRegisterError({
        message: "Digite um endereço de e-mail válido.",
        field: "email",
      });
      return false;
    }

    if (password.length < 8) {
      setRegisterError({
        message: "A senha deve ter pelo menos 8 caracteres.",
        field: "password",
      });
      return false;
    }

    if (isBusiness) {
      if (corporateName.trim().length < 3) {
        setRegisterError({
          message: "Informe a razão social da empresa.",
          field: "corporateName",
        });
        return false;
      }

      if (tradeName.trim().length < 2) {
        setRegisterError({
          message: "Informe o nome fantasia do negócio.",
          field: "tradeName",
        });
        return false;
      }

      const normalizedDocument = document.replace(/\D/g, "");
      const expectedLength = documentType === "CPF" ? 11 : 14;

      if (normalizedDocument.length !== expectedLength) {
        setRegisterError({
          message:
            documentType === "CPF"
              ? "Informe um CPF com 11 números."
              : "Informe um CNPJ com 14 números.",
          field: "document",
        });
        return false;
      }

      const normalizedCompanyEmail = companyEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedCompanyEmail)) {
        setRegisterError({
          message: "Informe um e-mail comercial válido.",
          field: "companyEmail",
        });
        return false;
      }
    }

    if (password !== confirmPassword) {
      setRegisterError({
        message: "As senhas informadas não são iguais.",
        field: "confirmPassword",
      });
      return false;
    }

    return true;
  }

  async function handleRegister() {
    setRegisterError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const payload: RegisterRequest = {
        type: accountType,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(isBusiness
          ? {
              corporateName: corporateName.trim(),
              tradeName: tradeName.trim(),
              documentType,
              document: document.replace(/\D/g, ""),
              companyEmail: companyEmail.trim().toLowerCase(),
            }
          : {}),
      };

      const rawResponse = await register(payload).unwrap();

      // A API pode devolver a resposta dentro de "data".
      const response: any =
        (rawResponse as any)?.data?.data ??
        (rawResponse as any)?.data ??
        rawResponse;

      const user = response?.user;
      const accessToken = response?.accessToken;
      const refreshToken = response?.refreshToken;

      if (!user?.id || !accessToken || !refreshToken) {
        throw new Error(
          "A API não retornou os dados necessários para iniciar a sessão.",
        );
      }

      await authStorage.saveSession({
        user,
        accessToken,
        refreshToken,
      });

      signIn(user);

      // O AuthGuard e o fluxo inicial da aplicação determinam
      // a tela adequada para o usuário autenticado.
      router.replace("/");
    } catch (error: any) {
      console.error("REGISTER ERROR:", error);

      setRegisterError(getErrorMessage(error));
    }
  }

  const isBusiness = accountType === "business";

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.topGlow} />

          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.header}>
              <View style={styles.accountBadge}>
                <Text style={styles.accountBadgeText}>
                  {isBusiness ? "🏢  Conta de negócio" : "👤  Conta de cliente"}
                </Text>
              </View>

              <Text style={styles.title}>Crie sua conta</Text>

              <Text style={styles.subtitle}>
                {isBusiness
                  ? "Comece a organizar seu negócio com a Lunara."
                  : "Encontre profissionais e agende seus atendimentos."}
              </Text>
            </View>

            {registerError && (
              <View style={styles.errorContainer}>
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>
                    Não foi possível continuar
                  </Text>

                  <Text style={styles.errorMessage}>
                    {registerError.message}
                  </Text>
                </View>

                <Pressable onPress={() => setRegisterError(null)} hitSlop={10}>
                  <Text style={styles.closeError}>×</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo</Text>

                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    clearError("name");
                  }}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  editable={!isLoading}
                  style={[
                    styles.input,
                    registerError?.field === "name" && styles.inputError,
                  ]}
                />
              </View>

              {isBusiness && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Razão social</Text>
                    <TextInput
                      value={corporateName}
                      onChangeText={(value) => {
                        setCorporateName(value);
                        clearError("corporateName");
                      }}
                      placeholder="Razão social da empresa"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!isLoading}
                      style={[
                        styles.input,
                        registerError?.field === "corporateName" && styles.inputError,
                      ]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome fantasia</Text>
                    <TextInput
                      value={tradeName}
                      onChangeText={(value) => {
                        setTradeName(value);
                        clearError("tradeName");
                      }}
                      placeholder="Nome do salão ou clínica"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!isLoading}
                      style={[
                        styles.input,
                        registerError?.field === "tradeName" && styles.inputError,
                      ]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Documento do negócio</Text>

                    <View style={styles.documentTypeContainer}>
                      {(["CPF", "CNPJ"] as const).map((type) => {
                        const selected = documentType === type;

                        return (
                          <Pressable
                            key={type}
                            onPress={() => {
                              setDocumentType(type);
                              setDocument("");
                              clearError("document");
                            }}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[
                              styles.documentTypeButton,
                              selected && styles.documentTypeButtonSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.documentTypeButtonText,
                                selected && styles.documentTypeButtonTextSelected,
                              ]}
                            >
                              {type}
                              {type === "CPF" ? " · Autônomo" : " · Empresa"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TextInput
                      value={document}
                      onChangeText={(value) => {
                        const allowed = value.replace(/\D/g, "");
                        const maxDigits = documentType === "CPF" ? 11 : 14;
                        setDocument(allowed.slice(0, maxDigits));
                        clearError("document");
                      }}
                      placeholder={
                        documentType === "CPF"
                          ? "000.000.000-00"
                          : "00.000.000/0000-00"
                      }
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      returnKeyType="next"
                      editable={!isLoading}
                      maxLength={documentType === "CPF" ? 11 : 14}
                      style={[
                        styles.input,
                        registerError?.field === "document" && styles.inputError,
                      ]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>E-mail comercial</Text>
                    <TextInput
                      value={companyEmail}
                      onChangeText={(value) => {
                        setCompanyEmail(value);
                        clearError("companyEmail");
                      }}
                      placeholder="contato@suaempresa.com.br"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                      editable={!isLoading}
                      style={[
                        styles.input,
                        registerError?.field === "companyEmail" && styles.inputError,
                      ]}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>

                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError("email");
                  }}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  editable={!isLoading}
                  style={[
                    styles.input,
                    registerError?.field === "email" && styles.inputError,
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Crie uma senha</Text>

                <View
                  style={[
                    styles.passwordContainer,
                    registerError?.field === "password" && styles.inputError,
                  ]}
                >
                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      clearError("password");
                    }}
                    placeholder="Mínimo de 8 caracteres"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
                    editable={!isLoading}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    onPress={() => setShowPassword((value) => !value)}
                    disabled={isLoading}
                    hitSlop={10}
                  >
                    <Text style={styles.showPassword}>
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirme sua senha</Text>

                <View
                  style={[
                    styles.passwordContainer,
                    registerError?.field === "confirmPassword" &&
                      styles.inputError,
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      clearError("confirmPassword");
                    }}
                    placeholder="Digite a senha novamente"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    returnKeyType="done"
                    editable={!isLoading}
                    onSubmitEditing={handleRegister}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    disabled={isLoading}
                    hitSlop={10}
                  >
                    <Text style={styles.showPassword}>
                      {showConfirmPassword ? "Ocultar" : "Mostrar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  isLoading && styles.buttonDisabled,
                  pressed && !isLoading && styles.buttonPressed,
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.buttonText}>Criando conta...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Criar minha conta</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já possui uma conta?</Text>

              <Pressable
                onPress={() => router.replace("/")}
                disabled={isLoading}
                hitSlop={10}
              >
                <Text style={styles.loginLink}>Entrar</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.back()}
              disabled={isLoading}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹ Voltar</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © Lunara - Simplificando agendas.{" "}
              <Text style={styles.footerHighlight}>Valorizando TEMPO!</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  topGlow: {
    position: "absolute",
    top: -180,
    alignSelf: "center",
    width: 500,
    height: 350,
    borderRadius: 250,
    backgroundColor: "#F8E6F0",
    opacity: 0.8,
  },

  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },

  logo: {
    width: 150,
    height: 100,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  accountBadge: {
    backgroundColor: "#F9EAF3",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },

  accountBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.secondary,
    textAlign: "center",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: COLORS.errorBackground,
    borderWidth: 1,
    borderColor: "#FFD1D8",
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 4,
  },

  errorMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7A271A",
  },

  closeError: {
    fontSize: 24,
    lineHeight: 22,
    color: COLORS.error,
  },

  form: {
    gap: 18,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#463B48",
  },

  input: {
    width: "100%",
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },

  inputError: {
    borderColor: "#E5484D",
    borderWidth: 1.5,
    backgroundColor: "#FFF9FA",
  },

  documentTypeContainer: {
    flexDirection: "row",
    gap: 10,
  },

  documentTypeButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  documentTypeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F9EAF3",
  },

  documentTypeButtonText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "600",
  },

  documentTypeButtonTextSelected: {
    color: COLORS.primaryDark,
  },

  passwordContainer: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  passwordInput: {
    flex: 1,
    minHeight: 54,
    fontSize: 16,
    color: COLORS.text,
  },

  showPassword: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9B5C86",
    paddingLeft: 8,
  },

  button: {
    width: "100%",
    minHeight: 56,
    marginTop: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 24,
  },

  loginText: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A74D82",
  },

  backButton: {
    alignSelf: "center",
    marginTop: 18,
    padding: 8,
  },

  backButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
  },

  footerHighlight: {
    fontWeight: "700",
    color: "#A74D82",
  },
});
