import { baseApi } from "@/core/api/baseApi";

export type ServiceCategory = {
  id: string;
  name: string;
  icon: string | null;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  color: string | null;
  active: boolean;
  categoryId: string;
  category: ServiceCategory;
};

type ServicesResponse = {
  success: boolean;
  timestamp: string;
  data: {
    items: Service[];
    total: number;
    page: number;
    limit: number;
  };
};

type GetServicesByBranchParams = {
  companyId: string;
  branchId: string;
};

export const serviceApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getServicesByBranch: builder.query<Service[], GetServicesByBranchParams>({
      query: ({ companyId, branchId }) => ({
        url: `services/public/company/${companyId}/branch/${branchId}`,
        method: "GET",

        params: {
          page: 1,
          limit: 100,
          active: true,
        },
      }),

      transformResponse: (response: ServicesResponse) => {


        return response.data.items;
      },

      transformErrorResponse: (response) => {


        return response;
      },
    }),
  }),
});

export const { useGetServicesByBranchQuery } = serviceApi;
