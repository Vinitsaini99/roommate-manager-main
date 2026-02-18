import { UPI_CONFIG } from "@/contexts/upi";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Zap,
  Search,
  Plus,
  CheckCircle,
  Clock,
  IndianRupee,
  Bell,
  ArrowLeft
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatMonth } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AdminPayments() {
  const {
    tenants,
    payments,
    rooms,
    settings,
    updateSettings,
    addPayment,
    updatePayment,
    sendPaymentReminder,
    fetchPayments,
  } = useData();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">("all");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [currentView, setCurrentView] = useState<"payments" | "history">("payments");
  const [historyFilterRoomPk, setHistoryFilterRoomPk] = useState<string | null>(null);
  const [selectedRoomPk, setSelectedRoomPk] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);
  // Persistent paid ledger stored in localStorage
  const [paidLedger, setPaidLedger] = useState<{
    id: string;
    tenantId?: string;
    tenantName?: string;
    tenant?: string;
    month?: string;
    year?: number;
    totalAmount?: number;
    electricityAmount?: number;
    rent?: number;
    paidAt?: number;
  }[]>(() => {
    try {
      const raw = localStorage.getItem("rentease_paid_ledger");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Set of paid ids for quick lookups (derived from ledger)
  const [paidIds, setPaidIds] = useState<Set<string>>(() => new Set(paidLedger.map((x) => String(x.id))));

  // All known bills (API + virtual bills created from ledger entries)
  const [allKnownBills, setAllKnownBills] = useState<any[]>([]);

  const getTenantByBill = (bill: any) =>
    tenants.find((t) => t.id === bill.tenant);

  const getRoomByBill = (bill: any) => {
    const tenant = getTenantByBill(bill);
    return rooms.find((r) => r.id === tenant?.roomPk);
  };

  const getRoomLabelByBill = (bill: any) => {
    const tenant = getTenantByBill(bill);
    const roomPk = tenant?.roomPk;
    if (!roomPk) return "—";

    const room = rooms.find((r) => String(r.id) === String(roomPk));
    const roomTenants = tenants.filter(
      (t) => String(t.roomPk) === String(roomPk),
    );

    const count = roomTenants.length;

    return `${room?.roomId ?? "ROOM"} (${count} tenant${count > 1 ? "s" : ""})`;
  };

  const getPrimaryTenantByBill = (bill: any) => {
    const tenant = getTenantByBill(bill);
    if (!tenant?.roomPk) return tenant;

    return (
      tenants.find(
        (t) =>
          String(t.roomPk) === String(tenant.roomPk) &&
          t.isActive &&
          t.phone
      ) || tenant
    );
  };

  const getRoomTenantsLabelByBill = (bill: any) => {
    const t = getTenantByBill(bill);
    const roomPk = t?.roomPk;
    if (!roomPk) return t ? `${t.firstName} ${t.lastName}`.trim() : "—";

    const roomTenants = tenants.filter(
      (x) => x.roomPk && String(x.roomPk) === String(roomPk),
    );
    const names = roomTenants
      .map((x) => `${x.firstName} ${x.lastName}`.trim())
      .filter(Boolean);

    if (names.length === 0) return "—";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, ${names[1]} (2 tenants)`;
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more (${names.length} tenants)`;
  };

  const getUnits = (bill: any) =>
    Number(bill?.current_reading || 0) - Number(bill?.previous_reading || 0);

  const getElectricityAmount = (bill: any) => getUnits(bill) * Number(bill?.unit_charge || 0);

  // ✅ Active tenants set for filtering (must have room assigned)
  const activeTenants = tenants.filter((t) => t.roomPk !== null && t.roomPk !== undefined);
  const activeTenantIds = new Set(activeTenants.map((t) => String(t.id)));

  const roomOptions = React.useMemo(() => {
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
        roomIdLabel: room?.roomId || t.roomId || "—",
        occupants,
      });
      roomPkSet.add(String(t.roomPk));
    }

    return options.sort((a, b) => {
      const an = Number(String(a.roomIdLabel).replace(/\D/g, ""));
      const bn = Number(String(b.roomIdLabel).replace(/\D/g, ""));
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(a.roomIdLabel).localeCompare(String(b.roomIdLabel));
    });
  }, [activeTenants, rooms]);

  // ✅ Helper to check if bill is paid (backend soft-delete OR in local ledger)
  const isBillPaid = (bill: any) => {
    if (!bill) return false;
    return bill.record_status === "Deleted" || paidIds.has(String(bill.id));
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Keep paidIds in sync whenever ledger changes
  useEffect(() => {
    setPaidIds(new Set(paidLedger.map((x) => String(x.id))));
    try {
      localStorage.setItem("rentease_paid_ledger", JSON.stringify(paidLedger));
    } catch (e) {
      // ignore
    }
  }, [paidLedger]);

  // Merge API payments with ledger to maintain a complete list of known bills
  useEffect(() => {
    const map = new Map<string, any>();

    // start with previous allKnownBills to preserve cached snapshots
    for (const b of allKnownBills) {
      if (b && b.id != null) map.set(String(b.id), b);
    }

    // overlay API payments
    for (const p of payments) {
      if (p && p.id != null) map.set(String(p.id), p);
    }

    // ensure ledger entries exist as paid records
    for (const entry of paidLedger) {
      const id = String(entry.id);
      if (!map.has(id)) {
        // create a virtual paid bill from ledger snapshot
        map.set(id, {
          id: entry.id,
          tenant: entry.tenantId || entry.tenant, // handle both old and new formats
          tenantId: entry.tenantId,
          month: entry.month,
          year: entry.year,
          record_status: "Deleted",
          status: "paid",
          totalAmount: entry.totalAmount,
          amount: entry.totalAmount,
          previous_reading: undefined,
          current_reading: undefined,
          unit_charge: undefined,
        });
      } else {
        // if exists, mark it as paid if ledger says so
        const existing = map.get(id);
        map.set(id, { ...existing, record_status: "Deleted", status: "paid", tenantId: entry.tenantId });
      }
    }

    setAllKnownBills(Array.from(map.values()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, paidLedger]);

  // ✅ Filter payments based on search and status filters - ONLY active tenants
  const filteredPayments = React.useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();

    // Visible pending = API bills for active tenants only
    const visiblePending = payments
      .filter((p) => !isBillPaid(p) && !p.hidden && activeTenantIds.has(String(p.tenant)))
      .map((p) => ({ ...p }));

    // Visible paid = ledger bills for active tenants only
    const visiblePaid = allKnownBills.filter(
      (p) => isBillPaid(p) && activeTenantIds.has(String(p.tenantId || p.tenant))
    );

    // Combined visible payments
    let visiblePayments: any[] = [];
    if (filterStatus === "pending") visiblePayments = visiblePending;
    else if (filterStatus === "paid") visiblePayments = visiblePaid;
    else visiblePayments = [...visiblePending, ...visiblePaid];

    // de-duplicate by id
    const seen = new Set<string>();
    visiblePayments = visiblePayments.filter((item) => {
      if (!item || item.id == null) return false;
      const id = String(item.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return visiblePayments.filter((p) => {
      const tenant = tenants.find((t) => t.id === p.tenant || t.id === p.tenantId);
      if (!searchLower) return true;
      if (!tenant) return false;
      return `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchLower);
    });
  }, [payments, allKnownBills, tenants, searchQuery, filterStatus, isBillPaid, activeTenantIds]);

  const tenantsInSelectedRoom = React.useMemo(() => {
    if (!selectedRoomPk) return [];
    return activeTenants.filter(
      (t) => String(t.roomPk) === String(selectedRoomPk),
    );
  }, [activeTenants, selectedRoomPk]);

  const selectedTenant = tenantsInSelectedRoom[0];
  const selectedRoom = rooms.find(
    (r) => String(r.id) === String(selectedRoomPk),
  );

  const unitsUsed = currReading - prevReading;
  const electricityAmount = unitsUsed * settings.electricityRate;
  const totalBill = (selectedRoom?.rent || 0) + electricityAmount;

  const usedMonthsForSelectedRoom = React.useMemo(() => {
    if (!selectedRoomPk) return new Set<string>();

    const used = new Set<string>();
    for (const p of payments) {
      const t = tenants.find((tt) => tt.id === p.tenant);
      if (!t || String(t.roomPk) !== String(selectedRoomPk)) continue;
      const y =
        p.year || (p.date_month ? new Date(p.date_month).getFullYear() : currentYear);
      if (y !== currentYear) continue;
      const m = (p.month || "").toLowerCase();
      if (m) used.add(m);
    }
    return used;
  }, [selectedRoomPk, payments, tenants, currentYear]);

  const getRoomNumber = (roomId?: string | number) => {
    if (!roomId) return "—";
    return String(roomId);
  };

  useEffect(() => {
    if (!selectedRoomPk) {
      setPrevReading(0);
      return;
    }

    const roomBills = payments.filter((p) => {
      const t = tenants.find((tt) => tt.id === p.tenant);
      return t?.roomPk && String(t.roomPk) === String(selectedRoomPk);
    });

    if (roomBills.length === 0) {
      setPrevReading(0);
      return;
    }

    const latest = [...roomBills].sort((a, b) => {
      const da = new Date(
        a.date_month ||
          `${a.year || 2026}-${String(
            months.indexOf(a.month || "May") + 1,
          ).padStart(2, "0")}-01`,
      ).getTime();
      const db = new Date(
        b.date_month ||
          `${b.year || 2026}-${String(
            months.indexOf(b.month || "May") + 1,
          ).padStart(2, "0")}-01`,
      ).getTime();
      return db - da;
    })[0];

    setPrevReading(latest.current_reading || 0);
  }, [selectedRoomPk, payments, tenants]);

  const historyRoomFilterOptions = React.useMemo(() => {
    const roomPaymentMap = new Map<string, { room: any; count: number }>();

    for (const p of payments) {
      const tenant = tenants.find((t) => t.id === p.tenant);
      if (!tenant?.roomPk) continue;
      const roomPk = String(tenant.roomPk);
      const room = rooms.find((r) => String(r.id) === String(roomPk));
      if (!room) continue;

      if (!roomPaymentMap.has(roomPk)) {
        roomPaymentMap.set(roomPk, { room, count: 0 });
      }
      const entry = roomPaymentMap.get(roomPk)!;
      entry.count += 1;
    }

    const options = Array.from(roomPaymentMap.values()).map((entry) => ({
      roomPk: String(entry.room.id),
      roomId: entry.room.roomId || String(entry.room.id),
      count: entry.count,
    }));

    return options.sort((a, b) => {
      const an = Number(String(a.roomId).replace(/\D/g, ""));
      const bn = Number(String(b.roomId).replace(/\D/g, ""));
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(a.roomId).localeCompare(String(b.roomId));
    });
  }, [payments, tenants, rooms]);

  const filteredHistoryPayments = React.useMemo(() => {
    // ✅ History should come only from local ledger (paid records, regardless of tenant status/room)
    let result = paidLedger.map((e) => ({
      id: e.id,
      tenant: e.tenantId || e.tenant, // handle both old and new ledger formats
      tenantName: e.tenantName,
      month: e.month,
      year: e.year,
      totalAmount: e.totalAmount,
      record_status: "Deleted",
      status: "paid",
      paidAt: e.paidAt,
    } as any));
    if (historyFilterRoomPk) {
      result = result.filter((p) => {
        const tenant = tenants.find((t) => String(t.id) === String(p.tenant));
        // Include if tenant is found and matches room, but also include if tenant not found
        // (tenant may have left, but we keep ledger history forever)
        return !tenant || String(tenant.roomPk) === String(historyFilterRoomPk);
      });
    }
    return result.sort((a, b) => {
      const da = new Date(a.date_month || `${a.year || currentYear}-01-01`).getTime();
      const db = new Date(b.date_month || `${b.year || currentYear}-01-01`).getTime();
      return db - da;
    });
  }, [paidLedger, tenants, historyFilterRoomPk, currentYear]);

  const handleAddPayment = () => {
    if (!selectedTenant || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please select room and month",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Room not found for this selection",
        variant: "destructive",
      });
      return;
    }

    const unitsUsed = currReading - prevReading;
    const electricityAmount = unitsUsed * settings.electricityRate;
    const totalAmount = (selectedRoom?.rent || 0) + electricityAmount;
    const monthIndex = months.indexOf(selectedMonth) + 1;

    const hasExistingForRoomAndMonth = payments.some((p) => {
      const t = tenants.find((tt) => tt.id === p.tenant);
      if (!t) return false;
      const r = rooms.find((rr) => rr.id === t.roomPk);
      if (!r || !selectedRoom) return false;
      return (
        r.id === selectedRoom.id &&
        (p.month || formatMonth(selectedMonth, currentYear)).toLowerCase() ===
          selectedMonth.toLowerCase() &&
        (p.year || currentYear) === currentYear
      );
    });

    if (hasExistingForRoomAndMonth) {
      toast({
        title: "Payment already exists",
        description: `Room ${selectedRoom.roomId} already has a payment recorded for ${selectedMonth} ${currentYear}.`,
        variant: "destructive",
      });
      return;
    }

    addPayment({
      tenant: selectedTenant.id,
      date_month: `${currentYear}-${String(monthIndex).padStart(2, "0")}-01`,
      previous_reading: prevReading,
      current_reading: currReading,
      unit_charge: settings.electricityRate,
      remarks: "",
      extra: {},
      month: selectedMonth,
      year: currentYear,
    });

    toast({
      title: "Payment record added",
      description: "New payment entry has been created.",
    });
    setIsAddingPayment(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedRoomPk("");
    setSelectedMonth("");
    setPrevReading(0);
    setCurrReading(0);
  };

  // ✅ UPDATED: Mark Paid karke History view pe redirect karo
  const handleMarkAsPaid = async (paymentId: string) => {
    // Find the bill snapshot from API or cached known bills
    const bill = payments.find((p) => String(p.id) === String(paymentId)) ||
      allKnownBills.find((p) => String(p.id) === String(paymentId));

    // Build ledger entry (persist BEFORE calling server)
    const room = bill ? getRoomByBill(bill) : undefined;
    const electricityAmount = bill ? getElectricityAmount(bill) : 0;
    const rent = room?.rent || 0;
    const totalAmount = bill ? (bill.totalAmount ?? bill.amount ?? (electricityAmount + rent)) : 0;

    const tenantRecord = bill ? tenants.find((t) => t.id === bill.tenant) : null;
    const ledgerEntry = {
      id: String(paymentId),
      tenantId: String(bill?.tenant),
      tenantName: tenantRecord ? `${tenantRecord.firstName} ${tenantRecord.lastName}`.trim() : "Unknown",
      month: bill?.month,
      year: bill?.year,
      totalAmount,
      electricityAmount,
      rent,
      paidAt: Date.now(),
    };

    setPaidLedger((prev) => {
      const exists = prev.find((x) => String(x.id) === String(paymentId));
      if (exists) {
        return prev.map((x) => (String(x.id) === String(paymentId) ? { ...x, ...ledgerEntry } : x));
      }
      return [...prev, ledgerEntry];
    });

    // Immediately switch to history view and show toast
    setCurrentView("history");
    setHistoryFilterRoomPk(null);
    toast({
      title: "Payment marked as paid",
      description: "Saved to local ledger and updating server...",
    });

    // 🔥 BACKEND UPDATE (background) - best-effort
    try {
      await updatePayment(paymentId, { record_status: "Deleted" } as any);
    } catch (err) {
      toast({
        title: "Server error",
        description: "Failed to update payment on server. Local ledger saved.",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = (paymentId: string, tenantName: string) => {
    sendPaymentReminder(paymentId);
    toast({
      title: "Reminder sent",
      description: `Payment reminder has been sent to ${tenantName}.`,
    });
  };

  // Stats calculated from ONLY visible payments (active tenants)
  const visiblePending = filteredPayments.filter((p) => !isBillPaid(p));
  const visiblePaid = filteredPayments.filter((p) => isBillPaid(p));

  const paidCount = visiblePaid.length;
  const pendingCount = visiblePending.length;
  const totalCollected = visiblePaid.reduce(
    (sum, p) => sum + (p.totalAmount ?? p.amount ?? 0),
    0,
  );

  const sendWhatsAppReminder = (
    phone: string,
    tenantName: string,
    roomId: string,
    month: string,
    amount: number,
    prevReading: number,
    currReading: number,
    unitsUsed: number,
    electricityAmount: number,
    roomRent: number,
    toast: any,
  ) => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Phone number not found",
        variant: "destructive",
      });
      return;
    }

    let cleanPhone = phone.replace(/[\s\-+]/g, "");
    if (cleanPhone.startsWith("91")) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const upiLink = `upi://pay?pa=${UPI_CONFIG.upiId}&pn=${encodeURIComponent(
      UPI_CONFIG.payeeName,
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `Room ${roomId} ${month} Rent`,
    )}`;

    const message = `Hello ${tenantName},

📌 *Rent Payment Reminder*

🏠 Room: ${roomId}
📅 Month: ${month}

⚡ Electricity:
• Previous: ${prevReading}
• Current: ${currReading}
• Units: ${unitsUsed}

💰 Charges:
• Rent: ₹${roomRent}
• Electricity: ₹${electricityAmount}

🧾 *Total Payable: ₹${amount}*

💳 *Pay via UPI:*
${upiLink}

(Click link to pay using GPay / PhonePe / Paytm)

Thank you  
– RentEase PG Management`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4">
        {currentView === "payments" && (
          <div>
            <h1 className="page-title">Payments & Electricity</h1>
            <p className="page-subtitle">
              Manage rent and electricity billing for all tenants
            </p>
          </div>
        )}
        <div className="flex gap-2">
          {currentView === "payments" && (
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
                    <Label>Select Room</Label>
                    <Select
                      value={selectedRoomPk}
                      onValueChange={setSelectedRoomPk}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose room..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roomOptions.map((r) => (
                          <SelectItem key={r.roomPk} value={r.roomPk}>
                            {r.roomIdLabel}{" "}
                            {r.occupants > 1 ? `(${r.occupants} tenants)` : ""}
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
                        {months
                          .filter(
                            (m) => !usedMonthsForSelectedRoom.has(m.toLowerCase()),
                          )
                          .map((m) => (
                            <SelectItem key={m} value={m}>
                              {m} {currentYear}
                            </SelectItem>
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
                        <span className="text-muted-foreground">
                          Electricity (₹{settings.electricityRate}/unit):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(electricityAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room Rent:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedRoom?.rent || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base pt-2 border-t border-border">
                        <span className="font-medium">Total Bill:</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(totalBill)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingPayment(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddPayment}
                      className="gradient-primary w-full sm:w-auto"
                    >
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              setCurrentView(currentView === "history" ? "payments" : "history")
            }
          >
            {currentView === "history" ? (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Payment History
              </>
            )}
          </Button>
        </div>
      </div>

      {currentView === "payments" && (
        <>
          {/* Electricity Settings */}
          <div className="stat-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Electricity Rate</p>
                  <p className="text-sm text-muted-foreground">
                    Per unit charge for electricity
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl md:text-2xl font-bold text-foreground">
                  ₹{settings.electricityRate}
                </span>
                <span className="text-muted-foreground">/ unit</span>
                <Input
                  type="number"
                  className="w-20"
                  value={settings.electricityRate}
                  onChange={(e) =>
                    updateSettings({ electricityRate: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div
              className={cn(
                "stat-card flex items-center gap-3 md:gap-4 cursor-pointer",
                filterStatus === "all" && "ring-2 ring-primary"
              )}
              onClick={() => setFilterStatus("all")}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{pendingCount + paidCount}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            <div
              className={cn(
                "stat-card flex items-center gap-3 md:gap-4 cursor-pointer",
                filterStatus === "paid" && "ring-2 ring-success"
              )}
              onClick={() => setFilterStatus("paid")}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold text-success">{paidCount}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Paid</p>
              </div>
            </div>

            <div
              className={cn(
                "stat-card flex items-center gap-3 md:gap-4 cursor-pointer",
                filterStatus === "pending" && "ring-2 ring-warning"
              )}
              onClick={() => setFilterStatus("pending")}
            >
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
                <p className="text-base md:text-xl font-bold text-success">
                  {formatCurrency(totalCollected)}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">Collected</p>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="stat-card overflow-hidden p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
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
                  {filteredPayments.map((bill) => {
                    const room = getRoomByBill(bill);
                    const units = getUnits(bill);
                    const electricity = getElectricityAmount(bill);
                    const total = electricity + (room?.rent || 0);

                    return (
                      <tr key={bill.id}>
                        <td className="font-medium">{getRoomLabelByBill(bill)}</td>
                        <td>{formatMonth(bill.month || "May", bill.year || 2026)}</td>
                        <td>{units}</td>
                        <td>{formatCurrency(electricity)}</td>
                        <td>{formatCurrency(room?.rent || 0)}</td>
                        <td>{formatCurrency(total)}</td>
                        <td>
                          <span
                            className={cn(
                              "status-badge text-xs",
                              isBillPaid(bill) ? "status-paid" : "status-pending"
                            )}
                          >
                            {isBillPaid(bill) ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBillPaid(bill)}
                              onClick={() => handleMarkAsPaid(bill.id)}
                            >
                              {isBillPaid(bill) ? "Paid" : "Mark Paid"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const tenant = getPrimaryTenantByBill(bill);
                                if (!tenant?.phone) {
                                  toast({
                                    title: "Error",
                                    description: "Tenant phone not found",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                const room = getRoomByBill(bill);
                                const units = getUnits(bill);
                                const electricity = getElectricityAmount(bill);
                                const total = electricity + (room?.rent || 0);

                                sendWhatsAppReminder(
                                  tenant.phone,
                                  `${tenant.firstName} ${tenant.lastName}`,
                                  room?.roomId || "",
                                  formatMonth(bill.month || "May", bill.year || 2026),
                                  total,
                                  bill.previous_reading,
                                  bill.current_reading,
                                  units,
                                  electricity,
                                  room?.rent || 0,
                                  toast
                                );
                              }}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {filteredPayments.map((payment) => {
                const tenant = getTenantByBill(payment);
                const room = getRoomByBill(payment);
                const units = getUnits(payment);
                const electricity = getElectricityAmount(payment);

                return (
                  <div
                    key={payment.id}
                    className={cn(
                      "p-4 rounded-xl border",
                      isBillPaid(payment)
                        ? "bg-success/5 border-success/20"
                        : "bg-warning/5 border-warning/20",
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {tenant
                              ? `${tenant.firstName} ${tenant.lastName}`.charAt(0)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{getRoomLabelByBill(payment)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getRoomTenantsLabelByBill(payment)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "status-badge text-xs",
                          isBillPaid(payment) ? "status-paid" : "status-pending",
                        )}
                      >
                        {isBillPaid(payment) ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Month:</span>
                        <span className="ml-1 font-medium">{payment.month}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Units:</span>
                        <span className="ml-1 font-medium">{payment.units}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(room?.rent || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Electric:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(electricity)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground">Total:</span>
                        {(() => {
                          const room = getRoomByBill(payment);
                          const amount = payment.totalAmount ?? payment.amount ?? (getElectricityAmount(payment) + (room?.rent || 0));
                          return (
                            <span className="ml-2 text-lg font-bold text-primary">
                              {formatCurrency(amount)}
                            </span>
                          );
                        })()}
                      </div>
                      {!isBillPaid(payment) && (
                        <div className="flex gap-2">
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
                              if (!tenant) {
                                toast({
                                  title: "Error",
                                  description: "Tenant not found",
                                  variant: "destructive",
                                });
                                return;
                              }

                              if (!tenant.phone) {
                                toast({
                                  title: "Error",
                                  description: `No phone number for ${tenant.firstName} ${tenant.lastName}`,
                                  variant: "destructive",
                                });
                                return;
                              }

                              sendWhatsAppReminder(
                                tenant.phone,
                                `${tenant.firstName} ${tenant.lastName}`,
                                room?.roomId || "",
                                payment.month,
                                payment.amount,
                                payment.previous_reading,
                                payment.current_reading,
                                payment.units,
                                electricity,
                                room?.rent || 0,
                                toast,
                              );

                              sendPaymentReminder(payment.id);

                              toast({
                                title: "Reminder Sent",
                                description: `WhatsApp reminder sent to ${tenant.firstName}`,
                              });
                            }}
                            disabled={payment.reminder_sent}
                          >
                            <Bell
                              className={cn(
                                "h-4 w-4",
                                payment.reminder_sent && "text-muted-foreground",
                              )}
                            />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No payment records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add new payment entries to get started
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {currentView === "history" && (
        <>
          {/* Payment History Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Payment History</h2>
              <p className="text-sm text-muted-foreground">
                All payment records sorted by latest date —{" "}
                <span className="text-success font-medium">{paidCount} Paid</span>
                {" · "}
                <span className="text-warning font-medium">{pendingCount} Pending</span>
              </p>
            </div>
          </div>

          {/* Room Filter */}
          <div className="mb-4 flex items-center gap-3">
            <Label className="text-sm font-medium whitespace-nowrap">Filter by Room:</Label>
            <Select
              value={historyFilterRoomPk || "all"}
              onValueChange={(val) => setHistoryFilterRoomPk(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {historyRoomFilterOptions.map((option) => (
                  <SelectItem key={option.roomPk} value={option.roomPk}>
                    Room {option.roomId} ({option.count} months)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment History Table */}
          <div className="stat-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Year</th>
                    {!historyFilterRoomPk && <th>Room</th>}
                    <th>Tenant</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryPayments.map((p) => {
                    const room = getRoomByBill(p);
                    const tenant = getTenantByBill(p);
                    const amount =
                      p.totalAmount ?? p.amount ?? (getElectricityAmount(p) + (room?.rent || 0));
                    return (
                      <tr key={p.id}>
                        <td>{formatMonth(p.month || "May", p.year || currentYear)}</td>
                        <td>
                          {p.year ||
                            (p.date_month
                              ? new Date(p.date_month).getFullYear()
                              : currentYear)}
                        </td>
                        {!historyFilterRoomPk && (
                          <td>{room ? room.roomId || getRoomNumber(room.id) : "—"}</td>
                        )}
                        <td>
                          {tenant
                            ? `${tenant.firstName} ${tenant.lastName}`.trim()
                            : "—"}
                        </td>
                        <td>{formatCurrency(amount)}</td>
                        <td>
                          <span
                            className={cn(
                              "status-badge text-xs",
                              p.status === "paid" ? "status-paid" : "status-pending"
                            )}
                          >
                            {p.status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredHistoryPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center p-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">
                  {historyFilterRoomPk
                    ? "No payments found for this room"
                    : "No payment history found"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Payment records will appear here
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
