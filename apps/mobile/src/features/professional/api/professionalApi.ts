import { baseApi } from "@/core/api/baseApi";

export type ProfessionalUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
};

export type ProfessionalServiceBranch = {
  id: string;
  serviceId: string;
  branchId: string;
  price?: number | string | null;
  active?: boolean;
  service?: {
    id: string;
    name: string;
    durationMinutes?: number;
    active?: boolean;
  };
};

export type ProfessionalService = {
  id: string;
  professionalId?: string;

  /**
   * Compatibilidade com respostas antigas da API.
   * O modelo atual usa serviceBranch.
   */
  serviceId?: string;

  /**
   * Modelo atual:
   * ProfessionalService -> ServiceBranch -> Service
   */
  serviceBranchId?: string;

  serviceBranch?: ProfessionalServiceBranch;

  price?: number | string | null;
  active?: boolean;
  deletedAt?: string | null;
};

export type Professional = {
  id: string;
  userId: string;

  bio: string | null;
  specialties: string | null;
  instagram: string | null;
  website: string | null;

  active: boolean;

  user: ProfessionalUser;

  professionalServices: ProfessionalService[];
};

export type ProfessionalBranch = {
  id: string;
  professionalId: string;
  branchId: string;

  color: string | null;
  commissionPercentage: string | null;

  active: boolean;

  professional: Professional;
};

type ProfessionalsResponse = {
  success: boolean;
  timestamp?: string;

  data: {
    items: ProfessionalBranch[];
    total: number;
    page: number;
    limit: number;
  };
};

type GetProfessionalsParams = {
  companyId: string;
  branchId: string;
  serviceId: string;
};

export const professionalApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getPublicProfessionals: builder.query<
      ProfessionalBranch[],
      GetProfessionalsParams
    >({
      query: ({ companyId, branchId, serviceId }) => ({
        url: `professional-branches/public/company/${companyId}/branch/${branchId}/service/${serviceId}`,
        method: "GET",

        params: {
          page: 1,
          limit: 100,
        },
      }),

      transformResponse: (
        response: ProfessionalsResponse,
      ): ProfessionalBranch[] => {
        return response?.data?.items ?? [];
      },

      transformErrorResponse: (response) => {
        return response;
      },
    }),
  }),
});

export const { useGetPublicProfessionalsQuery } = professionalApi;
