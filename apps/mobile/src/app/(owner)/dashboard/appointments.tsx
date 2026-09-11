import { View, Text, StyleSheet } from "react-native";

export default function OwnerAppointments() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendamentos</Text>

      <Text style={styles.subtitle}>
        Gerencie os agendamentos do salão.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#666666",
  },
});