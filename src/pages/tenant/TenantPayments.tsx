import React from 'react';
import { CreditCard, IndianRupee, Zap, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function TenantPayments() {
  const { user } = useAuth();
  const { tenants, payments, settings } = useData();

  const tenant = tenants.find(t => t.email === user?.email || t.roomNumber === user?.roomNumber);
  const tenantPayments = payments.filter(p => p.tenantId === tenant?.id);

  const paidPayments = tenantPayments.filter(p => p.status === 'paid');
  const pendingPayments = tenantPayments.filter(p => p.status === 'pending');

  const totalPaid = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalElectricity = tenantPayments.reduce((sum, p) => sum + p.electricityAmount, 0);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rent Details</h1>
        <p className="page-subtitle">View your monthly rent and electricity charges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg md:text-2xl font-bold text-foreground">{tenantPayments.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Bills</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-base md:text-xl font-bold text-success">{formatCurrency(totalPaid)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Paid</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-warning" />
          </div>
          <div>
            <p className="text-base md:text-xl font-bold text-warning">{formatCurrency(totalPending)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-info/10 flex items-center justify-center">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-info" />
          </div>
          <div>
            <p className="text-base md:text-xl font-bold text-foreground">{formatCurrency(totalElectricity)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Electricity</p>
          </div>
        </div>
      </div>

      {/* Electricity Rate Info */}
      <div className="stat-card bg-warning/5 border-warning/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Zap className="h-4 w-4 md:h-5 md:w-5 text-warning" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm md:text-base">Current Electricity Rate</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              ₹{settings.electricityRate} per unit
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-foreground">Payment History</h2>
          <Badge variant="outline" className="text-xs">{tenantPayments.length} Records</Badge>
        </div>

        {tenantPayments.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {tenantPayments.map((payment) => (
              <div
                key={payment.id}
                className={cn(
                  'p-3 md:p-4 rounded-xl border',
                  payment.status === 'paid' 
                    ? 'bg-success/5 border-success/20' 
                    : 'bg-warning/5 border-warning/20'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={cn(
                      'h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0',
                      payment.status === 'paid' ? 'bg-success/10' : 'bg-warning/10'
                    )}>
                      <Calendar className={cn(
                        'h-5 w-5 md:h-6 md:w-6',
                        payment.status === 'paid' ? 'text-success' : 'text-warning'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base">
                        {payment.month} {payment.year}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Room #{payment.roomNumber}
                      </p>
                    </div>
                    <span className={cn(
                      'status-badge text-xs',
                      payment.status === 'paid' ? 'status-paid' : 'status-pending'
                    )}>
                      {payment.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xl md:text-2xl font-bold text-primary">
                      {formatCurrency(payment.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Rent</p>
                    <p className="font-medium text-foreground text-sm">{formatCurrency(payment.rent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Units Used</p>
                    <p className="font-medium text-foreground text-sm">{payment.unitsUsed} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Electricity</p>
                    <p className="font-medium text-foreground text-sm">{formatCurrency(payment.electricityAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="font-medium text-foreground text-sm">₹{payment.electricityRate}/unit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No payment records</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your payment history will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
