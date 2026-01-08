import React from 'react';
import { User, Home, IndianRupee, Phone, Mail, MapPin, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function TenantDashboard() {
  const { user } = useAuth();
  const { tenants, rooms, payments } = useData();

  const tenant = tenants.find(t => t.email === user?.email || t.roomNumber === user?.roomNumber);
  const room = rooms.find(r => r.roomNumber === tenant?.roomNumber);

  const tenantPayments = payments.filter(p => p.tenantId === tenant?.id);
  const paidPayments = tenantPayments.filter(p => p.status === 'paid');
  const pendingPayments = tenantPayments.filter(p => p.status === 'pending');

  const totalPaid = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

  if (!tenant || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Tenant data not found</p>
        <p className="text-sm text-muted-foreground mt-1">Please contact admin for assistance</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome, {tenant.firstName}!</h1>
        <p className="page-subtitle">View your room details and rental information</p>
      </div>

      {/* Personal Info Card */}
      <div className="stat-card">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
              <span className="text-xl md:text-3xl font-bold text-primary-foreground">
                {tenant.firstName.charAt(0)}{tenant.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
                {tenant.firstName} {tenant.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">Room #{tenant.roomNumber}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={tenant.documentsVerified ? 'default' : 'secondary'} className="text-xs">
                  {tenant.documentsVerified ? 'Verified' : 'Pending Verification'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground text-sm truncate">{tenant.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground text-sm">{tenant.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium text-foreground text-sm truncate">
                  {tenant.landmark}, {tenant.city}, {tenant.state} - {tenant.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="stat-card-gradient gradient-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-primary-foreground/80">Monthly Rent</p>
              <p className="text-xl md:text-2xl font-bold text-primary-foreground mt-1">
                {formatCurrency(room.rent)}
              </p>
            </div>
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Home className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="stat-card-gradient gradient-success">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-success-foreground/80">Total Paid</p>
              <p className="text-xl md:text-2xl font-bold text-success-foreground mt-1">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-success-foreground" />
            </div>
          </div>
        </div>

        <div className="stat-card-gradient gradient-warning">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-warning-foreground/80">Pending Amount</p>
              <p className="text-xl md:text-2xl font-bold text-warning-foreground mt-1">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-warning-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Room Details & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">Room Details</h2>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl">
              <span className="text-muted-foreground text-sm">Room Number</span>
              <span className="font-semibold text-foreground">#{room.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl">
              <span className="text-muted-foreground text-sm">Room Type</span>
              <Badge variant="outline" className="capitalize text-xs">{room.type} Bed</Badge>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl">
              <span className="text-muted-foreground text-sm">AC Status</span>
              <Badge variant={room.isAC ? 'default' : 'secondary'} className="text-xs">
                {room.isAC ? 'AC Room' : 'Non-AC Room'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl">
              <span className="text-muted-foreground text-sm">Monthly Rent</span>
              <span className="font-semibold text-primary">{formatCurrency(room.rent)}</span>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl">
              <span className="text-muted-foreground text-sm">Join Date</span>
              <span className="font-medium text-foreground text-sm">{formatDate(tenant.joinDate)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-success" />
            </div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">Security Deposit</h2>
          </div>

          <div className="bg-success/5 border border-success/20 rounded-xl p-4 md:p-6 text-center">
            <p className="text-xs md:text-sm text-muted-foreground mb-2">Token / Security Money Paid</p>
            <p className="text-2xl md:text-3xl font-bold text-success">{formatCurrency(tenant.tokenMoney)}</p>
            <p className="text-xs text-muted-foreground mt-2">(Refundable on checkout)</p>
          </div>

          <div className="mt-4 md:mt-6">
            <h3 className="font-medium text-foreground mb-3 text-sm md:text-base">Facilities Included</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">WiFi</Badge>
              <Badge variant="outline" className="text-xs">Laundry</Badge>
              <Badge variant="outline" className="text-xs">Power Backup</Badge>
              <Badge variant="outline" className="text-xs">Housekeeping</Badge>
              {room.isAC && <Badge variant="outline" className="text-xs">Air Conditioning</Badge>}
              <Badge variant="outline" className="text-xs">24/7 Security</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-foreground">Recent Payments</h2>
          <Badge variant="outline" className="text-xs">{tenantPayments.length} Records</Badge>
        </div>

        {tenantPayments.length > 0 ? (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[500px] md:min-w-0 px-4 md:px-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Rent</th>
                    <th>Electricity</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantPayments.slice(0, 5).map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-medium text-sm">{payment.month} {payment.year}</td>
                      <td className="text-sm">{formatCurrency(payment.rent)}</td>
                      <td className="text-sm">{formatCurrency(payment.electricityAmount)}</td>
                      <td className="font-semibold text-primary text-sm">{formatCurrency(payment.totalAmount)}</td>
                      <td>
                        <span className={cn(
                          'status-badge text-xs',
                          payment.status === 'paid' ? 'status-paid' : 'status-pending'
                        )}>
                          {payment.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No payment records found
          </div>
        )}
      </div>
    </div>
  );
}
