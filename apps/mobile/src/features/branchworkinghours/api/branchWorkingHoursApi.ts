import { baseApi } from "@/core/api/baseApi";

export type Weekday =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface BranchWorkingHour {
  id: string;
  branchId: string;
  weekday: Weekday;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchWorkingHoursResponse {
  success?: boolean;
  timestamp?: string;
  data?: BranchWorkingHour[];
  items?: BranchWorkingHour[];
}

export interface CreateBranchWorkingHourRequest {
  branchId: string;
  weekday: Weekday;
  openTime: string;
  closeTime: string;
  sortOrder?: number;
  isOpen?: boolean;
}

export interface UpdateBranchWorkingHourRequest {
  id: string;
  body: Partial<CreateBranchWorkingHourRequest>;
}

function unwrap<T>(response: any): T {
  return response?.data ?? response;
}

export const branchWorkingHoursApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getBranchWorkingHours: builder.query<
      BranchWorkingHour[],
      {
        branchId: string;
      }
    >({
      query: ({ branchId }) => ({
        url: "/branch-working-hours",
        method: "GET",
        params: {
          branchId,
          page: 1,
          limit: 100,
        },
      }),

      transformResponse: (response: BranchWorkingHoursResponse | any) => {
        const data = unwrap<any>(response);

        if (Array.isArray(data)) {
          return data;
        }

        if (Array.isArray(data?.items)) {
          return data.items;
        }

        return [];
      },

      providesTags: (_result, _error, { branchId }) => [
        {
          type: "BranchWorkingHours" as const,
          id: branchId,
        },
      ],
    }),

    createBranchWorkingHour: builder.mutation<
      BranchWorkingHour,
      CreateBranchWorkingHourRequest
    >({
      query: (body) => ({
        url: "/branch-working-hours",
        method: "POST",
        body,
      }),

      transformResponse: (response: any) => unwrap<BranchWorkingHour>(response),

      invalidatesTags: (_result, _error, body) => [
        {
          type: "BranchWorkingHours" as const,
          id: body.branchId,
        },
      ],
    }),

    updateBranchWorkingHour: builder.mutation<
      BranchWorkingHour,
      UpdateBranchWorkingHourRequest
    >({
      query: ({ id, body }) => ({
        url: `/branch-working-hours/${id}`,
        method: "PATCH",
        body,
      }),

      transformResponse: (response: any) => unwrap<BranchWorkingHour>(response),

      invalidatesTags: ["BranchWorkingHours"],
    }),

    deleteBranchWorkingHour: builder.mutation<
      unknown,
      {
        id: string;
        branchId: string;
      }
    >({
      query: ({ id }) => ({
        url: `/branch-working-hours/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, { branchId }) => [
        {
          type: "BranchWorkingHours" as const,
          id: branchId,
        },
      ],
    }),
  }),
});

export const {
  useGetBranchWorkingHoursQuery,
  useCreateBranchWorkingHourMutation,
  useUpdateBranchWorkingHourMutation,
  useDeleteBranchWorkingHourMutation,
} = branchWorkingHoursApi;
