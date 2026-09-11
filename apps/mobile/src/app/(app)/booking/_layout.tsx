import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="establishment" />

      <Stack.Screen name="branch" />

      <Stack.Screen name="service" />

      <Stack.Screen name="professional" />

      <Stack.Screen name="datetime" />

      <Stack.Screen name="confirmation" />

      <Stack.Screen
        name="success"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}