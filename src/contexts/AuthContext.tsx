import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/api/api";

export type UserRole = "admin" | "tenant";

export interface User {
  email: string;
  role: UserRole;
  tenantId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /* 🔁 RESTORE ON REFRESH */
  useEffect(() => {
    const savedUser = localStorage.getItem("rentease_user");
    const token = localStorage.getItem("ACCESS_TOKEN");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("rentease_user");
      }
    }
    setIsInitialized(true);
  }, []);

  /* 🔐 LOGIN */
  const login = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");

      /* ✅ ADMIN LOGIN (BACKEND) */
      if (identifier === "admin@pg.com") {
        const res = await api.post("/login/", {
          username: identifier,
          password,
        });

        if (!res.data?.access) return false;

        localStorage.setItem("ACCESS_TOKEN", res.data.access);
        localStorage.setItem("REFRESH_TOKEN", res.data.refresh);

        const adminUser: User = {
          email: identifier,
          role: "admin",
        };

        localStorage.setItem("rentease_user", JSON.stringify(adminUser));
        setUser(adminUser);
        return true;
      }

      /* ✅ TENANT LOGIN (FRONTEND ONLY) */
      if (password === "newuser123") {
        const res = await api.get("/tenants/");
        const tenant = res.data.find(
          (t: any) => t.email === identifier
        );

        if (!tenant) return false;

        const tenantUser: User = {
          email: tenant.email,
          role: "tenant",
          tenantId: Number(tenant.id),
        };

        localStorage.setItem("ACCESS_TOKEN", "TENANT_LOGIN");
        localStorage.setItem("rentease_user", JSON.stringify(tenantUser));
        setUser(tenantUser);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user && !!localStorage.getItem("ACCESS_TOKEN"),
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
