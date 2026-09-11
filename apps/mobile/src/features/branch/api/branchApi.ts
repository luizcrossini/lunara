import { baseApi } from "@/core/api/baseApi";

export type BranchAddress = {
  id: string;
  zipCode: string;
  street: string;
  number: string | null;
  complement: string | null;
  district: string;
  city: string;
  state: string;
};

export type Branch = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: BranchAddress;
};

type BranchesResponse = {
  success: boolean;
  timestamp: string;
  data: Branch[];
};

export const branchApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getBranchesByCompany: builder.query<Branch[], string>({
      query: (companyId) => {
       
        return {
          url: `branches/company/${companyId}`,
          method: "GET",
        };
      },

      transformResponse: (response: BranchesResponse) => {
        

        return response.data;
      },

      transformErrorResponse: (response) => {

        return response;
      },
    }),
  }),
});

export const {
  useGetBranchesByCompanyQuery,
} = branchApi;