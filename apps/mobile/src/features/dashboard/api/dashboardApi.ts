import { baseApi } from "@/core/api/baseApi";

export interface DashboardAppointment {
  id: string;
  status: string;
  scheduledDate: string;
  totalPrice: number;

  branch: {
    id: string;
    name: string;
  };

  customer: {
    id: string;
    name: string;
    photoUrl?: string | null;
  };

  service: {
    id: string | null;
    name: string;
  };

  professional: {
    id: string | null;
    name: string;
  };

  startsAt: string;
  endsAt: string | null;
}

export interface DashboardOverview {
  company: {
    id: string;
    name: string;
  };

  summary: {
    revenue: number;
    appointments: number;
    customers: number;
    occupancy: number | null;
  };

  today: {
    appointments: number;
  };

  upcomingAppointments: DashboardAppointment[];
}

export const dashboardApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverview, void>({
      query: () => ({
        url: "/dashboard/overview",
        method: "GET",
      }),

      transformResponse: (response: any): DashboardOverview => {
        return response?.data ?? response;
      },
    }),
  }),
});

export const { useGetDashboardOverviewQuery } = dashboardApi;
