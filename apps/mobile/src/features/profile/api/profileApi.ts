import { baseApi } from "@/core/api/baseApi";

/* ============================================================
   TIPOS
============================================================ */

export interface ProfileUser {
  id: string;

  name: string;

  email: string;

  phone?: string | null;

  photoUrl?: string | null;

  birthDate?: string | null;

  gender?: string | null;

  status?: string;

  emailVerified?: boolean;

  phoneVerified?: boolean;
}

export interface CustomerProfile {
  id: string;

  userId?: string;

  observations?: string | null;

  allergies?: string | null;

  preferences?: string | null;

  instagram?: string | null;

  photoUrl?: string | null;

  user?: ProfileUser;
}

export interface UpdateProfilePayload {
  name: string;

  phone?: string;

  birthDate?: string;

  gender?: string;

  observations?: string;

  allergies?: string;

  preferences?: string;

  instagram?: string;
}

/* ============================================================
   RESPONSE
============================================================ */

function extractCustomer(response: any): CustomerProfile | null {
  if (!response) {
    return null;
  }

  if (response?.data?.id) {
    return response.data;
  }

  if (response?.id) {
    return response;
  }

  if (Array.isArray(response)) {
    return response[0] ?? null;
  }

  if (Array.isArray(response?.data)) {
    return response.data[0] ?? null;
  }

  if (Array.isArray(response?.items)) {
    return response.items[0] ?? null;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items[0] ?? null;
  }

  return null;
}

/* ============================================================
   API
============================================================ */

export const profileApi = baseApi.injectEndpoints({
  overrideExisting: false,

  endpoints: (builder) => ({
    /*
     * Busca o cliente pelo e-mail do usuário autenticado.
     */
    getMyProfile: builder.query<CustomerProfile | null, string>({
      query: (email) => ({
        url: "/customers",

        method: "GET",

        params: {
          search: email,

          page: 1,

          limit: 100,
        },
      }),

      transformResponse: (response: any): CustomerProfile | null => {
        return extractCustomer(response);
      },

      providesTags: ["Profile"],
    }),

    /*
     * Atualiza os dados do cliente.
     *
     * ATENÇÃO:
     * Se sua API usa outra rota, altere somente
     * o "url" abaixo.
     */
    updateMyProfile: builder.mutation<
      CustomerProfile,
      {
        customerId: string;

        data: UpdateProfilePayload;
      }
    >({
      query: ({ customerId, data }) => ({
        url: `/customers/${customerId}`,

        method: "PATCH",

        body: data,
      }),

      transformResponse: (response: any): CustomerProfile => {
        return response?.data ?? response;
      },

      invalidatesTags: ["Profile"],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = profileApi;
