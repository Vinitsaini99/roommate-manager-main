import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRooms from "./pages/admin/Rooms";
import AdminPayments from "./pages/admin/Payments";
import AdminDocuments from "./pages/admin/Documents";
import AdminReports from "./pages/admin/Reports";
import AdminTenantHistory from "./pages/admin/TenantHistory";
import AdminSettings from "./pages/admin/Settings";

// Tenant Pages
import TenantLayout from "./components/layout/TenantLayout";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantPayments from "./pages/tenant/TenantPayments";
import TenantDocuments from "./pages/tenant/TenantDocuments";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'admin' | 'tenant' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/tenant'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="documents" element={<AdminDocuments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="history" element={<AdminTenantHistory />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Tenant Routes */}
      <Route path="/tenant" element={
        <ProtectedRoute role="tenant">
          <TenantLayout />
        </ProtectedRoute>
      }>
        <Route index element={<TenantDashboard />} />
        <Route path="payments" element={<TenantPayments />} />
        <Route path="documents" element={<TenantDocuments />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
