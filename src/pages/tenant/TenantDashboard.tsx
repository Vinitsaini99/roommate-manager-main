import React, { useEffect, useState } from "react";
import {
  User,
  Home,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

export default function TenantDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { tenants, rooms, payments } = useData();
  
  // Find current tenant by email
  const tenant = tenants.find(t => t.email === user?.email);
  const tenantRoom = rooms.find(r => r.tenants?.some(t => t.id === tenant?.id));
  const tenantPayments = payments.filter(p => p.tenant === tenant?.id);

  /* ================= LOADING & AUTHENTICATION CHECK ================= */
  if (!isAuthenticated || !user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="font-medium text-foreground">Please login to view dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">
          You need to be logged in to access this page
        </p>
      </div>
    );
  }

  /* ================= SAFETY CHECK ================= */
  if (!tenant || !tenantRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="font-medium text-foreground">Tenant data not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please contact admin for assistance
        </p>
      </div>
    );
  }

  /* ================= PAYMENTS CALC ================= */
  const paidPayments = tenantPayments.filter((p) => p.status === "paid");
  const pendingPayments = tenantPayments.filter((p) => p.status === "pending");

  const totalPaid = paidPayments.reduce(
    (sum, p) => sum + p.totalAmount,
    0
  );
  const totalPending = pendingPayments.reduce(
    (sum, p) => sum + p.totalAmount,
    0
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome, {tenant.firstName}!</h1>
        <p className="page-subtitle">
          View your room details and rental information
        </p>
      </div>

      {/* Personal Info */}
      <div className="stat-card">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {tenant.firstName.charAt(0)}
              {tenant.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {tenant.firstName} {tenant.lastName}
            </h2>
            <p className="text-muted-foreground text-sm">
              Room #{tenantRoom.roomId}
            </p>
            <Badge className="mt-2">
              {tenant.documentsVerified ? "Verified" : "Pending Verification"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card-gradient gradient-primary">
          <p className="text-sm text-primary-foreground/80">Monthly Rent</p>
          <p className="text-2xl font-bold text-primary-foreground">
            {formatCurrency(tenantRoom.rent)}
          </p>
        </div>

        <div className="stat-card-gradient gradient-success">
          <p className="text-sm text-success-foreground/80">Total Paid</p>
          <p className="text-2xl font-bold text-success-foreground">
            {formatCurrency(totalPaid)}
          </p>
        </div>

        <div className="stat-card-gradient gradient-warning">
          <p className="text-sm text-warning-foreground/80">Pending Amount</p>
          <p className="text-2xl font-bold text-warning-foreground">
            {formatCurrency(totalPending)}
          </p>
        </div>
      </div>

      {/* Room Details */}
      <div className="stat-card">
        <h2 className="font-semibold mb-4">Room Details</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Room Type</span>
            <Badge variant="outline">{tenantRoom.type} Bed</Badge>
          </div>
          <div className="flex justify-between">
            <span>AC</span>
            <Badge>{tenantRoom.isAC ? "AC" : "Non-AC"}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Join Date</span>
            <span>{formatDate(tenant.joinDate)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="stat-card">
        <h2 className="font-semibold mb-4">Recent Payments</h2>

        {tenantPayments.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.month} {p.year}
                  </td>
                  <td>{formatCurrency(p.totalAmount)}</td>
                  <td>
                    <span
                      className={cn(
                        "status-badge",
                        p.status === "paid"
                          ? "status-paid"
                          : "status-pending"
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-center">
            No payment records found
          </p>
        )}
      </div>
    </div>
  );
}
