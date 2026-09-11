import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboard?: boolean;
}

export default function SafeScreen({
  children,
  style,
  keyboard = false,
}: SafeScreenProps) {
  const content = (
    <SafeAreaView edges={["top", "left", "right"]} style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );

  if (!keyboard) {
    return content;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {content}
    </KeyboardAvoidingView>
  );
}
