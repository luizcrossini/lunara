import { View, Text, StyleSheet } from "react-native";

export default function OwnerServices() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Serviços</Text>

      <Text style={styles.subtitle}>
        Gerencie os serviços oferecidos pelo salão.
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