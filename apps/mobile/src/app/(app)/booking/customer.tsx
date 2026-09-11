import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { useState } from "react";

import { useCreateOrFindPublicCustomerMutation } from "@/features/customer/api/customerApi";

export default function BookingCustomerScreen() {
  const {
    companyId,
    companyName,

    branchId,
    branchName,

    serviceIds,
    serviceNames,

    professionalBranchId,

    professionalId,
    professionalName,

    professionalServiceIds,

    date,
    startTime,
    endTime,
  } = useLocalSearchParams<{
    companyId: string;
    companyName?: string;

    branchId: string;
    branchName?: string;

    serviceIds: string;
    serviceNames?: string;

    professionalBranchId?: string;

    professionalId: string;
    professionalName?: string;

    professionalServiceIds?: string;

    date: string;
    startTime: string;
    endTime: string;
  }>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [createOrFindCustomer, { isLoading }] =
    useCreateOrFindPublicCustomerMutation();

  async function handleContinue() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe seu nome completo.");

      return;
    }

    if (!phone.trim()) {
      Alert.alert("Telefone obrigatório", "Informe seu telefone.");

      return;
    }

    try {


      const response = await createOrFindCustomer({
        name: name.trim(),

        email: email.trim(),

        phone: phone.trim(),
      }).unwrap();

      /*
      Ajuste este ponto caso sua API tenha
      uma estrutura diferente.
      */

      const customerId = response?.data?.id ?? response?.id;


      if (!customerId) {
        Alert.alert("Erro", "Não foi possível identificar o cliente.");

        return;
      }

      router.push({
        pathname: "/booking/confirmation",

        params: {
          companyId: String(companyId),

          companyName: String(companyName ?? ""),

          branchId: String(branchId),

          branchName: String(branchName ?? ""),

          serviceIds: String(serviceIds),

          serviceNames: String(serviceNames ?? ""),

          professionalBranchId: String(professionalBranchId ?? ""),

          professionalId: String(professionalId),

          professionalName: String(professionalName ?? ""),

          professionalServiceIds: String(professionalServiceIds ?? ""),

          /*
          AGORA VEM DA API
          */

          customerId: String(customerId),

          customerName: name.trim(),

          customerEmail: email.trim(),

          customerPhone: phone.trim(),

          date: String(date),

          startTime: String(startTime),

          endTime: String(endTime),
        },
      });
    } catch (error) {
      console.error("ERROR CREATE/FIND CUSTOMER:", error);

      Alert.alert(
        "Erro",
        "Não foi possível continuar com o agendamento. Tente novamente.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isLoading}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Seus dados</Text>

          <Text style={styles.subtitle}>
            Precisamos de algumas informações para seu agendamento.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Profissional</Text>

          <Text style={styles.summaryValue}>{professionalName}</Text>

          <Text style={styles.summaryLabel}>Serviços</Text>

          <Text style={styles.summaryValue}>{serviceNames}</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nome completo *</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            editable={!isLoading}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Telefone *</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            style={styles.input}
            editable={!isLoading}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>E-mail</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          disabled={isLoading}
          style={[
            styles.continueButton,
            isLoading && styles.continueButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continuar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 24,
    color: "#111827",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
    maxWidth: 280,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  summaryCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    marginBottom: 28,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    marginTop: 6,
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },

  continueButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonDisabled: {
    opacity: 0.6,
  },

  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
