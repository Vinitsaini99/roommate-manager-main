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
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  /* ===================== RESTORE USER ON REFRESH ===================== */
  useEffect(() => {
    const savedUser = localStorage.getItem("rentease_user");
    const token = localStorage.getItem("ACCESS_TOKEN");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /* ===================== LOGIN ===================== */
  const login = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      // 🔹 clear old tokens
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");

      // 🔹 standard Django / SimpleJWT login
      const response = await api.post("/login/", {
        username: identifier,
        password,
      });

      // 🔴 token mandatory
      if (!response.data?.access) {
        console.error("❌ Access token missing:", response.data);
        return false;
      }

      // 🔹 save tokens
      localStorage.setItem("ACCESS_TOKEN", response.data.access);
      if (response.data.refresh) {
        localStorage.setItem("REFRESH_TOKEN", response.data.refresh);
      }

      // 🔹 build user object
      const loggedInUser: User = {
        email: response.data.email || identifier,
        role: (response.data.role || "admin") as UserRole,
      };

      // 🔹 save user
      localStorage.setItem(
        "rentease_user",
        JSON.stringify(loggedInUser)
      );
      setUser(loggedInUser);

      console.log("✅ Login successful:", loggedInUser);
      return true;
    } catch (error: any) {
      console.error("❌ Login failed:", error?.response?.data || error);
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
