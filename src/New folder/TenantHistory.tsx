import React, { useMemo, useState } from "react";
import {
  History,
  Search,
  User,
  Calendar,
  IndianRupee,
  Home,
  UserMinus,
  Download,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { downloadTenantPDF } from "@/utils/tenantPdfGenerator";

export default function AdminTenantHistory() {
  const {
    tenantHistory,
    tenants,
    rooms,
    moveTenantToHistory,
    fetchRooms,
    fetchTenantHistory,
  } = useData();

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMovingTenant, setIsMovingTenant] = useState(false);
  const [isMoveLoading, setIsMoveLoading] = useState(false);

  // 🔥 ROOM based selection
  const [selectedRoomPk, setSelectedRoomPk] = useState("");

  const activeTenants = tenants.filter((t) => t.isActive);

  /* ================= ROOM NUMBER ================= */
  const getRoomNumber = (roomId?: string | number) => {
    if (!roomId) return "—";
    const room = rooms.find(
      (r) =>
        String(r.id) === String(roomId) ||
        String(r.roomId) === String(roomId),
    );
    return room?.roomId ?? String(roomId);
  };

  /* ================= ROOM OPTIONS (same as Payments) ================= */
  const roomOptions = useMemo(() => {
    const roomPkSet = new Set<string>();
    const options: {
      roomPk: string;
      roomIdLabel: string;
      occupants: number;
    }[] = [];

    for (const t of activeTenants) {
      if (!t.roomPk) continue;
      if (roomPkSet.has(String(t.roomPk))) continue;

      const room = rooms.find((r) => String(r.id) === String(t.roomPk));
      const occupants = activeTenants.filter(
        (x) => String(x.roomPk) === String(t.roomPk),
      ).length;

      options.push({
        roomPk: String(t.roomPk),
        roomIdLabel: room?.roomId || "ROOM",
        occupants,
      });

      roomPkSet.add(String(t.roomPk));
    }

    return options;
  }, [activeTenants, rooms]);

  /* ================= TENANTS IN SELECTED ROOM ================= */
  const tenantsInSelectedRoom = useMemo(() => {
    if (!selectedRoomPk) return [];
    return activeTenants.filter(
      (t) => String(t.roomPk) === String(selectedRoomPk),
    );
  }, [activeTenants, selectedRoomPk]);

  // backend ko ek tenantId chahiye
  const selectedTenant = tenantsInSelectedRoom[0];

  /* ================= FILTER ================= */
  const filteredHistory = tenantHistory.filter((entry) =>
    entry.tenantName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ================= MOVE TENANT ================= */
  const handleMoveTenant = async () => {
    if (!selectedTenant) {
      toast({
        title: "Error",
        description: "No active tenant found in selected room",
        variant: "destructive",
      });
      return;
    }

    console.log("🔄 Starting move tenant process for:", selectedTenant.id);
    setIsMoveLoading(true);

    try {
      // Call moveTenantToHistory - it handles everything internally
      console.log("📤 Calling moveTenantToHistory...");
      await moveTenantToHistory(selectedTenant.id, "Tenant moved from history dialog");
      
      // Wait a moment for state updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh data
      console.log("📥 Refreshing data...");
      await Promise.all([fetchRooms(), fetchTenantHistory()]);

      console.log("✅ Move complete!");
      toast({
        title: "✅ Tenant moved",
        description: "Tenant moved to history & room marked as available",
      });

      setIsMovingTenant(false);
      setSelectedRoomPk("");
      setIsMoveLoading(false);
    } catch (err: any) {
      console.error("❌ Error moving tenant:", err);
      toast({
        title: "❌ Error",
        description: err?.message || "Failed to move tenant",
        variant: "destructive",
      });
      setIsMoveLoading(false);
    }
  };

  const totalRentCollected = tenantHistory.reduce(
    (sum, entry) => sum + (entry.totalRentPaid || 0),
    0,
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="page-header flex flex-col gap-4">
        <div>
          <h1 className="page-title">Tenant History</h1>
          <p className="page-subtitle">Records of all previous tenants</p>
        </div>

        <Dialog open={isMovingTenant} onOpenChange={setIsMovingTenant}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserMinus className="h-4 w-4 mr-2" />
              Move Tenant to History
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Move Tenant to History</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Select
                value={selectedRoomPk}
                onValueChange={setSelectedRoomPk}
                disabled={isMoveLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map((r) => (
                    <SelectItem key={r.roomPk} value={r.roomPk}>
                      {r.roomIdLabel} ({r.occupants} tenant
                      {r.occupants > 1 ? "s" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTenant && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Selected Tenant</p>
                  <p className="font-medium">
                    {selectedTenant.firstName} {selectedTenant.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTenant.email}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMovingTenant(false);
                    setSelectedRoomPk("");
                  }}
                  disabled={isMoveLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleMoveTenant}
                  disabled={!selectedTenant || isMoveLoading}
                >
                  {isMoveLoading ? "Moving..." : "Move"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xl font-bold">{tenantHistory.length}</p>
          <p className="text-sm text-muted-foreground">Past Tenants</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-bold text-success">
            {formatCurrency(totalRentCollected)}
          </p>
          <p className="text-sm text-muted-foreground">Total Collected</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-bold">{activeTenants.length}</p>
          <p className="text-sm text-muted-foreground">Active Tenants</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        <Input
          placeholder="Search by tenant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* HISTORY LIST */}
      <div className="space-y-4">
        {filteredHistory.map((entry) => {
          const roomTypeLabel =
            entry.roomType?.toLowerCase() === "single"
              ? "Single Bed"
              : entry.roomType?.toLowerCase() === "double"
              ? "Double Bed"
              : "Triple Bed";

          return (
            <div key={entry.id} className="stat-card">
              <div className="flex justify-between">
                <div>
                  {/* ROOM PRIMARY */}
                  <p className="font-semibold">
                    ROOM-{getRoomNumber(entry.roomId)}
                  </p>
                  {/* tenant secondary */}
                  <p className="text-sm text-muted-foreground">
                    {entry.tenantName}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{roomTypeLabel}</Badge>
                  <Badge variant={entry.isAC ? "default" : "secondary"}>
                    {entry.isAC ? "AC" : "Non-AC"}
                  </Badge>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const [firstName, ...rest] =
                        entry.tenantName.split(" ");
                      downloadTenantPDF(
                        {
                          id: entry.id,
                          firstName,
                          lastName: rest.join(" "),
                          roomId: entry.roomId,
                          isActive: false,
                        } as any,
                        rooms.find(
                          (r) =>
                            String(r.roomId) === String(entry.roomId) ||
                            String(r.id) === String(entry.roomId),
                        ),
                      );
                      toast({ title: "PDF Downloaded" });
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Join Date</p>
                  <p>{formatDate(entry.joinDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Leave Date</p>
                  <p>{formatDate(entry.leaveDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Rent Paid
                  </p>
                  <p className="text-success">
                    {formatCurrency(entry.totalRentPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Facilities</p>
                  <p>
                    {Array.isArray(entry.facilities)
                      ? entry.facilities.join(", ")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="stat-card text-center py-10">
            No history records found
          </div>
        )}
      </div>
    </div>
  );
}
