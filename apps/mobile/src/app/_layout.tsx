import { Stack } from "expo-router";

import { StoreProvider } from "@/app/providers/StoreProvider";

import { AuthProvider } from "@/core/auth/auth-context";
import { AuthGuard } from "@/core/auth/auth-guard";

export default function RootLayout() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AuthGuard>
      </AuthProvider>
    </StoreProvider>
  );
}
