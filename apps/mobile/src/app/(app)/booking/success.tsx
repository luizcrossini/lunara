import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

export default function BookingSuccessScreen() {
  const {
    companyName,
    branchName,
    serviceNames,
    professionalName,
    date,
    startTime,
    endTime,
  } = useLocalSearchParams<{
    companyName?: string;
    branchName?: string;
    serviceNames?: string;
    professionalName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }>();

  // ============================================================
  // FORMATAR DATA
  // ============================================================

  function formatDate(value?: string) {
    if (!value) {
      return "";
    }

    // Se vier como YYYY-MM-DD
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const [, year, month, day] = match;

      return `${day}/${month}/${year}`;
    }

    return value;
  }

  // ============================================================
  // FORMATAR HORÁRIO
  // ============================================================

  function formatTime(value?: string) {
    if (!value) {
      return "";
    }

    // Exemplo:
    // 2026-09-04T14:30:00.000Z

    if (value.includes("T")) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
      }
    }

    // Caso já venha como HH:mm
    return value.substring(0, 5);
  }

  // ============================================================
  // VOLTAR PARA INÍCIO
  // ============================================================

  function handleGoHome() {
    router.replace("/(app)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* ====================================================== */}
        {/* ÍCONE DE SUCESSO */}
        {/* ====================================================== */}

        <View style={styles.successCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        {/* ====================================================== */}
        {/* TÍTULO */}
        {/* ====================================================== */}

        <Text style={styles.title}>Agendamento realizado!</Text>

        <Text style={styles.subtitle}>
          Seu horário foi reservado com sucesso.
        </Text>

        <Text style={styles.emailText}>
          Enviamos a confirmação do seu agendamento para o seu e-mail.
        </Text>

        {/* ====================================================== */}
        {/* RESUMO */}
        {/* ====================================================== */}

        <View style={styles.card}>
          {/* ESTABELECIMENTO */}

          {companyName ? (
            <View style={styles.item}>
              <Text style={styles.label}>Estabelecimento</Text>

              <Text style={styles.value}>{companyName}</Text>
            </View>
          ) : null}

          {/* UNIDADE */}

          {branchName ? (
            <View style={styles.item}>
              <Text style={styles.label}>Unidade</Text>

              <Text style={styles.value}>{branchName}</Text>
            </View>
          ) : null}

          {/* SERVIÇO */}

          {serviceNames ? (
            <View style={styles.item}>
              <Text style={styles.label}>Serviço</Text>

              <Text style={styles.value}>{serviceNames}</Text>
            </View>
          ) : null}

          {/* PROFISSIONAL */}

          {professionalName ? (
            <View style={styles.item}>
              <Text style={styles.label}>Profissional</Text>

              <Text style={styles.value}>{professionalName}</Text>
            </View>
          ) : null}
        </View>

        {/* ====================================================== */}
        {/* DATA E HORÁRIO */}
        {/* ====================================================== */}

        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Data e horário</Text>

          <Text style={styles.date}>{formatDate(date)}</Text>

          <Text style={styles.time}>
            {formatTime(startTime)}
            {" - "}
            {formatTime(endTime)}
          </Text>
        </View>

        {/* ====================================================== */}
        {/* MENSAGEM */}
        {/* ====================================================== */}

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>✨</Text>

          <Text style={styles.infoText}>
            Tudo certo! Agora é só comparecer no horário marcado.
          </Text>
        </View>
      </View>

      {/* ======================================================== */}
      {/* FOOTER */}
      {/* ======================================================== */}

      <View style={styles.footer}>
        <Pressable onPress={handleGoHome} style={styles.button}>
          <Text style={styles.buttonText}>Voltar para o início</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },

  // ==========================================================
  // SUCCESS
  // ==========================================================

  successCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,

    alignSelf: "center",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F8E6F0",

    marginBottom: 24,
  },

  check: {
    fontSize: 48,
    fontWeight: "700",
    color: "#B55A91",

    lineHeight: 54,
  },

  // ==========================================================
  // TEXTOS
  // ==========================================================

  title: {
    textAlign: "center",

    fontSize: 28,
    fontWeight: "800",

    color: "#111827",

    marginBottom: 8,
  },

  subtitle: {
    textAlign: "center",

    fontSize: 16,
    fontWeight: "600",

    color: "#374151",

    marginBottom: 8,
  },

  emailText: {
    textAlign: "center",

    fontSize: 14,
    lineHeight: 21,

    color: "#6B7280",

    paddingHorizontal: 20,

    marginBottom: 30,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    backgroundColor: "#F9FAFB",

    borderRadius: 18,

    padding: 20,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: "#F1F1F1",
  },

  item: {
    marginBottom: 16,
  },

  itemLast: {
    marginBottom: 0,
  },

  label: {
    fontSize: 12,

    color: "#9CA3AF",

    marginBottom: 5,
  },

  value: {
    fontSize: 15,

    fontWeight: "700",

    color: "#111827",

    lineHeight: 21,
  },

  // ==========================================================
  // DATE CARD
  // ==========================================================

  dateCard: {
    backgroundColor: "#F8E6F0",

    borderRadius: 18,

    paddingVertical: 22,
    paddingHorizontal: 20,

    alignItems: "center",

    marginBottom: 16,
  },

  dateLabel: {
    fontSize: 12,

    color: "#9C6A86",

    marginBottom: 6,
  },

  date: {
    fontSize: 25,

    fontWeight: "800",

    color: "#B55A91",

    marginBottom: 5,
  },

  time: {
    fontSize: 18,

    fontWeight: "700",

    color: "#111827",
  },

  // ==========================================================
  // INFO
  // ==========================================================

  infoBox: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#FFF7FB",

    borderRadius: 14,

    padding: 16,

    borderWidth: 1,

    borderColor: "#F1D6E5",
  },

  infoIcon: {
    fontSize: 20,

    marginRight: 10,
  },

  infoText: {
    flex: 1,

    fontSize: 13,

    lineHeight: 19,

    color: "#6B7280",
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    paddingHorizontal: 24,

    paddingTop: 16,

    paddingBottom: 24,

    borderTopWidth: 1,

    borderColor: "#F3F4F6",

    backgroundColor: "#FFFFFF",
  },

  button: {
    height: 54,

    borderRadius: 14,

    backgroundColor: "#111827",

    alignItems: "center",

    justifyContent: "center",
  },

  buttonText: {
    fontSize: 16,

    fontWeight: "700",

    color: "#FFFFFF",
  },
});
