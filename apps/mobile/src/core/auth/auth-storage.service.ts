import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "@/features/auth/types/auth.types";

const ACCESS_TOKEN_KEY = "lunara_access_token";
const REFRESH_TOKEN_KEY = "lunara_refresh_token";
const USER_KEY = "lunara_user";

export interface StoredAuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/*
 * WEB
 *
 * No navegador utilizamos localStorage.
 *
 * MOBILE
 *
 * Android e iOS utilizam expo-secure-store.
 */

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const authStorage = {
  async saveSession(session: StoredAuthSession): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, session.accessToken),
      setItem(REFRESH_TOKEN_KEY, session.refreshToken),
      setItem(USER_KEY, JSON.stringify(session.user)),
    ]);
  },

  async getSession(): Promise<StoredAuthSession | null> {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        getItem(ACCESS_TOKEN_KEY),
        getItem(REFRESH_TOKEN_KEY),
        getItem(USER_KEY),
      ]);

      /*
       * Se qualquer informação essencial
       * estiver ausente, não existe sessão válida.
       */

      if (!accessToken || !refreshToken || !userJson) {
        return null;
      }

      const user = JSON.parse(userJson) as AuthUser;

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("AUTH STORAGE GET SESSION ERROR:", error);

      /*
       * Caso os dados estejam corrompidos,
       * removemos a sessão.
       */

      try {
        await this.clearSession();
      } catch (clearError) {
        console.error("AUTH STORAGE CLEAR SESSION ERROR:", clearError);
      }

      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
    ]);
  },
};
