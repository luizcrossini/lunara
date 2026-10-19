import axios from "axios";

import { authStorage } from "@/core/auth/auth-storage.service";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const [token, companyId] = await Promise.all([
      authStorage.getAccessToken(),
      authStorage.getCompanyId(),
    ]);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    if (companyId) {
      config.headers["X-Company-Id"] = companyId;
    } else {
      delete config.headers["X-Company-Id"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);
