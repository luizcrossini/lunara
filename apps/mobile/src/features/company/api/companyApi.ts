import { baseApi } from "@/core/api/baseApi";

export type Company = {
  id: string;
  name: string;
  slug: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp?: string;
};

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanies: builder.query<Company[], void>({
      query: () => ({
        url: "/companies",
        method: "GET",
      }),

      transformResponse: (response: ApiResponse<Company[]>) => {
        return response.data;
      },
    }),
  }),
});

export const { useGetCompaniesQuery } = companyApi;