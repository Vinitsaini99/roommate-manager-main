import React, { useState } from 'react';
import { CreditCard, Zap, Search, Plus, CheckCircle, Clock, IndianRupee, Bell } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminPayments() {
  const { tenants, payments, rooms, settings, updateSettings, addPayment, updatePayment, sendPaymentReminder } = useData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);
  

  const activeTenants = tenants.filter(t => t.isActive);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selectedTenant = activeTenants.find(t => t.id === selectedTenantId);
  const selectedRoom = rooms.find(r => r.roomNumber === selectedTenant?.roomNumber);

  const unitsUsed = currReading - prevReading;
  const electricityAmount = unitsUsed * settings.electricityRate;
  const totalBill = (selectedRoom?.rent || 0) + electricityAmount;

  const handleAddPayment = () => {
    if (!selectedTenant || !selectedMonth) {
      toast({ title: 'Error', description: 'Please select tenant and month', variant: 'destructive' });
      return;
    }

    addPayment({
      tenantId: selectedTenant.id,
      tenantName: `${selectedTenant.firstName} ${selectedTenant.lastName}`,
      roomNumber: selectedTenant.roomNumber,
      month: selectedMonth,
      year: 2024,
      previousReading: prevReading,
      currentReading: currReading,
      unitsUsed,
      electricityRate: settings.electricityRate,
      electricityAmount,
      rent: selectedRoom?.rent || 0,
      totalAmount: totalBill,
      status: 'pending',
      reminderSent: false,
    });

    toast({ title: 'Payment record added', description: 'New payment entry has been created.' });
    setIsAddingPayment(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTenantId('');
    setSelectedMonth('');
    setPrevReading(0);
    setCurrReading(0);
  };

  const handleMarkAsPaid = (paymentId: string) => {
    updatePayment(paymentId, { status: 'paid', paidDate: new Date().toISOString() });
    toast({ title: 'Payment updated', description: 'Payment has been marked as paid.' });
  };

  const handleSendReminder = (paymentId: string, tenantName: string) => {
    sendPaymentReminder(paymentId);
    toast({ 
      title: 'Reminder sent', 
      description: `Payment reminder has been sent to ${tenantName}.` 
    });
  };

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
 const sendWhatsAppReminder = (
  phone: string,
  tenantName: string,
  roomNumber: number,
  month: string,
  amount: number
) => {
  const message = `Hello ${tenantName},
  
Your rent payment for Room #${roomNumber} (${month}) is pending.

Total Amount: ₹${amount}

Please make the payment at the earliest.
Thank you.`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/91${phone}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");
};


// const tenant = tenants.find(t => t.id === payment.tenantId);



  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4">
        <div>
          <h1 className="page-title">Payments & Electricity</h1>
          <p className="page-subtitle">Manage rent and electricity billing for all tenants</p>
        </div>
        <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
          <DialogTrigger asChild>
            <Button className="gradient-primary w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Payment Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 md:space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} - Room #{t.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month..." />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m} 2024</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Previous Reading</Label>
                  <Input
                    type="number"
                    value={prevReading}
                    onChange={(e) => setPrevReading(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Reading</Label>
                  <Input
                    type="number"
                    value={currReading}
                    onChange={(e) => setCurrReading(Number(e.target.value))}
                  />
                </div>
              </div>

              {selectedTenant && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Units Used:</span>
                    <span className="font-medium">{unitsUsed} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Electricity (₹{settings.electricityRate}/unit):</span>
                    <span className="font-medium">{formatCurrency(electricityAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Room Rent:</span>
                    <span className="font-medium">{formatCurrency(selectedRoom?.rent || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-border">
                    <span className="font-medium">Total Bill:</span>
                    <span className="font-bold text-primary">{formatCurrency(totalBill)}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddingPayment(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleAddPayment} className="gradient-primary w-full sm:w-auto">Add Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Electricity Settings */}
      <div className="stat-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground">Electricity Rate</p>
              <p className="text-sm text-muted-foreground">Per unit charge for electricity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-bold text-foreground">₹{settings.electricityRate}</span>
            <span className="text-muted-foreground">/ unit</span>
            <Input
              type="number"
              className="w-20"
              value={settings.electricityRate}
              onChange={(e) => updateSettings({ electricityRate: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg md:text-2xl font-bold text-foreground">{payments.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-lg md:text-2xl font-bold text-success">{paidCount}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Paid</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-warning" />
          </div>
          <div>
            <p className="text-lg md:text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-base md:text-xl font-bold text-success">{formatCurrency(totalCollected)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Collected</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'paid', 'pending'] as const).map((f) => (
            <Button
              key={f}
              variant={filterStatus === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(f)}
              className={cn(
                'whitespace-nowrap',
                filterStatus === f ? 'gradient-primary' : ''
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments Table - Mobile Cards + Desktop Table */}
      <div className="stat-card overflow-hidden p-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room</th>
                <th>Month</th>
                <th>Units</th>
                <th>Electricity</th>
                <th>Rent</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {payment.tenantName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{payment.tenantName}</span>
                    </div>
                  </td>
                  <td className="font-medium">#{payment.roomNumber}</td>
                  <td>{payment.month} {payment.year}</td>
                  <td>{payment.unitsUsed}</td>
                  <td>{formatCurrency(payment.electricityAmount)}</td>
                  <td>{formatCurrency(payment.rent)}</td>
                  <td className="font-semibold text-primary">{formatCurrency(payment.totalAmount)}</td>
                  <td>
                    <span className={cn(
                      'status-badge',
                      payment.status === 'paid' ? 'status-paid' : 'status-pending'
                    )}>
                      {payment.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {payment.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(payment.id)}
                        >
                          Mark Paid
                        </Button>
      <Button
  size="sm"
  variant="ghost"
  onClick={() => {
    const tenant = tenants.find(t => t.id === payment.tenantId);

    if (!tenant || !tenant.phone) {
      toast({
        title: "Error",
        description: "Tenant phone number not found",
        variant: "destructive",
      });
      return;
    }

    sendWhatsAppReminder(
      tenant.phone,
      payment.tenantName,
      payment.roomNumber,
      payment.month,
      payment.totalAmount
    );
  }}
>
  <Bell className="h-4 w-4" />
</Button>



                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {filteredPayments.map((payment) => (
            <div 
              key={payment.id}
              className={cn(
                'p-4 rounded-xl border',
                payment.status === 'paid' 
                  ? 'bg-success/5 border-success/20' 
                  : 'bg-warning/5 border-warning/20'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {payment.tenantName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{payment.tenantName}</p>
                    <p className="text-sm text-muted-foreground">Room #{payment.roomNumber}</p>
                  </div>
                </div>
                <span className={cn(
                  'status-badge text-xs',
                  payment.status === 'paid' ? 'status-paid' : 'status-pending'
                )}>
                  {payment.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Month:</span>
                  <span className="ml-1 font-medium">{payment.month}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Units:</span>
                  <span className="ml-1 font-medium">{payment.unitsUsed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rent:</span>
                  <span className="ml-1 font-medium">{formatCurrency(payment.rent)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Electric:</span>
                  <span className="ml-1 font-medium">{formatCurrency(payment.electricityAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="ml-2 text-lg font-bold text-primary">{formatCurrency(payment.totalAmount)}</span>
                </div>
                {payment.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payment.id)}>
                      Mark Paid
                    </Button>
                    <Button
  size="sm"
  variant="ghost"
  onClick={() => {
    const tenant = tenants.find(t => t.id === payment.tenantId);

    if (!tenant || !tenant.phone) {
      toast({
        title: "Error",
        description: "Tenant phone number not found",
        variant: "destructive",
      });
      return;
    }

    sendWhatsAppReminder(
      tenant.phone,
      payment.tenantName,
      payment.roomNumber,
      payment.month,
      payment.totalAmount
    );
  }}
  disabled={payment.reminderSent}
>
  <Bell className={cn("h-4 w-4", payment.reminderSent && "text-muted-foreground")} />
</Button>

                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No payment records found</p>
            <p className="text-sm text-muted-foreground mt-1">Add new payment entries to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
