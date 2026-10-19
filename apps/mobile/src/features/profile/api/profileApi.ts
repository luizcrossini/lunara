import { baseApi } from "@/core/api/baseApi";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  photoUrl?: string | null;
  status?: string;
  createdAt?: string;

  customerId?: string | null;
  observations?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
}

export interface UpdateMyProfilePayload {
  name?: string;
  email?: string;
  phone?: string | null;
  birthDate?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  photoUrl?: string | null;
  notes?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  instagram?: string | null;
}

export const profileApi = baseApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (builder) => ({
    getMyProfile: builder.query<Profile, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),

      providesTags: ["Profile"],
    }),

    updateMyProfile: builder.mutation<Profile, UpdateMyProfilePayload>({
      query: (body) => ({
        url: "/auth/me",
        method: "PATCH",
        body,
      }),

      invalidatesTags: ["Profile"],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation } = profileApi;
