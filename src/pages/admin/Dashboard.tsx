import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DoorOpen, 
  Users, 
  IndianRupee, 
  FileWarning,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  ArrowRight,
  Settings
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { rooms, tenants, payments, settings, initializeRooms, verifyAllDocuments } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roomCount, setRoomCount] = useState(settings.totalRooms);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.isOccupied).length;
  const availableRooms = totalRooms - occupiedRooms;
  const totalTenants = tenants.filter(t => t.isActive).length;

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  
  const monthlyRevenue = paidPayments
    .filter(p => p.month === 'May' && p.year === 2024)
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const monthlyElectricity = paidPayments
    .filter(p => p.month === 'May' && p.year === 2024)
    .reduce((sum, p) => sum + p.electricityAmount, 0);
  
  const expectedRevenue = rooms
    .filter(r => r.isOccupied)
    .reduce((sum, r) => sum + r.rent, 0);
  
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

  const pendingVerifications = tenants.filter(t => t.isActive && !t.documentsVerified);

  const handleSetRooms = () => {
    if (roomCount < 1 || roomCount > 500) {
      toast({
        title: 'Invalid room count',
        description: 'Please enter a number between 1 and 500.',
        variant: 'destructive',
      });
      return;
    }
    initializeRooms(roomCount);
    toast({
      title: 'Rooms updated',
      description: `${roomCount} rooms have been set up.`,
    });
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Single';
      case 'double': return 'Double';
      case 'triple': return 'Triple';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening with your property.</p>
      </div>

      {/* Room Control Card */}
      <div className="stat-card border-primary/20 bg-primary/5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl gradient-primary flex items-center justify-center">
              <DoorOpen className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-foreground">Room Control</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Set total rooms for your property</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Label className="text-sm whitespace-nowrap">Total Rooms:</Label>
              <Input
                type="number"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-20"
                min={1}
                max={500}
              />
              <Button onClick={handleSetRooms} size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Set
              </Button>
            </div>
            <Button onClick={() => navigate('/admin/rooms')} size="sm" className="gradient-primary w-full sm:w-auto">
              Manage Rooms
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Total Rooms"
          value={totalRooms}
          icon={DoorOpen}
          subtitle={`${occupiedRooms} occupied • ${availableRooms} available`}
        />
        <StatCard
          title="Active Tenants"
          value={totalTenants}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={IndianRupee}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(pendingAmount)}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Room Overview */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Room Overview</h2>
            <Badge variant="outline" className="text-muted-foreground text-xs">
              {totalRooms} Rooms
            </Badge>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-success/5 rounded-xl border border-success/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Available Rooms</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Ready for new tenants</p>
                </div>
              </div>
              <span className="text-xl md:text-2xl font-bold text-success">{availableRooms}</span>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Occupied Rooms</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Currently rented out</p>
                </div>
              </div>
              <span className="text-xl md:text-2xl font-bold text-primary">{occupiedRooms}</span>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-background flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Occupancy Rate</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Current utilization</p>
                </div>
              </div>
              <span className="text-xl md:text-2xl font-bold text-foreground">
                {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Revenue Summary</h2>
            <Badge variant="outline" className="text-muted-foreground text-xs">
              This Month
            </Badge>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-success/5 rounded-xl border border-success/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 md:h-5 md:w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Collected</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Paid this month</p>
                </div>
              </div>
              <span className="text-base md:text-xl font-bold text-success">{formatCurrency(monthlyRevenue)}</span>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-warning/5 rounded-xl border border-warning/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Electricity Revenue</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">From units consumed</p>
                </div>
              </div>
              <span className="text-base md:text-xl font-bold text-warning">{formatCurrency(monthlyElectricity)}</span>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-background flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Expected</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Monthly rent total</p>
                </div>
              </div>
              <span className="text-base md:text-xl font-bold text-foreground">{formatCurrency(expectedRevenue)}</span>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">Pending</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Awaiting payment</p>
                </div>
              </div>
              <span className="text-base md:text-xl font-bold text-destructive">{formatCurrency(pendingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants & Pending Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Tenant List */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Recent Tenants</h2>
            <Badge variant="outline" className="text-xs">{totalTenants} Total</Badge>
          </div>
          
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[500px] md:min-w-0 px-4 md:px-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.filter(t => t.isActive).slice(0, 5).map((tenant) => {
                    const room = rooms.find(r => r.roomNumber === tenant.roomNumber);
                    return (
                      <tr key={tenant.id}>
                        <td>
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-7 w-7 md:h-8 md:w-8 rounded-full gradient-primary flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-foreground">
                                {tenant.firstName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {tenant.firstName} {tenant.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{tenant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium text-sm">#{tenant.roomNumber}</td>
                        <td>
                          <span className="text-xs text-muted-foreground">
                            {getRoomTypeLabel(room?.type || 'single')} • {room?.isAC ? 'AC' : 'Non-AC'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge text-xs ${tenant.documentsVerified ? 'status-verified' : 'status-pending'}`}>
                            {tenant.documentsVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Pending Verifications</h2>
            <Badge variant="destructive" className="text-xs">{pendingVerifications.length} Pending</Badge>
          </div>
          
          {pendingVerifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-success" />
              </div>
              <p className="font-medium text-foreground">All documents verified!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVerifications.slice(0, 4).map((tenant) => (
                <div 
                  key={tenant.id}
                  className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <FileWarning className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">Room #{tenant.roomNumber}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => verifyAllDocuments(tenant.id)}
                  >
                    Verify
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
