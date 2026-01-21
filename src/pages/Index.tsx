import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return;
    }

    if (user.role === "admin") {
      if (location.pathname !== "/admin") {
        navigate("/admin", { replace: true });
      }
    } else {
      if (location.pathname !== "/tenant") {
        navigate("/tenant", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  return null;
}
