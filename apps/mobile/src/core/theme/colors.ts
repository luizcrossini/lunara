export const colors = {
  primary: "#F472B6",
  primaryDark: "#EC4899",

  secondary: "#C084FC",

  accent: "#9333EA",
  accentDark: "#7E22CE",

  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  white: "#FFFFFF",
  black: "#000000",

  background: "#FFFFFF",
  backgroundSecondary: "#FAFAFA",

  border: "#E5E7EB",

  text: {
    primary: "#111827",
    secondary: "#6B7280",
    disabled: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
} as const;

export type Colors = typeof colors;