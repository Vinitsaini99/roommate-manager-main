// src/pages/admin/Tenants.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, User as UserIcon, Download } from "lucide-react";
import api from "@/api/api";
import { useData, type Room, type Tenant } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { downloadTenantPDF } from "@/utils/tenantPdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TenantFormFields, {
  type TenantFormData,
} from "@/components/rooms/TenantFormFields";

const emptyTenantForm: TenantFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  aadhaarNumber: "",
  tokenMoney: 0,
  stateId: undefined,  // backend numeric ID
  cityId: undefined,   // backend numeric ID
};

function getRoomTypeLabel(type: string) {
  switch (type) {
    case "single":
      return "Single";
    case "double":
      return "Double";
    case "triple":
      return "Triple";
    default:
      return type;
  }
}

function tenantToForm(t: Tenant): TenantFormData {
  return {
    firstName: t.firstName ?? "",
    lastName: t.lastName ?? "",
    email: t.email ?? "",
    phone: t.phone ?? "",
    landmark: t.landmark ?? "",
    // Pass numeric IDs as strings for form to lookup and pre-select
    city: String(t.city ?? ""),
    state: String(t.state ?? ""),
    pincode: t.pincode ?? "",
    aadhaarNumber: t.aadhaarNumber ?? "",
    tokenMoney: Number(t.tokenMoney ?? 0),
    // Pre-populate numeric IDs if they're available
    stateId: typeof t.state === "number" ? t.state : undefined,
    cityId: typeof t.city === "number" ? t.city : undefined,
  };
}

