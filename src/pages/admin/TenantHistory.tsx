import React, { useState, useMemo, useEffect } from "react";
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
  const [selectedTenantData, setSelectedTenantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmMove, setConfirmMove] = useState(false);
  const [selectedRoomPk, setSelectedRoomPk] = useState<string>("all");


 const resolveTenantForPDF = (entry: any) => {
  const tenant = entry.tenant
    ? tenantMap.get(String(entry.tenant))
    : null;

  return {
    id: entry.id,

    // ✅ NAME
    firstName: entry.firstName || tenant?.firstName || "",
    lastName: entry.lastName || tenant?.lastName || "",

    // ✅ CONTACT (history > tenant > fallback)
    email: entry.email || tenant?.email || "N/A",
    phone: entry.phone || tenant?.phone || "N/A",

    // ✅ ADDRESS (🔥 THIS FIXES YOUR ISSUE)
    city:
      entry.city ||
      tenant?.city ||
      "N/A",

    state:
      entry.state ||
      tenant?.state ||
      "N/A",

    pincode:
      entry.pincode ||
      tenant?.pincode ||
      "N/A",

    landmark:
      entry.landmark ||
      tenant?.landmark ||
      "N/A",

    // ✅ ID / MONEY
    aadhaarNumber:
      entry.aadhaarNumber ||
      tenant?.aadhaarNumber ||
      "N/A",

    tokenMoney:
      entry.tokenMoney ??
      tenant?.tokenMoney ??
      0,

    // ✅ ROOM / DATES
    roomId: entry.roomId,
    joinDate: entry.joinDate,
    leaveDate: entry.leaveDate,
    isActive: false,
  };
};



  
  const activeTenants = tenants.filter((t) => t.isActive);
  const tenantMap = useMemo(() => {
  const map = new Map<string, any>();
  tenants.forEach((t) => {
    map.set(String(t.id), t);
  });
  return map;
  }, [tenants]);
  
  

  // Exclude tenants that are already moved to history and keep only backend-saved tenants
  const historyTenantIds = useMemo(() => {
    const s = new Set<string>();
    tenantHistory.forEach((h: any) => {
      if (h.tenant) s.add(String(h.tenant));
    });
    return s;
  }, [tenantHistory]);

  // Tenants that exist on backend will have numeric IDs (not local temporary ids)
  // and must NOT already be present in tenantHistory
  const activeBackendTenants = activeTenants.filter(
    (t) => /^\d+$/.test(String(t.id)) && !historyTenantIds.has(String(t.id)),
  );
  
  /* ================= ROOM NUMBER ================= */
  const getRoomNumber = (roomPk?: string | number) => {
  if (!roomPk) return "No Room";
 
  const room = rooms.find(
    (r) => String(r.id) === String(roomPk) // 🔥 ONLY PK MATCH
  );

  return room?.roomId ?? "Unknown";
};

  
const getTenantName = (entry: any) => {
  if (entry.firstName || entry.lastName) {
    return `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim();
  }

  if (entry.tenant) {
    const tenant = tenantMap.get(String(entry.tenant));
    if (tenant) {
      return `${tenant.firstName} ${tenant.lastName ?? ""}`.trim();
    }
  }

  return "Former Tenant";
};



/* ================= FILTER ================= */
  const filteredHistory = tenantHistory.filter((entry) => {
    const fullName = getTenantName(entry).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  const groupedHistory = filteredHistory.reduce(
    (acc: Record<string, typeof filteredHistory>, entry) => {
const roomKey = entry.roomId && entry.roomId !== "" ? entry.roomId : "__NO_ROOM__";
  
  if (!acc[roomKey]) {
  acc[roomKey] = [];
  }
  
  acc[roomKey].push(entry);
  return acc;
  },
  {},
  );
  

  useEffect(() => {
  console.log("Tenant history sample:", tenantHistory[0]);
}, [tenantHistory]);
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
    
    // Capture tenant data BEFORE moving (so we can display it in confirmation)
    const tenant = activeBackendTenants.find((t) => t.id === selectedTenantId);
    if (!tenant) {
      toast({
        title: "Tenant not found",
        description: "Could not find the selected tenant.",
        variant: "destructive",
      });
      setIsMovingTenant(false);
      setSelectedTenantId("");
      return;
    }
    
    setSelectedTenantData(tenant);
    setConfirmMove(true);
  };
  
  const confirmAndMove = async () => {
    try {
      setIsLoading(true);
      if (!selectedTenantData) {
        throw new Error("Tenant data not found");
      }

      console.log("🚀 Starting tenant move operation:", {
        tenantId: selectedTenantId,
        tenantName: `${selectedTenantData.firstName} ${selectedTenantData.lastName}`,
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
      
      // Reset dialog state
      setIsMovingTenant(false);
      setSelectedTenantId("");
      setSelectedTenantData(null);
      setConfirmMove(false);
      
      toast({
        title: "Tenant moved to history",
        description: `${selectedTenantData.firstName} ${selectedTenantData.lastName} moved successfully`,
      });
    } catch (err: any) {
      console.error("Move failed:", err);
      toast({
        title: "Move failed",
        description: err?.message || "Could not move tenant",
        variant: "destructive",
      });
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

        <Dialog open={isMovingTenant} onOpenChange={(open) => {
          setIsMovingTenant(open);
          if (!open) {
            setSelectedTenantId("");
            setSelectedTenantData(null);
            setConfirmMove(false);
          }
        }}>
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
                      <SelectItem value="__no_tenants__" disabled>
                        No saved tenants available
                      </SelectItem>
                    )}
                    {activeBackendTenants
                      .filter((t) => t && String(t.id).trim() !== "")
                      .map((t) => {
                      const room = rooms.find(
                        (r) =>
                          String(r.id) === String(t.roomPk) ||
                          String(r.roomId) === String(t.roomId),
                      );
                      const roomKey = t.roomId || t.roomPk;
                      return (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.firstName} {t.lastName} – Room {getRoomNumber(roomKey)}
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
                {selectedTenantData && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="font-semibold mb-2">Confirm action:</p>
                      <p className="text-sm">
                        Moving{" "}
                        <span className="font-semibold">
                          {selectedTenantData.firstName} {selectedTenantData.lastName}
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
                        onClick={() => {
                          setConfirmMove(false);
                          setSelectedTenantData(null);
                        }}
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
     {Object.entries(groupedHistory).map(([roomId, entries]) => (
  <div key={roomId} className="space-y-3">
    
    {/* 🏠 ROOM HEADER */}
   <div className="flex items-center justify-between bg-muted/60 rounded-lg px-4 py-2">
  <h3 className="font-semibold text-lg flex items-center gap-2">
    <Home className="h-4 w-4" />
    {roomId === "__NO_ROOM__"
      ? "No Room"
      : `Room #${getRoomNumber(roomId)}`}
  </h3>
  <Badge variant="secondary">
    {entries.length} past tenant{entries.length > 1 ? "s" : ""}
  </Badge>
</div>



    

    {/* 👤 TENANTS OF THIS ROOM */}
    {entries.map((entry) => {
      const roomTypeLabel =
        entry.roomType?.toLowerCase() === "single"
          ? "Single Bed"
          : entry.roomType?.toLowerCase() === "double"
          ? "Double Bed"
          : "Triple Bed";

      return (
        <div key={entry.id} className="stat-card ml-4">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">
               {getTenantName(entry)}
              </p>
              <p className="text-sm text-muted-foreground">
                Joined: {formatDate(entry.joinDate)} • Left:{" "}
                {formatDate(entry.leaveDate)}
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
    const tenantForPDF = resolveTenantForPDF(entry);

    downloadTenantPDF(
      tenantForPDF as any,
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
              <p className="text-xs text-muted-foreground">Total Rent Paid</p>
              <p className="text-success">
                {formatCurrency(entry.totalRentPaid)}
              </p>
            </div>

            {/* {entry.remarks && (
              <div>
                <p className="text-xs text-muted-foreground">Remarks</p>
                <p className="text-sm">{entry.remarks}</p>
              </div>
            )} */}
          </div>
        </div>
      );
    })}
  </div>
))}

    </div>
  );
}
