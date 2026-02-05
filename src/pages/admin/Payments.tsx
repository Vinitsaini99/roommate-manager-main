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

  // Get current year for dynamic display
  const currentYear = new Date().getFullYear();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending">(
    "all",
  );
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [currentView, setCurrentView] = useState<"payments" | "history">("payments");
  const [historyFilterRoomPk, setHistoryFilterRoomPk] = useState<string | null>(null);
  // Select a ROOM (unique) instead of tenant (avoid duplicates for double/triple rooms)
  const [selectedRoomPk, setSelectedRoomPk] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [prevReading, setPrevReading] = useState(0);
  const [currReading, setCurrReading] = useState(0);

  // Filter active tenants with valid room assignments
  const activeTenants = tenants.filter((t) => t.isActive && (t.roomId || t.roomPk));

  // Helpers to resolve tenant/room and bill breakdown
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

  const getUnits = (bill: any) => bill.current_reading - bill.previous_reading;

  const getElectricityAmount = (bill: any) => getUnits(bill) * bill.unit_charge;

  // Unique occupied rooms list for dropdown
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

    // Sort by numeric part if possible
    return options.sort((a, b) => {
      const an = Number(String(a.roomIdLabel).replace(/\D/g, ""));
      const bn = Number(String(b.roomIdLabel).replace(/\D/g, ""));
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(a.roomIdLabel).localeCompare(String(b.roomIdLabel));
    });
  }, [activeTenants, rooms]);

  // Refresh payments on mount
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((p) => {
    const tenant = tenants.find((t) => t.id === p.tenant);

    // If search query is empty, match all
    const matchesSearch =
      searchQuery === "" ||
      (tenant
        ? `${tenant.firstName} ${tenant.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : false);

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const tenantsInSelectedRoom = React.useMemo(() => {
    if (!selectedRoomPk) return [];
    return activeTenants.filter(
      (t) => String(t.roomPk) === String(selectedRoomPk),
    );
  }, [activeTenants, selectedRoomPk]);

  // Backend needs a tenant FK; we pick the first active tenant from that room.
  const selectedTenant = tenantsInSelectedRoom[0];
  const selectedRoom = rooms.find(
    (r) => String(r.id) === String(selectedRoomPk),
  );

  const unitsUsed = currReading - prevReading;
  const electricityAmount = unitsUsed * settings.electricityRate;
  const totalBill = (selectedRoom?.rent || 0) + electricityAmount;

  // ✅ Hide months that already have a bill for the selected room (any status)
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
    return String(roomId); // ✅ Direct room number (1, 2, 3, ...)
  };

  // 🔁 Auto-fill previous reading from latest bill of this room (if any)
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

  // Build room options for Payment History filter
  const historyRoomFilterOptions = React.useMemo(() => {
    const roomPaymentMap = new Map<string, { room: any; count: number }>();

    // Group payments by room
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

    // Convert to options array and sort
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

  // Filter payments for history view
  const filteredHistoryPayments = React.useMemo(() => {
    let result = [...payments];
    if (historyFilterRoomPk) {
      result = result.filter((p) => {
        const tenant = tenants.find((t) => t.id === p.tenant);
        return tenant && String(tenant.roomPk) === String(historyFilterRoomPk);
      });
    }
    return result.sort((a, b) => {
      const da = new Date(a.date_month || `${a.year || currentYear}-01-01`).getTime();
      const db = new Date(b.date_month || `${b.year || currentYear}-01-01`).getTime();
      return db - da;
    });
  }, [payments, tenants, historyFilterRoomPk, currentYear]);

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

    // ❌ Block duplicate payment for same ROOM + MONTH + YEAR
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
      // ✅ Backend ElectricityBill fields only
      tenant: selectedTenant.id,
      date_month: `${currentYear}-${String(monthIndex).padStart(2, "0")}-01`,
      previous_reading: prevReading,
      current_reading: currReading,
      unit_charge: settings.electricityRate,
      remarks: "",
      extra: {},

      // (Optional UI helpers — backend will ignore because DataContext maps payload)
      month: selectedMonth,
      year: currentYear,
      status: "pending",
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

 const handleMarkAsPaid = async (paymentId: string) => {
  try {
    await updatePayment(paymentId, {
      status: "paid", // 👈 THIS FIXES 400
    });

    await fetchPayments();

    toast({
      title: "Payment updated",
      description: "Payment has been marked as paid.",
    });
  } catch (err) {
    toast({
      title: "Update failed",
      description: "Backend rejected the request",
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

  const paidCount = payments.filter((p) => p.status === "paid").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.totalAmount ?? p.amount ?? 0), 0);

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

    // ✅ UPI Payment Link
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

  // const tenant = tenants.find(t => t.id === payment.tenantId);

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

                <div className="flex flex-col sm:flex-row justify-end gap-3 ">
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

  {/* TOTAL */}
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
      <p className="text-lg md:text-2xl font-bold">
        {payments.length}
      </p>
      <p className="text-xs md:text-sm text-muted-foreground">
        Total
      </p>
    </div>
  </div>

  {/* PAID */}
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
      <p className="text-lg md:text-2xl font-bold text-success">
        {paidCount}
      </p>
      <p className="text-xs md:text-sm text-muted-foreground">
        Paid
      </p>
    </div>
  </div>

  {/* PENDING */}
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
      <p className="text-lg md:text-2xl font-bold text-warning">
        {pendingCount}
      </p>
      <p className="text-xs md:text-sm text-muted-foreground">
        Pending
      </p>
    </div>
  </div>

  {/* COLLECTED */}
  <div className="stat-card flex items-center gap-3 md:gap-4">
  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
    <IndianRupee className="h-5 w-5 md:h-6 md:w-6 text-success" />
  </div>
  <div>
    <p className="text-base md:text-xl font-bold text-success">
      {formatCurrency(totalCollected)}
    </p>
    <p className="text-xs md:text-sm text-muted-foreground">
      Collected
    </p>
  </div>
</div>


</div>

        {/* Payments Table - Mobile Cards + Desktop Table */}
        <div className="stat-card overflow-hidden p-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {/* <th>Tenant</th> */}
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
                // console.log("STATUS CHECK 👉", bill.status, bill.record_status);
const isPaid = bill.status === "paid";



return (
  <tr key={bill.id}>
                    {/* 🔥 ROOM FIRST (with tenant count) */}
                    <td className="font-medium">{getRoomLabelByBill(bill)}</td>

                    <td>
                      {formatMonth(bill.month || "May", bill.year || 2026)}
                    </td>
                    <td>{units}</td>
                    <td>{formatCurrency(electricity)}</td>
                    <td>{formatCurrency(room?.rent || 0)}</td>
                    <td>{formatCurrency(total)}</td>

                    <td>
                     <span
  className={cn(
    "status-badge text-xs",
    isPaid ? "status-paid" : "status-pending"
  )}
>
  {isPaid ? "Paid" : "Pending"}
</span>


                    </td>

                    <td>
  <div className="flex gap-2">
    {/* Mark Paid */}
  <Button
  size="sm"
  variant="outline"
  disabled={isPaid}
  onClick={() => handleMarkAsPaid(bill.id)}
>
  {isPaid ? "Paid" : "Mark Paid"}

</Button>


    {/* 🔔 Send Reminder */}
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
                  payment.status === "paid"
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
                      <p className="font-medium">
                        {getRoomLabelByBill(payment)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getRoomTenantsLabelByBill(payment)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "status-badge text-xs",
                      payment.status === "paid"
                        ? "status-paid"
                        : "status-pending",
                    )}
                  >
                    {payment.status === "paid" ? "Paid" : "Pending"}
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
                    <span className="text-sm text-muted-foreground">
                      Total:
                    </span>
                    <span className="ml-2 text-lg font-bold text-primary">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  {payment.status === "pending" && (
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
            <p className="font-medium text-foreground">
              No payment records found
            </p>
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
              <p className="text-sm text-muted-foreground">All payment records sorted by latest date</p>
            </div>
            {/* <Button 
              variant="outline" 
              onClick={() => setCurrentView("payments")}
            >
              ← Back to Payments
            </Button> */}
          </div>

          {/* Room Filter - Above Table, Left Aligned */}
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
                <SelectItem value="all">All Rooms </SelectItem>
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
                    const amount = p.totalAmount ?? p.amount ?? (getElectricityAmount(p) + (room?.rent || 0));
                    return (
                      <tr key={p.id}>
                        <td>{formatMonth(p.month || "May", p.year || currentYear)}</td>
                        <td>{p.year || (p.date_month ? new Date(p.date_month).getFullYear() : currentYear)}</td>
                        {!historyFilterRoomPk && (
                          <td>{room ? room.roomId || getRoomNumber(room.id) : "—"}</td>
                        )}
                        <td>{tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : "—"}</td>
                        <td>{formatCurrency(amount)}</td>
                        <td>
                          <span className={cn("status-badge text-xs", p.status === "paid" ? "status-paid" : "status-pending")}>
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
                  {historyFilterRoomPk ? "No payments found for this room" : "No payment history found"}
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