export default function AdminTenants() {
  const { toast } = useToast();
  const { rooms, tenants, fetchRooms, fetchTenants, createTenant } = useData();

  const [selectedRoomPkForDetails, setSelectedRoomPkForDetails] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormData>(emptyTenantForm);
  const [selectedRoomPk, setSelectedRoomPk] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const getRoomCapacity = (type: Room["type"]) => {
    if (type === "single") return 1;
    if (type === "double") return 2;
    return 3;
  };

  

  useEffect(() => {
    fetchRooms();
    fetchTenants();
  }, [fetchRooms, fetchTenants]);

  const activeTenants = useMemo(
    () => tenants.filter((t) => t.isActive),
    [tenants],
  );

  const getRoomForTenant = (tenant: Tenant): Room | null =>
    rooms.find((r) => r.roomId === tenant.roomId || r.id === tenant.roomPk) ?? null;

  const roomsGrouped = useMemo(() => {
    // ✅ Show only OCCUPIED rooms (rooms having at least 1 active tenant)
    const list = rooms
      .map((room) => {
      const roomTenants = activeTenants.filter(
        (t) => t.roomPk === room.id || t.roomId === room.roomId,
      );
      return { room, tenants: roomTenants };
      })
      .filter((x) => x.tenants.length > 0);

    return list.sort((a, b) => {
      const an = Number(a.room.roomId);
      const bn = Number(b.room.roomId);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return String(a.room.roomId).localeCompare(String(b.room.roomId));
    });
  }, [rooms, activeTenants]);

  const roomOptions = useMemo(() => {
    // Allow choosing any room that is NOT full.
    // While editing, also allow the tenant's current room even if it is full.
    const currentRoomPk = selectedRoomPk;
    return rooms.filter((r) => {
      if (r.id === currentRoomPk) return true;
      const occ = activeTenants.filter(
        (t) => t.roomPk === r.id || t.roomId === r.roomId,
      ).length;
      return occ < getRoomCapacity(r.type);
    });
  }, [rooms, selectedRoomPk, activeTenants]);

  const detailsRoomGroup = useMemo(() => {
    if (!selectedRoomPkForDetails) return null;
    return (
      roomsGrouped.find((g) => g.room.id === selectedRoomPkForDetails) ??
      null
    );
  }, [roomsGrouped, selectedRoomPkForDetails]);

  const openAdd = () => {
    setMode("add");
    setEditingTenantId(null);
    setForm(emptyTenantForm);
    setSelectedRoomPk("");
    setIsDialogOpen(true);
  }; 

  const openEdit = (tenant: Tenant) => {
    setMode("edit");
    setEditingTenantId(tenant.id);
    setForm(tenantToForm(tenant));
    setSelectedRoomPk(tenant.roomPk ?? "");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsSaving(false);
  };

  const handleSave = async () => {
    if (!selectedRoomPk) {
      toast({
        title: "Room required",
        description: "Please select a room before saving.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation (same required fields as RoomModal)
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast({
        title: "Validation error",
        description: "First name, last name, email and phone are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Clean phone number
      const cleanPhone = String(form.phone || "").replace(/\D/g, "");

      if (mode === "add") {
  await createTenant({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: cleanPhone,
    state: form.stateId || null,
    city: form.cityId || null,
    pincode: form.pincode || "",
    
    aadhaarNumber: form.aadhaarNumber,
    tokenMoney: Number(form.tokenMoney ?? 0),

    // 🔥 IMPORTANT FIX
    remarks: form.landmark,

    roomId: selectedRoomPk,
    joinDate: new Date().toISOString().split("T")[0],
  });

      } else {
        if (!editingTenantId) return;

        // Clean phone number (remove spaces and formatting)
        const cleanPhone = String(form.phone || "").replace(/\D/g, "");

        // Payload for editing - send state_id and city_id when available
        const payload = {
  first_name: form.firstName,
  last_name: form.lastName,
  email: form.email,

  // ✅ backend expects this
  phone: cleanPhone,

  remarks: form.landmark || "",
  pincode: form.pincode || "",
  aadhaar_no: form.aadhaarNumber || "",

  // ✅ backend expects `token`, NOT token_money
  token: Number(form.tokenMoney ?? 0),

  // ✅ FK names
  room: Number(selectedRoomPk),
  state: form.stateId ?? null,
  city: form.cityId ?? null,
};

console.log("FINAL PATCH payload", payload);
await api.patch(`/tenants/${editingTenantId}/`, payload);


        // Add state and city IDs if available
        // if (form.stateId) {
        //   // payload.state = form.stateId;
        //   payload.state_id = form.stateId;
        // }
        // if (form.cityId) {
        //   // payload.city = form.cityId;
        //   payload.city_id = form.cityId;
        // }

        console.log("Saving tenant payload:", payload);
        const response = await api.patch(`/tenants/${editingTenantId}/`, payload);
        console.log("Tenant updated successfully:", response.data);
      }

      await fetchRooms();
      await fetchTenants();

      toast({
        title: mode === "add" ? "✅ Tenant added" : "✅ Tenant updated",
      });
      closeDialog();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save tenant";
      toast({
        title: "❌ Error",
        description: String(msg),
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (mode === "edit" && editingTenantId) {
      const tenant = tenants.find((t) => t.id === editingTenantId);
      if (tenant) {
        const room = getRoomForTenant(tenant);
        try {
          await downloadTenantPDF(tenant, room || undefined);
          toast({
            title: "✅ PDF Downloaded",
            description: `${tenant.firstName} ${tenant.lastName}'s details downloaded`,
          });
        } catch (err) {
          console.error("PDF download error:", err);
          toast({
            title: "❌ PDF Download Failed",
            description: "Failed to generate PDF",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Tenant not found",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">
            Add, edit and view tenant details
          </p>
        </div>
        {/* <Button onClick={openAdd} className="gradient-primary w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Table */}
        <div className="stat-card overflow-x-auto lg:col-span-2">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Occupants</th>
                <th>Tenants</th>
              </tr>
            </thead>
            <tbody>
              {roomsGrouped.map(({ room, tenants: roomTenants }) => {
                const capacity = getRoomCapacity(room.type);
                const isRowSelected = room.id === selectedRoomPkForDetails;
                const typeLabel = `${getRoomTypeLabel(room.type)} • ${room.isAC ? "AC" : "Non-AC"}`;

                return (
                  <tr
                    key={room.id}
                    onClick={() => setSelectedRoomPkForDetails(room.id)}
                    className={isRowSelected ? "bg-muted/40" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="font-medium">{room.roomId || "—"}</td>
                    <td>{typeLabel}</td>
                    <td>
                      {roomTenants.length} / {capacity}
                    </td>
                    <td className="font-medium">
                      {roomTenants.length === 0
                        ? "—"
                        : `${roomTenants
                            .slice(0, 3)
                            .map((t) => `${t.firstName} ${t.lastName}`.trim())
                            .join(", ")}${roomTenants.length > 3 ? ` +${roomTenants.length - 3} more` : ""}`}
                    </td>
                  </tr>
                );
              })}

              {roomsGrouped.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-muted-foreground">
                    No occupied rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details */}
        <div className="stat-card">
          {!detailsRoomGroup ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <UserIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Select a room</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click a room row to see occupants here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Room</p>
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    #{detailsRoomGroup.room.roomId || "—"}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {getRoomTypeLabel(detailsRoomGroup.room.type)} •{" "}
                    {detailsRoomGroup.room.isAC ? "AC" : "Non-AC"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {(String(detailsRoomGroup.room.roomId || "R").charAt(0) || "R").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Occupants</p>
                  <p className="font-medium text-foreground">
                    {detailsRoomGroup.tenants.length} / {getRoomCapacity(detailsRoomGroup.room.type)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">
                    {getRoomTypeLabel(detailsRoomGroup.room.type)} •{" "}
                    {detailsRoomGroup.room.isAC ? "AC" : "Non-AC"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rent</p>
                  <p className="font-medium text-foreground">
                    ₹{Number(detailsRoomGroup.room.rent ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">
                    {detailsRoomGroup.room.isOccupied ? "Occupied" : "Available"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Tenants in this room</p>
                  <p className="text-xs text-muted-foreground">
                    {detailsRoomGroup.tenants.length} person(s)
                  </p>
                </div>

                <div className="space-y-2">
                  {detailsRoomGroup.tenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenants in this room yet.</p>
                  ) : (
                    detailsRoomGroup.tenants.map((t) => (
                      <div
                        key={t.id}
                        className="flex flex-col gap-3 p-3 rounded-xl bg-muted/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {t.firstName} {t.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        
                        {/* Address Details */}
                        <div className="border-t border-border/50 pt-2 space-y-2">
                          {t.landmark && (
                            <div>
                              <p className="text-xs text-muted-foreground">Landmark</p>
                              <p className="text-xs font-medium text-foreground">{t.landmark}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {t.state && (
                              <div>
                                <p className="text-xs text-muted-foreground">State</p>
                                <p className="text-xs font-medium text-foreground">{t.stateName}</p>
                              </div>
                            )}
                            {t.city && (
                              <div>
                                <p className="text-xs text-muted-foreground">City</p>
                                <p className="text-xs font-medium text-foreground">{t.cityName}</p>
                              </div>
                            )}
                          </div>
                          {t.pincode && (
                            <div>
                              <p className="text-xs text-muted-foreground">Pincode</p>
                              <p className="text-xs font-medium text-foreground">{t.pincode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="mx-4 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add Tenant" : "Edit Tenant"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Select room and fill tenant details. The details panel updates live while you type.
              </p>
              <Select value={selectedRoomPk} onValueChange={setSelectedRoomPk}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roomId} • {getRoomTypeLabel(r.type)} • {r.isAC ? "AC" : "Non-AC"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only rooms with free slots are shown (plus current room while editing).
              </p>
            </div>

            <TenantFormFields
              data={form}
              updateField={(field, value) =>
                setForm((prev) => ({ ...prev, [field]: value as any }))
              }
              label={mode === "add" ? "New Tenant" : "Tenant Details"}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              {mode === "edit" && (
                <Button
                  variant="default"
                  onClick={handleDownloadPDF}
                  className="gradient-primary w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gradient-primary w-full sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}