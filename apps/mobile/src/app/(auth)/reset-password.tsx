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

import { useResetPasswordMutation } from "@/features/auth/api/authApi";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const { token } = useLocalSearchParams<{
    token?: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  async function handleResetPassword() {
    setError("");
    setSuccess("");

    if (!token) {
      setError("O link de redefinição é inválido ou está incompleto.");

      return;
    }

    if (!password) {
      setError("Informe sua nova senha.");

      return;
    }

    if (password.length < 8) {
      setError("Sua senha deve ter pelo menos 8 caracteres.");

      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não são iguais.");

      return;
    }

    try {
      const response = await resetPassword({
        token,
        password,
      }).unwrap();

      setSuccess(
        response.data?.message ?? "Sua senha foi redefinida com sucesso.",
      );
    } catch (error: any) {
      console.error("RESET PASSWORD ERROR:", error);

      setError(
        error?.data?.message ??
          "Não foi possível redefinir sua senha. Tente novamente.",
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.title}>Criar nova senha</Text>

              <Text style={styles.subtitle}>
                Crie uma nova senha segura para acessar sua conta.
              </Text>
            </View>

            {!success ? (
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>
                      Não foi possível continuar
                    </Text>

                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nova senha</Text>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Digite sua nova senha"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      style={styles.passwordInput}
                    />

                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.showPasswordButton}
                    >
                      <Text style={styles.showPasswordText}>
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar nova senha</Text>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Digite novamente sua senha"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                      style={styles.passwordInput}
                    />

                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.showPasswordButton}
                    >
                      <Text style={styles.showPasswordText}>
                        {showConfirmPassword ? "Ocultar" : "Mostrar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.passwordHint}>
                  Sua senha deve possuir pelo menos 8 caracteres.
                </Text>

                <Pressable
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.button,
                    isLoading && styles.buttonDisabled,
                    pressed && !isLoading && styles.buttonPressed,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Redefinir senha</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>

                <Text style={styles.successTitle}>Senha redefinida!</Text>

                <Text style={styles.successText}>{success}</Text>

                <Pressable
                  style={styles.loginButton}
                  onPress={() => router.replace("/login")}
                >
                  <Text style={styles.loginButtonText}>Ir para o login</Text>
                </Pressable>
              </View>
            )}

            {!success && (
              <View style={styles.backContainer}>
                <Pressable onPress={() => router.replace("/login")}>
                  <Text style={styles.backText}>Voltar para o login</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © Lunara - Simplificando agendas. Valorizando TEMPO.
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
    marginBottom: 32,
  },

  logo: {
    width: 190,
    height: 150,
  },

  header: {
    alignItems: "center",
    marginBottom: 36,
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

  form: {
    gap: 20,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#463B48",
  },

  passwordContainer: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DDE7",
    borderRadius: 16,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 18,
    paddingRight: 8,
    fontSize: 16,
    color: "#2E2430",

    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none" as any,
        }
      : {}),
  },

  showPasswordButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  showPasswordText: {
    color: "#A74D82",
    fontSize: 13,
    fontWeight: "700",
  },

  passwordHint: {
    marginTop: -8,
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
  },

  errorContainer: {
    backgroundColor: "#FFF4F5",
    borderWidth: 1,
    borderColor: "#F5C2C7",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },

  errorTitle: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "700",
  },

  errorText: {
    color: "#7A271A",
    fontSize: 14,
    lineHeight: 20,
  },

  button: {
    width: "100%",
    height: 56,
    marginTop: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B55A91",
    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  successContainer: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D8EEDC",
  },

  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: "center",
    lineHeight: 56,
    fontSize: 26,
    fontWeight: "700",
    color: "#2F7D46",
    backgroundColor: "#EAF7ED",
    marginBottom: 16,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 8,
  },

  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B7280",
    textAlign: "center",
  },

  loginButton: {
    width: "100%",
    height: 52,
    marginTop: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B55A91",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  backContainer: {
    alignItems: "center",
    marginTop: 28,
  },

  backText: {
    color: "#A74D82",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  footerText: {
    fontSize: 12,
    color: "#7B7280",
    textAlign: "center",
  },
});
