import { ReactNode, useEffect } from "react";

import { useRouter, useSegments } from "expo-router";

import { useAuth } from "./auth-context";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isLoading, companyRole } = useAuth();

  useEffect(() => {
    // Aguarda a restauração da sessão.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    const isDashboardRoute = segments.includes("dashboard");

    const isOwnerOrAdmin = companyRole === "OWNER" || companyRole === "ADMIN";

    /*
     * 1. USUÁRIO NÃO AUTENTICADO
     *
     * Só pode permanecer nas rotas públicas
     * de autenticação.
     */
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/login");
      }

      return;
    }

    /*
     * 2. OWNER E ADMIN
     *
     * Devem acessar o painel administrativo.
     * Isso também corrige o caso em que o usuário
     * cai na tela inicial do cliente após o login.
     */
    if (isOwnerOrAdmin) {
      if (!isDashboardRoute) {
        router.replace("/dashboard");
      }

      return;
    }

    /*
     * 3. PROFISSIONAL
     *
     * Não deve permanecer na tela de login
     * depois de autenticado.
     */
    if (companyRole === "PROFESSIONAL") {
      if (inAuthGroup) {
        router.replace("/");
      }

      return;
    }

    /*
     * 4. CLIENTE OU USUÁRIO SEM EMPRESA
     *
     * Redireciona para a área do cliente
     * quando estiver na área de autenticação.
     */
    if (inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, companyRole, segments, router]);

  /*
   * Evita renderizar as rotas antes de
   * terminar a restauração da sessão.
   */
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}
