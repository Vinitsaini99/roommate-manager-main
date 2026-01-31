import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/api/api";
import { useData } from "./DataContext";

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

  const { tenants } = useData();

  /* ================= RESTORE USER ================= */
  useEffect(() => {
    const savedUser = localStorage.getItem("rentease_user");
    const token = localStorage.getItem("ACCESS_TOKEN");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }

    setIsInitialized(true);
  }, []);

  /* ================= LOGIN ================= */
  const login = async (identifier: string, password: string): Promise<boolean> => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");

    /* ===== ADMIN LOGIN ===== */
    if (
      identifier === "admin" ||
      identifier === "admin@pg.com" ||
      identifier === "albenuspeter"
    ) {
      try {
        const res = await api.post("/login/", {
          username: identifier,
          password,
        });

        if (!res.data?.access) return false;

        localStorage.setItem("ACCESS_TOKEN", res.data.access);

        const adminUser: User = {
          email: identifier,
          role: "admin",
        };

        localStorage.setItem("rentease_user", JSON.stringify(adminUser));
        setUser(adminUser);
        // 🔔 Let DataContext know token is ready (same-tab)
        window.dispatchEvent(new Event("rentease:auth-changed"));
        return true;
      } catch {
        return false;
      }
    }

    /* ===== TENANT LOGIN ===== */
    const COMMON_TENANT_PASSWORD = "tenant123";

    const tenant = tenants.find(
      (t) => t.email === identifier && password === COMMON_TENANT_PASSWORD
    );

    if (!tenant) return false;

    // Use tenant ID as a simple token (tenants are not Django users)
    // Backend should validate tenant existence via tenant ID
    const tenantToken = `TENANT_${tenant.id}_${Date.now()}`;
    localStorage.setItem("ACCESS_TOKEN", tenantToken);
    localStorage.setItem("TENANT_ID", tenant.id);

    const tenantUser: User = {
      email: tenant.email,
      role: "tenant",
      tenantId: Number(tenant.id),
    };

    localStorage.setItem("rentease_user", JSON.stringify(tenantUser));
    setUser(tenantUser);
    // 🔔 Let DataContext know token is ready (same-tab)
    window.dispatchEvent(new Event("rentease:auth-changed"));

    return true;
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    setUser(null);
    localStorage.clear();
    window.dispatchEvent(new Event("rentease:auth-changed"));
  };

  const isAuthenticated = !!user && !!localStorage.getItem("ACCESS_TOKEN");

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
