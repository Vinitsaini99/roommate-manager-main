import React, { useState } from "react";
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
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);

  const activeTenants = tenants.filter((t) => t.isActive);
  // Tenants that exist on backend will have numeric IDs (not local temporary ids)
  const activeBackendTenants = activeTenants.filter((t) => /^\d+$/.test(String(t.id)));

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

  /* ================= FILTER ================= */
  const filteredHistory = tenantHistory.filter((entry) =>
    entry.tenantName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ================= MOVE TENANT ================= */
  const handleMoveTenant = async () => {
    if (!selectedTenantId) return;

    // Prevent moving tenants that are only local (no backend ID)
    if (!/^\d+$/.test(String(selectedTenantId))) {
      toast({
        title: "Tenant not on server",
        description: "This tenant exists only locally. Save to server before moving.",
        variant: "destructive",
      });
      setIsMovingTenant(false);
      setSelectedTenantId("");
      return;
    }

    setConfirmMove(true);
  };

  const confirmAndMove = async () => {
    try {
      setIsLoading(true);
      const selectedTenant = activeBackendTenants.find((t) => t.id === selectedTenantId);
      
      if (!selectedTenant) {
        throw new Error("Tenant not found");
      }

      console.log("🚀 Starting tenant move operation:", {
        tenantId: selectedTenantId,
        tenantName: `${selectedTenant.firstName} ${selectedTenant.lastName}`,
      });

      // Execute the move
      await moveTenantToHistory(selectedTenantId);
      
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh rooms first to see updated status
      console.log("📥 Refreshing rooms...");
      await fetchRooms();
      
      // Then refresh history
      console.log("📥 Refreshing tenant history...");
      await fetchTenantHistory();
      
      // Final verification log
      // console.log("✅ Refresh complete - room should now be available");
      //   variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
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
              <DialogTitle>
                {confirmMove ? "Confirm Move" : "Move Tenant to History"}
              </DialogTitle>
            </DialogHeader>

            {!confirmMove ? (
              <div className="space-y-4 pt-4">
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBackendTenants.length === 0 && (
                      <SelectItem value="" disabled>
                        No saved tenants available
                      </SelectItem>
                    )}
                    {activeBackendTenants.map((t) => {
                      const room = rooms.find(
                        (r) =>
                          String(r.id) === String(t.roomPk) ||
                          String(r.roomId) === String(t.roomId),
                      );
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} – Room #{getRoomNumber(t.roomId)}{" "}
                          {room?.isOccupied ? "🔴" : "🟢"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsMovingTenant(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleMoveTenant}
                    disabled={!selectedTenantId || isLoading}
                  >
                    {isLoading ? "Moving..." : "Next"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {selectedTenantId && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="font-semibold mb-2">Confirm action:</p>
                      <p className="text-sm">
                        Moving{" "}
                        <span className="font-semibold">
                          {
                            activeBackendTenants.find((t) => t.id === selectedTenantId)
                              ?.firstName
                          }{" "}
                          {
                            activeBackendTenants.find((t) => t.id === selectedTenantId)
                              ?.lastName
                          }
                        </span>{" "}
                        to history will:
                      </p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>✓ Mark tenant as inactive</li>
                        <li>✓ Free up the room</li>
                        <li>✓ Save to backend permanently</li>
                      </ul>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setConfirmMove(false)}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={confirmAndMove}
                        disabled={isLoading}
                      >
                        {isLoading ? "Moving..." : "Confirm Move"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
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
                  <p className="font-semibold">{entry.tenantName}</p>
                  <p className="text-sm text-muted-foreground">
                    Room #{getRoomNumber(entry.roomId)}
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
