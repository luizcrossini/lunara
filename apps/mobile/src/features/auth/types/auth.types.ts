export type DevicePlatform = "IOS" | "ANDROID" | "WEB";

export interface LoginRequest {
  email: string;
  password: string;

  platform: DevicePlatform;

  deviceIdentifier: string;

  name?: string;
  model?: string;
  manufacturer?: string;
  osVersion?: string;
  appVersion?: string;
  locale?: string;
  timezone?: string;
  pushToken?: string;
}

export interface AuthUser {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  photoUrl: string | null;

  birthDate: string | null;

  gender: string | null;

  status: string;

  emailVerified: boolean;

  phoneVerified: boolean;

  lastLoginAt: string | null;

  createdAt: string;

  updatedAt: string;

  deletedAt: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginData {
  user: AuthUser;

  jti: string;

  accessToken: string;

  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;

  timestamp: string;

  data: T;
}

export type LoginResponse = ApiResponse<LoginData>;
