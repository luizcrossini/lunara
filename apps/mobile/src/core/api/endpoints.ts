export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },

  salons: "/salons",

  professionals: "/professionals",

  services: "/services",

  appointments: "/appointments",
} as const;