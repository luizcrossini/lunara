import { useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";

import { useRouter } from "expo-router";

import { useForgotPasswordMutation } from "@/features/auth/api/authApi";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  async function handleForgotPassword() {
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe seu endereço de e-mail para continuar.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Informe um endereço de e-mail válido.");
      return;
    }

    try {
      const response = await forgotPassword({
        email: normalizedEmail,
      }).unwrap();

      setSuccess(
        response.data?.message ??
          "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      );
    } catch (error: any) {
      console.error("FORGOT PASSWORD ERROR:", error);

      setError(
        error?.data?.message ??
          "Não foi possível processar sua solicitação. Tente novamente.",
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
              <Text style={styles.title}>Esqueceu sua senha?</Text>

              <Text style={styles.subtitle}>
                Não se preocupe. Informe seu e-mail e enviaremos as instruções
                para você redefinir sua senha.
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
                  <Text style={styles.label}>E-mail</Text>

                  <TextInput
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Digite seu e-mail"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>

                <Pressable
                  onPress={handleForgotPassword}
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
                    <Text style={styles.buttonText}>Enviar instruções</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>

                <Text style={styles.successTitle}>Solicitação enviada</Text>

                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <View style={styles.backContainer}>
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.backText}>Voltar para o login</Text>
              </Pressable>
            </View>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: "center",
    lineHeight: 52,
    fontSize: 24,
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
