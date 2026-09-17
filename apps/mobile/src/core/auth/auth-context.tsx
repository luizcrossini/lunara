import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  authStorage,
  CompanyRole,
  StoredAuthSession,
} from "./auth-storage.service";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextData = {
  user: AuthUser | null;

  companyId: string | null;

  companyRole: CompanyRole | null;

  isAuthenticated: boolean;

  isOwner: boolean;

  isLoading: boolean;

  signIn: (session: StoredAuthSession) => void;

  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  /**
   * RESTAURA A SESSÃO SALVA
   */
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await authStorage.getSession();

        if (!session) {
          return;
        }

        setUser(session.user);

        setCompanyId(session.companyId ?? null);

        setCompanyRole(session.companyRole ?? null);
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);

        setUser(null);
        setCompanyId(null);
        setCompanyRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * LOGIN
   *
   * O login já deve ter salvo a sessão no authStorage
   * antes de chamar o signIn.
   */
  function signIn(session: StoredAuthSession) {
    setUser(session.user);

    setCompanyId(session.companyId ?? null);

    setCompanyRole(session.companyRole ?? null);
  }

  /**
   * LOGOUT
   */
  async function signOut() {
    try {
      await authStorage.clearSession();
    } finally {
      setUser(null);

      setCompanyId(null);

      setCompanyRole(null);
    }
  }

  /**
   * OWNER
   */
  const isOwner = companyRole === "OWNER";

  /**
   * AUTENTICADO
   */
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,

        companyId,

        companyRole,

        isAuthenticated,

        isOwner,

        isLoading,

        signIn,

        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
