import React, { useState } from 'react';
import { History, Search, User, Calendar, IndianRupee, Home, UserMinus } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminTenantHistory() {
  const { tenantHistory, tenants, moveTenantToHistory } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMovingTenant, setIsMovingTenant] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const activeTenants = tenants.filter(t => t.isActive);

  const filteredHistory = tenantHistory.filter(entry =>
    entry.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMoveTenant = () => {
    if (!selectedTenantId) {
      toast({ title: 'Error', description: 'Please select a tenant', variant: 'destructive' });
      return;
    }

    moveTenantToHistory(selectedTenantId);
    toast({ title: 'Tenant moved', description: 'Tenant has been moved to history records.' });
    setIsMovingTenant(false);
    setSelectedTenantId('');
  };

  const totalRentCollected = tenantHistory.reduce((sum, entry) => sum + entry.totalRentPaid, 0);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4">
        <div>
          <h1 className="page-title">Tenant History</h1>
          <p className="page-subtitle">Records of all previous tenants</p>
        </div>
        <Dialog open={isMovingTenant} onOpenChange={setIsMovingTenant}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <UserMinus className="h-4 w-4 mr-2" />
              Move Tenant to History
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Move Tenant to History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Select a tenant to move to history. This action will remove them from active tenants 
                and free up their room.
              </p>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} - Room #{t.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button variant="outline" onClick={() => setIsMovingTenant(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={handleMoveTenant} variant="destructive" className="w-full sm:w-auto">Move to History</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{tenantHistory.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Past Tenants</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-base md:text-xl font-bold text-success">{formatCurrency(totalRentCollected)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Collected</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-info/10 flex items-center justify-center">
            <User className="h-5 w-5 md:h-6 md:w-6 text-info" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{activeTenants.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Active Tenants</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by tenant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* History List */}
      <div className="space-y-3 md:space-y-4">
        {filteredHistory.map((entry) => (
          <div key={entry.id} className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base">{entry.tenantName}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Room #{entry.roomNumber}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {entry.roomType === 'single' ? 'Single Bed' : 'Double Bed'}
                </Badge>
                <Badge variant={entry.isAC ? 'default' : 'secondary'} className="text-xs">
                  {entry.isAC ? 'AC' : 'Non-AC'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Join Date</p>
                  <p className="text-xs md:text-sm font-medium text-foreground">{formatDate(entry.joinDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Leave Date</p>
                  <p className="text-xs md:text-sm font-medium text-foreground">{formatDate(entry.leaveDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-success shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Rent Paid</p>
                  <p className="text-xs md:text-sm font-medium text-success">{formatCurrency(entry.totalRentPaid)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Facilities</p>
                  <p className="text-xs md:text-sm font-medium text-foreground truncate">{entry.facilities.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center stat-card">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No history records</p>
            <p className="text-sm text-muted-foreground mt-1">
              Past tenant records will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
