import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

export default function AccountTypeScreen() {
  const router = useRouter();

  function handleSelect(type: "customer" | "business") {
    router.push({
      pathname: "/register",
      params: { type },
    });
  }

  return (
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
          <Text style={styles.title}>Como você quer usar a Lunara?</Text>
          <Text style={styles.subtitle}>
            Escolha uma opção para criar sua conta e começar.
          </Text>
        </View>

        <View style={styles.options}>
          <Pressable
            onPress={() => handleSelect("customer")}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sou cliente</Text>
              <Text style={styles.optionDescription}>
                Quero encontrar profissionais, conhecer serviços e agendar meus
                atendimentos.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect("business")}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏢</Text>
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Tenho um negócio</Text>
              <Text style={styles.optionDescription}>
                Quero gerenciar meu salão, clínica ou espaço de atendimento.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já possui uma conta?</Text>

          <Pressable onPress={() => router.replace("/")} hitSlop={10}>
            <Text style={styles.loginLink}>Entrar</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © Lunara - Simplificando agendas.{" "}
          <Text style={styles.footerHighlight}>Valorizando TEMPO!</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 18,
  },

  logo: {
    width: 170,
    height: 120,
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
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7B7280",
    textAlign: "center",
    maxWidth: 360,
  },

  options: {
    width: "100%",
    gap: 16,
  },

  optionCard: {
    width: "100%",
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DDE7",
    shadowColor: "#6D5265",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  optionCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
    borderColor: "#C98CAF",
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9EAF3",
    marginRight: 16,
  },

  icon: {
    fontSize: 27,
  },

  optionContent: {
    flex: 1,
    paddingRight: 8,
  },

  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2430",
    marginBottom: 6,
  },

  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#7B7280",
  },

  arrow: {
    fontSize: 30,
    fontWeight: "300",
    color: "#B55A91",
    marginLeft: 4,
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
