import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { authStorage } from "@/core/auth/auth-storage.service";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const session = await authStorage.getSession();

  const accessToken = session?.accessToken;

  const requestArgs: FetchArgs =
    typeof args === "string"
      ? {
          url: args,
        }
      : args;

  const headers = new Headers(requestArgs.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return rawBaseQuery(
    {
      ...requestArgs,
      headers,
    },
    api,
    extraOptions,
  );
};

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithAuth,

  tagTypes: [
    "Auth",
    "Company",
    "Branch",
    "Professional",
    "Service",
    "Appointment",
    "Customer",
    "Profile",
    "User"
  ],

  endpoints: () => ({}),
});
