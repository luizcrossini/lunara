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
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    /**
     * USUÁRIO NÃO AUTENTICADO
     *
     * Se não estiver logado e não estiver na área de autenticação,
     * manda para o login.
     */
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
      return;
    }

    /**
     * USUÁRIO AUTENTICADO DENTRO DA ÁREA DE LOGIN
     *
     * Depois do login, decide para onde ir de acordo com o perfil.
     */
    if (isAuthenticated && inAuthGroup) {
      if (companyRole === "OWNER" || companyRole === "ADMIN") {
        router.replace("/dashboard");
        return;
      }

      if (companyRole === "PROFESSIONAL") {
        router.replace("/");
        return;
      }

      /**
       * CUSTOMER ou usuário sem empresa
       */
      router.replace("/");
      return;
    }
  }, [isAuthenticated, isLoading, companyRole, segments]);

  /**
   * Enquanto recupera o SecureStore/localStorage,
   * não renderiza as rotas para evitar redirecionamento prematuro.
   */
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}
