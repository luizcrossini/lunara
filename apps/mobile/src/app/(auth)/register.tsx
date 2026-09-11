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

import { useRouter } from "expo-router";

import { useRegisterMutation } from "@/features/auth/api/authApi";

type RegisterError = {
  message: string;

  field?: "name" | "email" | "password" | "confirmPassword";
};

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [registerError, setRegisterError] = useState<RegisterError | null>(
    null,
  );

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [register, { isLoading }] = useRegisterMutation();

  function clearError(field?: RegisterError["field"]) {
    if (!registerError) {
      return;
    }

    if (!field || registerError.field === field) {
      setRegisterError(null);
    }
  }

  function getErrorMessage(error: any): RegisterError {
    const backendMessage = error?.data?.message;

    const status = error?.status;

    if (Array.isArray(backendMessage) && backendMessage.length > 0) {
      return {
        message: backendMessage[0],
      };
    }

    if (status === 409) {
      return {
        message: "Este e-mail já possui uma conta cadastrada.",
        field: "email",
      };
    }

    if (status === 429) {
      return {
        message:
          "Muitas tentativas foram realizadas. Aguarde alguns instantes antes de tentar novamente.",
      };
    }

    if (status === "FETCH_ERROR") {
      return {
        message:
          "Não foi possível conectar à Lunara. Verifique sua conexão com a internet.",
      };
    }

    if (status === "TIMEOUT_ERROR") {
      return {
        message: "A conexão demorou mais do que o esperado. Tente novamente.",
      };
    }

    if (status >= 500) {
      return {
        message:
          "Estamos enfrentando uma instabilidade. Tente novamente em alguns minutos.",
      };
    }

    if (typeof backendMessage === "string") {
      return {
        message: backendMessage,
      };
    }

    return {
      message: "Não foi possível criar sua conta. Tente novamente.",
    };
  }

  async function handleRegister() {
    setRegisterError(null);

    if (!name.trim()) {
      setRegisterError({
        message: "Informe seu nome para criar sua conta.",
        field: "name",
      });

      return;
    }

    if (name.trim().length < 3) {
      setRegisterError({
        message: "Seu nome deve ter pelo menos 3 caracteres.",
        field: "name",
      });

      return;
    }

    if (!email.trim()) {
      setRegisterError({
        message: "Informe seu endereço de e-mail.",
        field: "email",
      });

      return;
    }

    if (!email.includes("@")) {
      setRegisterError({
        message: "Digite um endereço de e-mail válido.",
        field: "email",
      });

      return;
    }

    if (!password) {
      setRegisterError({
        message: "Crie uma senha para sua conta.",
        field: "password",
      });

      return;
    }

    if (password.length < 8) {
      setRegisterError({
        message: "Sua senha deve ter pelo menos 8 caracteres.",
        field: "password",
      });

      return;
    }

    if (password !== confirmPassword) {
      setRegisterError({
        message: "As senhas informadas não são iguais.",
        field: "confirmPassword",
      });

      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      router.replace("/");
    } catch (error: any) {
      console.error("REGISTER ERROR:", error);

      setRegisterError(getErrorMessage(error));
    }
  }

  const nameHasError = registerError?.field === "name";

  const emailHasError = registerError?.field === "email";

  const passwordHasError = registerError?.field === "password";

  const confirmPasswordHasError = registerError?.field === "confirmPassword";

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
            {/* LOGO */}

            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* HEADER */}

            <View style={styles.header}>
              <Text style={styles.title}>Crie sua conta</Text>

              <Text style={styles.subtitle}>
                Comece a simplificar sua rotina com a Lunara
              </Text>
            </View>

            {/* ERROR */}

            {registerError && (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <Text style={styles.errorIcon}>!</Text>
                </View>

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

            {/* FORM */}

            <View style={styles.form}>
              {/* NAME */}

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
                  editable={!isLoading}
                  style={[styles.input, nameHasError && styles.inputError]}
                />
              </View>

              {/* EMAIL */}

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
                  keyboardType="email-address"
                  editable={!isLoading}
                  style={[styles.input, emailHasError && styles.inputError]}
                />
              </View>

              {/* PASSWORD */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Crie uma senha</Text>

                <View
                  style={[
                    styles.passwordInputContainer,
                    passwordHasError && styles.inputError,
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
                    editable={!isLoading}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={10}
                    disabled={isLoading}
                  >
                    <Text style={styles.showPassword}>
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* CONFIRM PASSWORD */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirme sua senha</Text>

                <View
                  style={[
                    styles.passwordInputContainer,
                    confirmPasswordHasError && styles.inputError,
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);

                      clearError("confirmPassword");
                    }}
                    placeholder="Digite sua senha novamente"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    style={styles.passwordInput}
                  />

                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={10}
                    disabled={isLoading}
                  >
                    <Text style={styles.showPassword}>
                      {showConfirmPassword ? "Ocultar" : "Mostrar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* REGISTER BUTTON */}

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

            {/* LOGIN */}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já possui uma conta?</Text>

              <Pressable
                onPress={() => router.replace("/")}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Entrar</Text>
              </Pressable>
            </View>
          </View>

          {/* FOOTER */}

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
    backgroundColor: "#FCFAFD",
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: "#FCFAFD",
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

    paddingTop: 40,

    paddingBottom: 24,
  },

  logoContainer: {
    alignItems: "center",

    marginBottom: 20,
  },

  logo: {
    width: 170,
    height: 120,
  },

  header: {
    alignItems: "center",

    marginBottom: 24,
  },

  title: {
    fontSize: 26,

    fontWeight: "700",

    color: "#2E2430",

    textAlign: "center",

    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,

    lineHeight: 22,

    color: "#7B7280",

    textAlign: "center",
  },

  errorContainer: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: 12,

    padding: 14,

    marginBottom: 20,

    borderRadius: 16,

    backgroundColor: "#FFF1F3",

    borderWidth: 1,

    borderColor: "#FFD1D8",
  },

  errorIconContainer: {
    width: 24,
    height: 24,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E5484D",
  },

  errorIcon: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "800",
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#B42318",

    marginBottom: 3,
  },

  errorMessage: {
    fontSize: 13,

    lineHeight: 19,

    color: "#7A271A",
  },

  closeError: {
    fontSize: 24,

    lineHeight: 20,

    color: "#B42318",
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

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E8DDE7",

    fontSize: 16,

    color: "#2E2430",

    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none" as any,
        }
      : {}),
  },

  inputError: {
    borderColor: "#E5484D",

    borderWidth: 1.5,

    backgroundColor: "#FFF9FA",
  },

  passwordInputContainer: {
    width: "100%",

    height: 56,

    flexDirection: "row",

    alignItems: "center",

    paddingLeft: 18,

    paddingRight: 16,

    borderRadius: 16,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E8DDE7",
  },

  passwordInput: {
    flex: 1,

    height: "100%",

    fontSize: 16,

    color: "#2E2430",

    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none" as any,
        }
      : {}),
  },

  showPassword: {
    fontSize: 13,

    fontWeight: "600",

    color: "#9B5C86",
  },

  button: {
    width: "100%",

    height: 56,

    marginTop: 8,

    borderRadius: 16,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#B55A91",

    shadowColor: "#B55A91",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.2,

    shadowRadius: 12,

    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.98,
      },
    ],
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
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 5,

    marginTop: 28,
  },

  loginText: {
    fontSize: 14,

    color: "#7B7280",
  },

  loginLink: {
    fontSize: 14,

    fontWeight: "700",

    color: "#A74D82",
  },

  footer: {
    alignItems: "center",

    paddingHorizontal: 20,

    paddingBottom: 24,
  },

  footerText: {
    fontSize: 12,

    color: "#7B7280",

    textAlign: "center",
  },

  footerHighlight: {
    fontWeight: "700",

    color: "#A74D82",
  },
});
