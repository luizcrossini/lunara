import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authStorage } from "./auth-storage.service";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextData = {
  user: AuthUser | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  signIn: (user: AuthUser) => void;

  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await authStorage.getSession();

        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  function signIn(userData: AuthUser) {
    setUser(userData);
  }

  async function signOut() {
    await authStorage.clearSession();

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,

        isAuthenticated: !!user,

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
