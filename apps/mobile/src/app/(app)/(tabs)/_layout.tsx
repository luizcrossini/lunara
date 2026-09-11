import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  primary: "#B55A91",
  inactive: "#A59BA6",
  background: "#FFFFFF",
  border: "#EEE5EC",
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";

  const bottomSafeArea = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        /*
         * ============================================================
         * CORES
         * ============================================================
         */

        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,

        /*
         * ============================================================
         * TECLADO
         *
         * Quando o teclado abrir no celular,
         * a barra inferior desaparece.
         * ============================================================
         */

        tabBarHideOnKeyboard: true,

        /*
         * ============================================================
         * TAB BAR
         *
         * MOBILE:
         * Mostra normalmente.
         *
         * WEB:
         * Esconde completamente.
         *
         * No Web você já possui a sidebar.
         * ============================================================
         */

        tabBarStyle: isWeb
          ? {
              display: "none",
            }
          : {
              height: 62 + bottomSafeArea,

              paddingTop: 8,

              paddingBottom: bottomSafeArea,

              backgroundColor: COLORS.background,

              borderTopWidth: 1,
              borderTopColor: COLORS.border,

              elevation: 0,

              shadowOpacity: 0,
            },

        /*
         * ============================================================
         * LABEL
         * ============================================================
         */

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },

        /*
         * ============================================================
         * ÍCONE
         * ============================================================
         */

        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      {/* ============================================================
          INÍCIO
      ============================================================ */}

      <Tabs.Screen
        name="home"
        options={{
          title: "Início",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ============================================================
          AGENDAMENTOS
      ============================================================ */}

      <Tabs.Screen
        name="my-appointments"
        options={{
          title: "Agendamentos",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ============================================================
          PERFIL
      ============================================================ */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}