import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // console.log("🔐 Login attempt with:", { username, password });
      const success = await login(username, password);

      if (success) {
        const user = JSON.parse(localStorage.getItem("rentease_user") || "{}");
        // console.log("✅ Login successful, user role:", user.role);

        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/tenant");
        }
        toast({
          title: "स्वागत है! (Welcome!)",
          description: "You have successfully logged in.",
        });
      } else {
        console.log("❌ Login failed");
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: "admin" | "tenant") => {
    if (role === "admin") {
      setUsername("peter");
      setPassword("Papp@123");
    } else {
      setUsername("tenant@example.com");
      setPassword("tenant123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">RentEase</span>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} // ✅ correct
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">
              Demo Credentials
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => fillDemoCredentials("admin")}
              >
                Admin Login
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => fillDemoCredentials("tenant")}
              >
                Tenant Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
