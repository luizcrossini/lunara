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

export interface CustomerBranch {
  branchId: string;
  branchName: string;
  companyId: string;
  firstVisitAt?: string | null;
  lastVisitAt?: string | null;
  totalVisits: number;
  isVip?: boolean;
  notes?: string | null;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  status?: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  observations?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
  photoUrl?: string | null;
  user?: CustomerUser;
  branches?: CustomerBranch[];
  totalVisits?: number;
  firstVisitAt?: string | null;
  lastVisitAt?: string | null;
  lastAppointment?: {
    id: string;
    scheduledDate?: string | null;
    status?: string;
    branchId?: string;
    branch?: {
      id: string;
      name: string;
    };
  } | null;
  companyId?: string;
}

export interface UpdateCustomerProfileRequest {
  name?: string;
  phone?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  observations?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
  photoUrl?: string | null;
}

export interface GetCustomersRequest {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  sort?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

export interface CustomerListResponse {
  items: CustomerProfile[];
  total: number;
  page: number;
  limit: number;
}

function unwrapResponse<T>(response: any): T {
  return response?.data ?? response;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrFindPublicCustomer: builder.mutation<
      CreatePublicCustomerResponse,
      CreatePublicCustomerRequest
    >({
      query: (body) => ({
        url: "/customers/public",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer"],
    }),

    getMyCustomer: builder.query<CustomerProfile, void>({
      query: () => ({
        url: "/customers/me",
        method: "GET",
      }),
      transformResponse: (response: any) =>
        unwrapResponse<CustomerProfile>(response),
      providesTags: ["Customer"],
    }),

    
    getCustomers: builder.query<
      CustomerListResponse,
      GetCustomersRequest | void
    >({
      query: (params = {}) => ({
        url: "/customers",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.search ? { search: params.search } : {}),
          ...(params.branchId ? { branchId: params.branchId } : {}),
          ...(params.sort ? { sort: params.sort } : {}),
          ...(params.order ? { order: params.order } : {}),
        },
      }),
      transformResponse: (response: any): CustomerListResponse => {
        const data = unwrapResponse<any>(response);

        return {
          items: Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [],
          total: Number(data?.total ?? 0),
          page: Number(data?.page ?? 1),
          limit: Number(data?.limit ?? 20),
        };
      },
      providesTags: (result) => [
        "Customer",
        ...(result?.items ?? []).map((customer) => ({
          type: "Customer" as const,
          id: customer.id,
        })),
      ],
    }),

    getCustomer: builder.query<CustomerProfile, string>({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: "GET",
      }),
      transformResponse: (response: any) =>
        unwrapResponse<CustomerProfile>(response),
      providesTags: (_result, _error, customerId) => [
        { type: "Customer", id: customerId },
      ],
    }),

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
      transformResponse: (response: any) =>
        unwrapResponse<CustomerProfile>(response),
      invalidatesTags: (_result, _error, { customerId }) => [
        "Customer",
        { type: "Customer", id: customerId },
      ],
    }),

    deleteCustomer: builder.mutation<unknown, string>({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, customerId) => [
        "Customer",
        { type: "Customer", id: customerId },
      ],
    }),

    restoreCustomer: builder.mutation<CustomerProfile, string>({
      query: (customerId) => ({
        url: `/customers/${customerId}/restore`,
        method: "PATCH",
      }),
      transformResponse: (response: any) =>
        unwrapResponse<CustomerProfile>(response),
      invalidatesTags: (_result, _error, customerId) => [
        "Customer",
        { type: "Customer", id: customerId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrFindPublicCustomerMutation,
  useGetMyCustomerQuery,
  useGetCustomersQuery,
  useLazyGetCustomersQuery,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRestoreCustomerMutation,
} = customerApi;
