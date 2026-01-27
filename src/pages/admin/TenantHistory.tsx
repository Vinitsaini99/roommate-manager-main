import React, { useState } from 'react';
import { History, Search, User, Calendar, IndianRupee, Home, UserMinus, Download } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { downloadTenantPDF } from '@/utils/tenantPdfGenerator';
import api from '@/api/api';


export default function AdminTenantHistory() {
  const { tenantHistory, tenants, rooms, moveTenantToHistory, fetchRooms, fetchTenantHistory } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMovingTenant, setIsMovingTenant] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const activeTenants = tenants.filter(t => t.isActive);

  const getRoomNumber = (roomId?: string | number) => {
  if (!roomId) return "—";
  return String(roomId); // ✅ Direct room number (1, 2, 3, ...)
};

  const filteredHistory = tenantHistory.filter(entry =>
    entry.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMoveTenant = async () => {
  if (!selectedTenantId) return;

  try {
    await api.post(`/tenant-history/${selectedTenantId}/move/`);


console.log("Calling:", `/api/tenants/${selectedTenantId}/move_to_history/`);


    await fetchRooms();
    await fetchTenantHistory();

    toast({
      title: "✅ Tenant moved",
      description: "Room is now available",
    });

    setIsMovingTenant(false);
    setSelectedTenantId("");
  } catch (err) {
    toast({
      title: "❌ Error",
      description: "Failed to move tenant",
      variant: "destructive",
    });
  }
};

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);
  const selectedRoom = rooms.find(r => r.roomId === selectedTenant?.roomId);




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
                      {t.firstName} {t.lastName} - Room #{getRoomNumber(t.roomId)}
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
                  <p className="text-xs md:text-sm text-muted-foreground">Room #{getRoomNumber(entry.roomId)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-xs">
                  {entry.roomType === 'single' ? 'Single Bed' : entry.roomType === 'double' ? 'Double Bed' : 'Triple Bed'}
                </Badge>
                <Badge variant={entry.isAC ? 'default' : 'secondary'} className="text-xs">
                  {entry.isAC ? 'AC' : 'Non-AC'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    try {
                      // Create a mock tenant object from history entry for PDF generation
                      const nameParts = entry.tenantName.split(' ');
                      const mockTenant = {
                        id: entry.id,
                        firstName: nameParts[0] || 'Unknown',
                        lastName: nameParts.slice(1).join(' ') || '',
                        email: '',
                        phone: '',
                        landmark: '',
                        city: '',
                        state: '',
                        pincode: '',
                        aadhaarNumber: '',
                        tokenMoney: 0,
                        roomId: entry.roomId,
                        documents: [],
                        documentsVerified: false,
                        joinDate: entry.joinDate,
                        isActive: false,
                      };
                      const mockRoom = {
                        id: String(entry.roomId),
                        roomId: entry.roomId,
                        type: entry.roomType as 'single' | 'double' | 'triple',
                        isAC: entry.isAC,
                        rent: 0,
                        isOccupied: false,
                        tenants: [],
                      };
                      downloadTenantPDF(mockTenant, mockRoom);
                      toast({ 
                        title: '✅ PDF Downloaded', 
                        description: `${entry.tenantName} agreement saved.` 
                      });
                    } catch (error) {
                      console.error('Error downloading PDF:', error);
                      toast({ 
                        title: '❌ Error', 
                        description: 'Failed to download PDF',
                        variant: 'destructive'
                      });
                    }
                  }}
                  title="Download Agreement PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
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
