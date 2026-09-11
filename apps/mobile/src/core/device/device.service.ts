import * as Device from "expo-device";
import { Platform } from "react-native";

import type {
  DevicePlatform,
  LoginRequest,
} from "@/features/auth/types/auth.types";

function getPlatform(): DevicePlatform {
  if (Platform.OS === "ios") {
    return "IOS";
  }

  if (Platform.OS === "android") {
    return "ANDROID";
  }

  return "WEB";
}

export async function getDeviceLoginData(): Promise<
  Omit<LoginRequest, "email" | "password">
> {
  return {
    platform: getPlatform(),

    deviceIdentifier: Device.osInternalBuildId ?? `${Platform.OS}-web-device`,

    name: Device.deviceName ?? undefined,

    model: Device.modelName ?? undefined,

    manufacturer: Device.manufacturer ?? undefined,

    osVersion: Device.osVersion ?? undefined,

    appVersion: undefined,

    locale: undefined,

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
