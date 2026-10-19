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
  address: BranchAddress | null;
};

type BranchesResponse = {
  success: boolean;
  timestamp?: string;
  data: Branch[];
};

export const branchApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    /**
     * ============================================================
     * CLIENTE / AGENDAMENTO PÚBLICO
     * ============================================================
     *
     * Busca as unidades de uma empresa.
     *
     * IMPORTANTE:
     * Não utilizar /branches aqui.
     * /branches é o endpoint administrativo protegido
     * pelo CompanyGuard.
     */
    getBranchesByCompany: builder.query<Branch[], string>({
      query: (companyId) => ({
        url: `/branches/public/company/${companyId}`,
        method: "GET",
      }),

      transformResponse: (response: BranchesResponse | Branch[]) => {
        if (Array.isArray(response)) {
          return response;
        }

        return response?.data ?? [];
      },

      transformErrorResponse: (response) => response,
    }),
  }),
});

export const { useGetBranchesByCompanyQuery } = branchApi;
