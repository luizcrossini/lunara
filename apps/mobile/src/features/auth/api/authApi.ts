import { baseApi } from "@/core/api/baseApi";

export interface User {
  id: string;

  name?: string;

  email: string;

  phone?: string | null;

  avatarUrl?: string | null;

  birthDate?: string | null;

  gender?: string | null;

  status?: string;

  createdAt?: string;

  updatedAt?: string;
}

export interface UpdateProfileRequest {
  name?: string;

  phone?: string | null;

  birthDate?: string | null;

  gender?: string | null;

  avatarUrl?: string | null;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;

  timestamp: string;

  data: {
    message: string;
  };
}

interface ResetPasswordRequest {
  token: string;

  password: string;
}

interface ResetPasswordResponse {
  success: boolean;

  timestamp: string;

  data: {
    message: string;
  };
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    // ============================================================
    // LOGIN
    // ============================================================

    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",

        method: "POST",

        body,
      }),
    }),

    // ============================================================
    // USUÁRIO AUTENTICADO
    // ============================================================

    getMe: builder.query<User, void>({
      query: () => ({
        url: "/auth/me",

        method: "GET",
      }),

      providesTags: ["User"],
    }),

    // ============================================================
    // ATUALIZAR PERFIL
    // ============================================================

    updateMe: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/auth/me",

        method: "PATCH",

        body,
      }),

      invalidatesTags: ["User"],
    }),

    // ============================================================
    // FORGOT PASSWORD
    // ============================================================

    forgotPassword: builder.mutation<
      ForgotPasswordResponse,
      ForgotPasswordRequest
    >({
      query: (body) => ({
        url: "/auth/forgot-password",

        method: "POST",

        body,
      }),
    }),

    // ============================================================
    // RESET PASSWORD
    // ============================================================

    resetPassword: builder.mutation<
      ResetPasswordResponse,
      ResetPasswordRequest
    >({
      query: (body) => ({
        url: "/auth/reset-password",

        method: "POST",

        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,

  useGetMeQuery,

  useUpdateMeMutation,

  useForgotPasswordMutation,

  useResetPasswordMutation,
} = authApi;
