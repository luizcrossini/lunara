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

import { useLoginMutation } from "@/features/auth/api/authApi";
import { getDeviceLoginData } from "@/core/device/device.service";
import { authStorage } from "@/core/auth/auth-storage.service";
import { useAuth } from "@/core/auth/auth-context";

type FeedbackType = "success" | "error" | null;

type CompanyUser = {
  companyId: string;
  role: string;
  company?: {
    id: string;
    name: string;
  };
};

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);

  const [feedbackTitle, setFeedbackTitle] = useState("");

  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading }] = useLoginMutation();
  const { signIn } = useAuth();

  function showFeedback(type: FeedbackType, title: string, message: string) {
    setFeedbackType(type);

    setFeedbackTitle(title);

    setFeedbackMessage(message);
  }

  function closeFeedback() {
    setFeedbackType(null);

    setFeedbackTitle("");

    setFeedbackMessage("");
  }

  async function handleLogin() {
    closeFeedback();

    /*
     * VALIDAÇÃO DO E-MAIL
     */

    if (!email.trim()) {
      showFeedback(
        "error",
        "E-mail obrigatório",
        "Informe seu endereço de e-mail para continuar.",
      );

      return;
    }

    /*
     * VALIDAÇÃO DA SENHA
     */

    if (!password) {
      showFeedback(
        "error",
        "Senha obrigatória",
        "Informe sua senha para continuar.",
      );

      return;
    }

    try {
      /*
       * COLETA INFORMAÇÕES DO DISPOSITIVO
       */

      const deviceData = await getDeviceLoginData();

      /*
       * REALIZA LOGIN
       */

      const response = await login({
        email: email.trim().toLowerCase(),
        password,
        ...deviceData,
      }).unwrap();

      /*
       * EXTRAÇÃO DOS DADOS RETORNADOS
       */

      const { user, accessToken, refreshToken, companyUsers } =
        response.data as typeof response.data & {
          companyUsers?: CompanyUser[];
        };

      /*
       * O papel do usuário não está no User.
       * Ele está no vínculo CompanyUser.
       *
       * Se existir um vínculo ativo com role OWNER,
       * o usuário deve entrar no painel do proprietário.
       */
      const isOwner = (companyUsers ?? []).some(
        (companyUser) => companyUser.role.toUpperCase() === "OWNER",
      );

      /*
       * SALVA A SESSÃO LOCALMENTE
       *
       * Mobile:
       * expo-secure-store
       *
       * Web:
       * localStorage
       */

      await authStorage.saveSession({
        user,
        accessToken,
        refreshToken,
      });

      signIn(user);

      /*
       * PRIMEIRO NOME DO USUÁRIO
       */

      const userName = user.name?.split(" ")[0] ?? "usuário";

      /*
       * FEEDBACK VISUAL
       */

      showFeedback(
        "success",
        "Login efetuado!",
        `Seja bem-vindo(a), ${userName}!`,
      );

      /*
       * REDIRECIONAMENTO
       *
       * Pequeno intervalo para permitir
       * que o usuário veja a confirmação.
       */

      setTimeout(() => {
        if (isOwner) {
          router.replace("/dashboard");
          return;
        }

        router.replace("/");
      }, 1500);
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      let message =
        "Não foi possível realizar o login. Verifique seus dados e tente novamente.";

      /*
       * MENSAGEM RETORNADA PELA API
       */

      if (error?.data?.message) {
        message =
          typeof error.data.message === "string"
            ? error.data.message
            : "Não foi possível realizar o login.";
      }

      /*
       * ERRO DE REDE
       */

      if (
        error?.status === "FETCH_ERROR" ||
        error?.error === "TypeError: Failed to fetch"
      ) {
        message =
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
      }

      /*
       * ERRO INTERNO DO SERVIDOR
       */

      if (error?.status === 500) {
        message =
          "Ocorreu um problema no servidor. Tente novamente em alguns instantes.";
      }

      /*
       * FEEDBACK DE ERRO
       */

      showFeedback("error", "Não foi possível entrar", message);
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* DECORAÇÃO DE FUNDO */}

          <View style={styles.topGlow} />

          <View style={styles.bottomGlow} />

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
              <Text style={styles.title}>Bem-vindo(a) à Lunara</Text>

              <Text style={styles.subtitle}>
                Entre com seus dados para continuar
              </Text>
            </View>

            {/* FEEDBACK */}

            {feedbackType && (
              <View
                style={[
                  styles.feedbackContainer,

                  feedbackType === "success"
                    ? styles.feedbackSuccess
                    : styles.feedbackError,
                ]}
              >
                <View
                  style={[
                    styles.feedbackIcon,

                    feedbackType === "success"
                      ? styles.feedbackIconSuccess
                      : styles.feedbackIconError,
                  ]}
                >
                  <Text style={styles.feedbackIconText}>
                    {feedbackType === "success" ? "✓" : "!"}
                  </Text>
                </View>

                <View style={styles.feedbackContent}>
                  <Text
                    style={[
                      styles.feedbackTitle,

                      feedbackType === "success"
                        ? styles.feedbackTitleSuccess
                        : styles.feedbackTitleError,
                    ]}
                  >
                    {feedbackTitle}
                  </Text>

                  <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>
                </View>

                {feedbackType === "error" && (
                  <Pressable
                    onPress={closeFeedback}
                    hitSlop={10}
                    style={styles.feedbackClose}
                  >
                    <Text style={styles.feedbackCloseText}>×</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* FORMULÁRIO */}

            <View style={styles.form}>
              {/* EMAIL */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#A49AA5"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                  style={styles.input}
                />
              </View>

              {/* SENHA */}

              <View style={styles.inputGroup}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.label}>Senha</Text>

                  <Pressable onPress={() => router.push("/forgot-password")}>
                    <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
                  </Pressable>
                </View>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#A49AA5"
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    autoComplete="password"
                    style={styles.passwordInput}
                  />

                  <Pressable
                    onPress={() => setShowPassword((previous) => !previous)}
                    style={styles.passwordToggle}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* BOTÃO */}

              <Pressable
                onPress={handleLogin}
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

                    <Text style={styles.buttonText}>Entrando...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </Pressable>
            </View>

            {/* CADASTRO */}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Ainda não tem uma conta?</Text>

              <Pressable onPress={() => router.push("/register")}>
                <Text style={styles.registerLink}>Cadastre-se agora</Text>
              </Pressable>
            </View>
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © Lunara • Simplificando agendas.
            </Text>

            <Text style={styles.footerHighlight}>
              Valorizando <Text style={styles.footerHighlightBold}>TEMPO!</Text>
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
    top: -200,
    alignSelf: "center",
    width: 520,
    height: 380,
    borderRadius: 260,
    backgroundColor: "#F7E2EF",
    opacity: 0.75,
  },

  bottomGlow: {
    position: "absolute",
    bottom: -250,
    right: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: "#EEE5F6",
    opacity: 0.6,
  },

  content: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 190,
    height: 145,
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2E2430",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7B7280",
    textAlign: "center",
  },

  feedbackContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },

  feedbackSuccess: {
    backgroundColor: "#F0FAF5",
    borderColor: "#BDE7CF",
  },

  feedbackError: {
    backgroundColor: "#FFF4F5",
    borderColor: "#F2C7CD",
  },

  feedbackIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  feedbackIconSuccess: {
    backgroundColor: "#4E9A76",
  },

  feedbackIconError: {
    backgroundColor: "#D66A76",
  },

  feedbackIconText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  feedbackContent: {
    flex: 1,
  },

  feedbackTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  feedbackTitleSuccess: {
    color: "#2E7051",
  },

  feedbackTitleError: {
    color: "#A83E4B",
  },

  feedbackMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#756A76",
  },

  feedbackClose: {
    paddingLeft: 8,
  },

  feedbackCloseText: {
    fontSize: 24,
    lineHeight: 22,
    color: "#A49AA5",
  },

  form: {
    gap: 20,
  },

  inputGroup: {
    gap: 8,
  },

  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  passwordInputContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DDE7",
    paddingRight: 16,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#2E2430",

    ...(Platform.OS === "web"
      ? {
          outlineStyle: "none" as any,
        }
      : {}),
  },

  passwordToggle: {
    paddingVertical: 8,
    paddingLeft: 8,
  },

  passwordToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A74D82",
  },

  forgotPassword: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A74D82",
  },

  button: {
    width: "100%",
    height: 56,
    marginTop: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B55A91",

    shadowColor: "#B55A91",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  registerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 32,
  },

  registerText: {
    fontSize: 14,
    color: "#7B7280",
  },

  registerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A74D82",
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  footerText: {
    fontSize: 12,
    color: "#8E8490",
    textAlign: "center",
  },

  footerHighlight: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A74D82",
    marginTop: 2,
  },
});
