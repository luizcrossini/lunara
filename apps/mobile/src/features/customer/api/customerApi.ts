import { baseApi } from "@/core/api/baseApi";

export interface CreatePublicCustomerRequest {
  name: string;
  email?: string;
  phone: string;
}

export interface PublicCustomer {
  id: string;
  name: string;
  email?: string | null;
  phone: string | null;
}

export interface CreatePublicCustomerResponse {
  success: boolean;
  timestamp?: string;
  data: PublicCustomer;
}

/* ============================================================
   PERFIL DO CLIENTE
============================================================ */

export interface CustomerProfile {
  id: string;
  userId: string;

  observations?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
  photoUrl?: string | null;

  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    photoUrl?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    status?: string;
  };
}

export interface UpdateCustomerProfileRequest {
  observations?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
  photoUrl?: string | null;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ========================================================
       CRIAR / ENCONTRAR CLIENTE PÚBLICO
    ======================================================== */

    createOrFindPublicCustomer: builder.mutation<
      CreatePublicCustomerResponse,
      CreatePublicCustomerRequest
    >({
      query: (body) => ({
        url: "/customers/public",
        method: "POST",
        body,
      }),
    }),

    /* ========================================================
       BUSCAR CLIENTE
    ======================================================== */

    getCustomer: builder.query<CustomerProfile, string>({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: "GET",
      }),

      transformResponse: (response: any) => {
        return response?.data ?? response;
      },

      providesTags: (_result, _error, customerId) => [
        {
          type: "Customer",
          id: customerId,
        },
      ],
    }),

    /* ========================================================
       ATUALIZAR PERFIL
    ======================================================== */

    updateCustomer: builder.mutation<
      CustomerProfile,
      {
        customerId: string;
        data: UpdateCustomerProfileRequest;
      }
    >({
      query: ({ customerId, data }) => ({
        url: `/customers/${customerId}`,
        method: "PATCH",
        body: data,
      }),

      transformResponse: (response: any) => {
        return response?.data ?? response;
      },

      invalidatesTags: (_result, _error, { customerId }) => [
        {
          type: "Customer",
          id: customerId,
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useCreateOrFindPublicCustomerMutation,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
} = customerApi;
