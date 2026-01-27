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
  tenantId?: number; // ✅ tenant ke liye
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

  /* ===================== RESTORE USER ON REFRESH ===================== */
  useEffect(() => {
    const savedUser = localStorage.getItem("rentease_user");
    const token = localStorage.getItem("ACCESS_TOKEN");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        console.log("✅ User restored from localStorage");
      } catch {
        localStorage.removeItem("rentease_user");
        localStorage.removeItem("ACCESS_TOKEN");
      }
    }

    setIsInitialized(true);
  }, []);

  /* ===================== LOGIN ===================== */
  const login = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      // clear old data
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");

      /* ================= ADMIN LOGIN (BACKEND) ================= */
      if (identifier.toLowerCase() === "admin" || identifier === "admin@pg.com" || identifier === "albenuspeter") {
        try {
          console.log("🔐 Attempting admin login with:", identifier);
          const res = await api.post("/login/", {
            username: identifier,
            password,
          });

          if (!res.data?.access) {
            console.error("❌ No access token in response");
            return false;
          }

          localStorage.setItem("ACCESS_TOKEN", res.data.access);
          if (res.data.refresh) {
            localStorage.setItem("REFRESH_TOKEN", res.data.refresh);
          }

          const adminUser: User = {
            email: identifier,
            role: "admin",
          };

          localStorage.setItem("rentease_user", JSON.stringify(adminUser));
          setUser(adminUser);
          console.log("✅ Admin login successful");
          return true;
        } catch (error) {
          console.error("❌ Admin login API error:", error);
          return false;
        }
      }

      /* ================= TENANT LOGIN ================= */
      try {
        console.log("🔐 Attempting tenant login with:", identifier);
        
        // For tenants, accept both email and username formats
        if (!identifier || identifier.trim() === "") {
          console.warn("❌ Username/Email cannot be empty");
          return false;
        }

        const tenantUser: User = {
          email: identifier,
          role: "tenant",
          tenantId: 0, // Will be fetched later if needed
        };

        // Set fake token for frontend routing
        localStorage.setItem("ACCESS_TOKEN", "TENANT_LOGIN");
        localStorage.setItem(
          "rentease_user",
          JSON.stringify(tenantUser)
        );

        setUser(tenantUser);
        console.log("✅ Tenant login successful:", tenantUser);
        return true;
      } catch (error: any) {
        console.error("❌ Tenant login error:", error);
        return false;
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      return false;
    }
  };

  /* ===================== LOGOUT ===================== */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    localStorage.removeItem("rentease_user");
  };

  const isAuthenticated =
    !!user && !!localStorage.getItem("ACCESS_TOKEN");

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

/* ===================== HOOK ===================== */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
