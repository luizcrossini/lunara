import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "@/features/auth/types/auth.types";

const ACCESS_TOKEN_KEY = "lunara_access_token";
const REFRESH_TOKEN_KEY = "lunara_refresh_token";
const USER_KEY = "lunara_user";
const COMPANY_ID_KEY = "lunara_company_id";
const COMPANY_ROLE_KEY = "lunara_company_role";
const BRANCH_ID_KEY = "lunara_branch_id";

export type CompanyRole = "OWNER" | "ADMIN" | "PROFESSIONAL" | "CUSTOMER";

export interface StoredAuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;

  /**
   * Empresa ativa do usuário.
   */
  companyId?: string;

  /**
   * Filial ativa do usuário.
   */
  branchId?: string;

  /**
   * Papel do usuário dentro da empresa.
   */
  companyRole?: CompanyRole;
}

/*
 * ============================================================
 * STORAGE
 * ============================================================
 *
 * WEB
 * ----
 * localStorage
 *
 * MOBILE
 * ------
 * expo-secure-store
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

/*
 * ============================================================
 * AUTH STORAGE
 * ============================================================
 */

export const authStorage = {
  /*
   * ----------------------------------------------------------
   * SALVAR SESSÃO
   * ----------------------------------------------------------
   */

  async saveSession(session: StoredAuthSession): Promise<void> {
    const operations: Promise<void>[] = [
      setItem(ACCESS_TOKEN_KEY, session.accessToken),
      setItem(REFRESH_TOKEN_KEY, session.refreshToken),
      setItem(USER_KEY, JSON.stringify(session.user)),
    ];

    if (session.companyId) {
      operations.push(setItem(COMPANY_ID_KEY, session.companyId));
    } else {
      operations.push(removeItem(COMPANY_ID_KEY));
    }

    if (session.branchId) {
      operations.push(setItem(BRANCH_ID_KEY, session.branchId));
    } else {
      operations.push(removeItem(BRANCH_ID_KEY));
    }

    if (session.companyRole) {
      operations.push(setItem(COMPANY_ROLE_KEY, session.companyRole));
    } else {
      operations.push(removeItem(COMPANY_ROLE_KEY));
    }

    await Promise.all(operations);
  },

  /*
   * ----------------------------------------------------------
   * RECUPERAR SESSÃO
   * ----------------------------------------------------------
   */

  async getSession(): Promise<StoredAuthSession | null> {
    try {
      const [
        accessToken,
        refreshToken,
        userJson,
        companyId,
        branchId,
        companyRole,
      ] = await Promise.all([
        getItem(ACCESS_TOKEN_KEY),
        getItem(REFRESH_TOKEN_KEY),
        getItem(USER_KEY),
        getItem(COMPANY_ID_KEY),
        getItem(BRANCH_ID_KEY),
        getItem(COMPANY_ROLE_KEY),
      ]);

      if (!accessToken || !refreshToken || !userJson) {
        return null;
      }

      const user = JSON.parse(userJson) as AuthUser;

      const normalizedCompanyRole = companyRole
        ? companyRole.toUpperCase()
        : undefined;

      let parsedCompanyRole: CompanyRole | undefined;

      if (
        normalizedCompanyRole === "OWNER" ||
        normalizedCompanyRole === "ADMIN" ||
        normalizedCompanyRole === "PROFESSIONAL" ||
        normalizedCompanyRole === "CUSTOMER"
      ) {
        parsedCompanyRole = normalizedCompanyRole;
      }

      return {
        user,
        accessToken,
        refreshToken,
        companyId: companyId ?? undefined,
        branchId: branchId ?? undefined,
        companyRole: parsedCompanyRole,
      };
    } catch (error) {
      console.error("AUTH STORAGE GET SESSION ERROR:", error);

      try {
        await this.clearSession();
      } catch (clearError) {
        console.error("AUTH STORAGE CLEAR SESSION ERROR:", clearError);
      }

      return null;
    }
  },

  /*
   * ----------------------------------------------------------
   * ACCESS TOKEN
   * ----------------------------------------------------------
   */

  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY);
  },

  /*
   * ----------------------------------------------------------
   * REFRESH TOKEN
   * ----------------------------------------------------------
   */

  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },

  /*
   * ----------------------------------------------------------
   * COMPANY ID
   * ----------------------------------------------------------
   */

  async getCompanyId(): Promise<string | null> {
    return getItem(COMPANY_ID_KEY);
  },

  /*
   * ----------------------------------------------------------
   * BRANCH ID
   * ----------------------------------------------------------
   */

  async getBranchId(): Promise<string | null> {
    return getItem(BRANCH_ID_KEY);
  },

  /*
   * ----------------------------------------------------------
   * COMPANY ROLE
   * ----------------------------------------------------------
   */

  async getCompanyRole(): Promise<CompanyRole | null> {
    const role = await getItem(COMPANY_ROLE_KEY);

    if (!role) {
      return null;
    }

    const normalizedRole = role.toUpperCase();

    if (
      normalizedRole === "OWNER" ||
      normalizedRole === "ADMIN" ||
      normalizedRole === "PROFESSIONAL" ||
      normalizedRole === "CUSTOMER"
    ) {
      return normalizedRole as CompanyRole;
    }

    return null;
  },

  /*
   * ----------------------------------------------------------
   * LIMPAR SESSÃO
   * ----------------------------------------------------------
   */

  async clearSession(): Promise<void> {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
      removeItem(COMPANY_ID_KEY),
      removeItem(BRANCH_ID_KEY),
      removeItem(COMPANY_ROLE_KEY),
    ]);
  },
};
