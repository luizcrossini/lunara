import { baseApi } from "@/core/api/baseApi";

export type AvailabilityResponse = {
  success: boolean;
  timestamp: string;
  data: {
    date: string;
    companyId: string;
    branchId: string;
    professionalId: string;
    serviceIds: string[];
    availableSlots: string[];
  };
};

export type GetAvailabilityParams = {
  companyId: string;
  branchId: string;
  professionalId: string;
  date: string;
  serviceIds: string[];
};

export const appointmentAvailabilityApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getPublicAvailability: builder.query<
      AvailabilityResponse["data"],
      GetAvailabilityParams
    >({
      query: ({ companyId, branchId, professionalId, date, serviceIds }) => ({
        url: `appointment-orders/public/company/${companyId}/branch/${branchId}/professional/${professionalId}/availability`,
        method: "GET",

        params: {
          date,
          serviceIds: serviceIds.join(","),
        },
      }),

      transformResponse: (response: AvailabilityResponse) => {
     

        return response.data;
      },

      transformErrorResponse: (response) => {
      
        return response;
      },
    }),
  }),
});

export const { useGetPublicAvailabilityQuery } = appointmentAvailabilityApi;
