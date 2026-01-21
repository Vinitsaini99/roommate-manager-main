import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/api/api";

export type UserRole = "admin" | "tenant";

export interface User {
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // refresh ke baad restore
  useEffect(() => {
    const savedUser = localStorage.getItem("rentease_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Login attempt with:", { username, password: "***" });

      // Clear any existing tokens so the login request isn't sent with an
      // invalid Authorization header (this caused `token_not_valid` 401s).
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");

      let response = null;
      let error = null;

      // Try Format 1: username और password
      try {
        console.log("📤 Trying format 1: username/password");
        response = await api.post("/login/", {
          username,
          password,
        });
        console.log("✅ Format 1 worked!");
      } catch (e1: any) {
        console.log("❌ Format 1 failed:", e1.response?.status, e1.response?.data);
        error = e1;

        // Try Format 2: email और password
        try {
          console.log("📤 Trying format 2: email/password");
          response = await api.post("/login/", {
            email: username,
            password,
          });
          console.log("✅ Format 2 worked!");
        } catch (e2: any) {
          console.log("❌ Format 2 failed:", e2.response?.status, e2.response?.data);
          error = e2;

          // Try Format 3: username और pwd
          try {
            console.log("📤 Trying format 3: username/pwd");
            response = await api.post("/login/", {
              username,
              pwd: password,
            });
            console.log("✅ Format 3 worked!");
          } catch (e3: any) {
            console.log("❌ Format 3 failed:", e3.response?.status, e3.response?.data);
            error = e3;
          }
        }
      }

      // अगर कोई भी काम नहीं किया
      if (!response) {
        console.error("❌ सभी formats fail हो गए");
        console.error("Last error:", error.response?.data);
        return false;
      }

      console.log("✅ Login response:", response.data);

      // Extract token (multiple possible names)
      const token =
        response.data.token ||
        response.data.access ||
        response.data.access_token ||
        response.data.authToken;

      if (!token) {
        console.error("❌ No token in response:", response.data);
        return false;
      }

      // Save token
      localStorage.setItem("ACCESS_TOKEN", token);

      // Create user object
      const user: User = {
        email: response.data.email || response.data.username || username,
        role: (response.data.role || response.data.user_type || "admin") as UserRole,
      };

      // Save user
      localStorage.setItem("rentease_user", JSON.stringify(user));
      setUser(user);

      console.log("✅ Login successful:", user);
      return true;
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    localStorage.removeItem("rentease_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
