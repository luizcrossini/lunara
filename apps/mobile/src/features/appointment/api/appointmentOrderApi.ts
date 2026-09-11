import { baseApi } from "@/core/api/baseApi";

// ============================================================
// CREATE APPOINTMENT
// ============================================================

export interface CreateAppointmentItemPayload {
  professionalServiceId: string;

  startsAt: string;

  endsAt: string;
}

export interface CreateAppointmentOrderPayload {
  branchId: string;

  customerId: string;

  scheduledDate: string;

  source: string;

  notes?: string;

  items: CreateAppointmentItemPayload[];
}

// ============================================================
// APPOINTMENT TYPES
// ============================================================

export interface AppointmentProfessionalUser {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  photoUrl: string | null;
}

export interface AppointmentProfessional {
  id: string;

  userId: string;

  bio: string | null;

  specialties: string | null;

  instagram: string | null;

  website: string | null;

  active: boolean;

  user: AppointmentProfessionalUser;
}

export interface AppointmentService {
  id: string;

  name: string;

  description?: string | null;

  durationMinutes: number;

  active: boolean;
}

export interface AppointmentProfessionalService {
  id: string;

  professionalId: string;

  serviceId: string;

  price: string;

  active: boolean;

  professional: AppointmentProfessional;

  service: AppointmentService;
}

export interface AppointmentItem {
  id: string;

  professionalServiceId: string;

  startsAt: string;

  endsAt: string;

  durationMinutes: number;

  price: string;

  status: string;

  sortOrder: number;

  professionalService: AppointmentProfessionalService;
}

export interface AppointmentBranch {
  id: string;

  name: string;

  companyId: string;

  phone?: string | null;

  address?: string | null;
}

export interface AppointmentCustomerUser {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  photoUrl?: string | null;
}

export interface AppointmentCustomer {
  id: string;

  userId: string;

  user: AppointmentCustomerUser;
}

// ============================================================
// APPOINTMENT
// ============================================================

export interface AppointmentOrder {
  id: string;

  branchId: string;

  customerId: string;

  scheduledDate: string;

  status: string;

  source: string;

  notes: string | null;

  cancelReason: string | null;

  cancelledAt: string | null;

  completedAt: string | null;

  totalDurationMinutes: number;

  totalPrice: string;

  createdAt: string;

  updatedAt: string;

  branch: AppointmentBranch;

  customer: AppointmentCustomer;

  items: AppointmentItem[];
}

// ============================================================
// PAGINATION
// ============================================================

export interface AppointmentOrdersResponse {
  items: AppointmentOrder[];

  total: number;

  page: number;

  limit: number;
}

// ============================================================
// GET CUSTOMER APPOINTMENTS
// ============================================================

export interface GetCustomerAppointmentsParams {
  customerId: string;

  page?: number;

  limit?: number;

  status?: string;
}

// ============================================================
// API
// ============================================================

export const appointmentOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================
    // CREATE
    // ========================================================

    createAppointmentOrder: builder.mutation<
      unknown,
      CreateAppointmentOrderPayload
    >({
      query: (body) => ({
        url: "/appointment-orders",

        method: "POST",

        body,
      }),
    }),

    // ========================================================
    // GET CUSTOMER APPOINTMENTS
    // ========================================================

    getCustomerAppointments: builder.query<
      AppointmentOrdersResponse,
      GetCustomerAppointmentsParams
    >({
      query: ({ customerId, page = 1, limit = 20, status }) => ({
        url: `/appointment-orders/customer/${customerId}`,

        method: "GET",

        params: {
          page,

          limit,

          ...(status
            ? {
                status,
              }
            : {}),
        },
      }),

      transformResponse: (response: any) => {
        /*
         * O backend retorna:
         *
         * {
         *   success: true,
         *   timestamp: "...",
         *   data: {
         *     items: [],
         *     total: 1,
         *     page: 1,
         *     limit: 20
         *   }
         * }
         *
         * Aqui retornamos somente "data"
         * para a tela.
         */

        return response.data;
      },
    }),
  }),
});

// ============================================================
// HOOKS
// ============================================================

export const {
  useCreateAppointmentOrderMutation,

  useGetCustomerAppointmentsQuery,
} = appointmentOrderApi;
