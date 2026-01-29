import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "@/api/api";


export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  tokenMoney: number;
  // document urls coming from backend (if available)
  addressDocUrl?: string;
  idProofUrl?: string;
 
  roomId?: string;
  roomPk?: string;
  documents: Document[];
  documentsVerified: boolean;
  joinDate: string;
  isActive: boolean;
}

export interface Document {
  id: string;
  type: "address_proof" | "id_proof";
  name: string;
  url: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Room {
 id: string;
  roomId: string; // 👈 backend ka room_id
  type: "single" | "double" | "triple";
  isAC: boolean;
  rent: number;
  isOccupied: boolean;
  tenants: Tenant[];
}

interface CreateTenantPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  tokenMoney: number;
  remarks: string;
  roomId: string | number;
  joinDate?: string;
}

// DataContext.tsx
export interface Payment {
  id: string;

  tenant: string;          // FK
  date_month: string;      // YYYY-MM-DD
  month?: string;          // For display (e.g., 'May')
  year?: number;           // For filtering (e.g., 2024)
  amount?: number;         // Total amount (rent + electricity)
  totalAmount?: number;    // Same as amount
  units?: number;          // Units used (current - previous reading)
  electricityAmount?: number; // Electricity cost

  previous_reading: number;
  current_reading: number;
  unit_charge: number;

  status: 'paid' | 'pending';
  reminder_sent?: boolean;
  remarks?: string;
  extra?: any;
}




export interface TenantHistory {
  id: string;
  tenantName: string;
  tenantId: string; // 👈 reference to original tenant
  email: string;
  phone: string;
  roomId: string; // 👈 instead of roomNumber
  roomType: "single" | "double" | "triple";
  isAC: boolean;
  joinDate: string;
  leaveDate: string;
  checkoutDate: string; // 👈 When they actually left
  reason: string; // 👈 e.g., "Room vacated", "Lease ended", etc.
  totalRentPaid: number;
  facilities: string[];
}


interface Settings {
  totalRooms: number;
  electricityRate: number;
  rentRates: {
    singleNonAC: number;
    singleAC: number;
    doubleNonAC: number;
    doubleAC: number;
    tripleNonAC: number;
    tripleAC: number;
  };
}

interface DataContextType {
  rooms: Room[];
  tenants: Tenant[];
  payments: Payment[];
  tenantHistory: TenantHistory[];
  fetchRooms: () => Promise<void>;
  createTenant: (data: CreateTenantPayload) => Promise<Tenant>;
  fetchPayments: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchTenantHistory: () => Promise<void>;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  addRoom: (room: Omit<Room, "id">) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  addTenant: (tenant: Omit<Tenant, "id">) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  removeTenant: (id: string, reason?: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  verifyDocument: (tenantId: string, docId: string) => void;
  verifyAllDocuments: (tenantId: string) => void;
  moveTenantToHistory: (tenantId: string, reason?: string) => Promise<void>;
  getRent: (type: "single" | "double" | "triple", isAC: boolean) => number;
  initializeRooms: (count: number) => Promise<void>;
  deleteAllRooms: () => Promise<void>;
  sendPaymentReminder: (paymentId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: Settings = {
  totalRooms: 20,
  electricityRate: 8,
  rentRates: {
    singleNonAC: 3000,
    singleAC: 4000,
    doubleNonAC: 6000,
    doubleAC: 10000,
    tripleNonAC: 9000,
    tripleAC: 14000,
  },
};

const mapRoomFromApi = (r: any): Room => {
  const acValue = String(r.ac_non_ac ?? r.ac ?? r.is_ac ?? "").toLowerCase();
  const isACRoom = acValue === "ac" || acValue === "a/c" || r.isAC === true || r.is_ac === true;
  const roomTypeRaw = String(r.room_type ?? r.type ?? "").toLowerCase();
  const normalizedType: Room["type"] = roomTypeRaw.includes("double")
    ? "double"
    : roomTypeRaw.includes("triple")
      ? "triple"
      : "single";

  const statusRaw = String(r.status ?? r.room_status ?? r.isOccupied ?? "").toLowerCase();
  const isAvailable =
    statusRaw === "available" ||
    statusRaw.includes("available") ||
    statusRaw === "vacant" ||
    statusRaw === "empty";

  return {
    id: String(r.id),
  roomId: r.room_id,          // 👈 use this everywhere
  type: normalizedType,
  isAC: isACRoom,
  rent: Number(r.room_rent ?? r.rent ?? 0),
  // backend can send "Available"/"available"/etc. Normalize so UI doesn't become read-only incorrectly.
  isOccupied: Boolean(r.is_occupied ?? r.isOccupied) ? true : !isAvailable,
  tenants: r.tenants ?? [],
  };
};

const mapTenantFromApi = (t: any): Tenant => ({
  id: String(t.id),
  firstName: t.first_name ?? t.firstName ?? "",
  lastName: t.last_name ?? t.lastName ?? "",
  email: t.email ?? "",
  phone: t.phone_no || t.phone || "",

  // Room identifiers (both are used in UI lookups)
  roomId: t.room_detail?.room_id || t.room_id || "",
  roomPk: t.room ? String(t.room) : t.roomPk ? String(t.roomPk) : undefined,

  documents: t.documents ?? [],
  documentsVerified:
    t.documents_verified ??
    t.documentsVerified ??
    t.is_documents_verified ??
    false,
  joinDate: t.join_date ?? t.joinDate ?? "",
  isActive: t.is_active ?? t.isActive ?? true,

  // Tenant address / identity details
  landmark: t.landmark ?? "",
  city: t.city ?? "",
  state: t.state ?? "",
  pincode: t.pincode ?? "",
  aadhaarNumber: t.aadhar_no ?? t.aadhaar_no ?? t.aadhaarNumber ?? "",

  // Token / security deposit
  tokenMoney: Number(t.token_money ?? t.token ?? t.tokenMoney ?? 0),

  // Document URLs (Django file fields commonly named like this)
  addressDocUrl: t.address_doc ?? t.addressDocUrl ?? undefined,
  idProofUrl: t.id_proof ?? t.idProofUrl ?? undefined,
});

const mapPaymentFromApi = (p: any): Payment => {
  const dateMonth = p.date_month || "";
  const [year, month, day] = dateMonth.split("-");
  const monthName = month ? new Date(dateMonth).toLocaleString("en-IN", { month: "long" }) : "May";
  
  return {
    id: String(p.id),
    tenant: String(p.tenant),
    date_month: dateMonth,
    month: monthName,
    year: year ? parseInt(year) : 2026,
    amount: p.total_amount || 0,
    totalAmount: p.total_amount || 0,
    units: p.total_units || 0,
    electricityAmount: (p.total_amount || 0) - (p.room_rent || 0),
    previous_reading: p.previous_reading || 0,
    current_reading: p.current_reading || 0,
    unit_charge: p.unit_charge || 0,
    status: p.record_status === "Paid" ? "paid" : "pending",
    reminder_sent: p.reminder_sent || false,
    remarks: p.remarks || "",
  };
};


export function DataProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantHistory, setTenantHistory] = useState<TenantHistory[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const createTenant = async (data: CreateTenantPayload): Promise<Tenant> => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        throw new Error(
          "Not authenticated. Please sign in before adding tenants.",
        );
      }

      let roomId: any = data.roomId;
      if (typeof roomId === "string" && /^\d+$/.test(roomId)) {
        roomId = Number(roomId);
      }

      const payload: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_no: data.phone,
        phone: data.phone,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        aadhar_no: data.aadhaarNumber,
        aadhaar_no: data.aadhaarNumber,
        token: data.tokenMoney,
        token_money: data.tokenMoney,
        remarks: data.remarks,
        room: roomId,
        room_id: roomId,
        join_date: data.joinDate || new Date().toISOString().split("T")[0],
      };

      console.log("📤 Creating tenant with payload:", payload);
      const res = await api.post("/tenants/", payload);
      console.log("✅ Tenant created on backend:", res.data);

      const created = mapTenantFromApi(res.data);

      // Step 1: Add to frontend tenant list
      setTenants((prev) => [...prev, created]);
      console.log("✅ Tenant added to frontend");

      // Step 2: Mark room as occupied on backend
      const room = rooms.find((r) => r.roomId === String(roomId) || r.id === String(roomId));
      if (room) {
        try {
          console.log(`📤 Marking room ${room.id} as occupied...`);
          const roomUpdatePayload = {
            status: "Occupied",
          };
          console.log("📋 Room update payload:", roomUpdatePayload);
          
          const res = await api.patch(`/rooms/${room.id}/`, roomUpdatePayload);
          console.log("✅ Room marked as occupied on backend:", res.data);
        } catch (err: any) {
          console.warn("⚠️ Could not mark room as occupied:", err?.response?.status, err?.response?.data);
        }
      }

      // Step 3: Refresh both lists
      try {
        await fetchRooms();
        await fetchTenants();
        console.log("✅ Data refreshed from backend");
      } catch (err: any) {
        console.warn("⚠️ Failed to refresh data:", err?.message);
      }

      return created;
    } catch (error: any) {
      console.error("❌ createTenant error:", error);

      const status = error?.response?.status;
      if (status === 401) {
        throw new Error("Session expired — please sign in again.");
      }
      if (status === 400) {
        const detail =
          error.response?.data?.detail || error.response?.data?.message;
        if (detail) {
          throw new Error(`Validation error: ${detail}`);
        }
      }

      if (error.response) {
        console.error("createTenant response data:", error.response.data);
        const serverMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          JSON.stringify(error.response.data);
        if (serverMessage && serverMessage !== "[object Object]") {
          throw new Error(serverMessage);
        }
      }
      throw error;
    }
  };

  const getRent = (
    type: "single" | "double" | "triple",
    isAC: boolean,
  ): number => {
    if (type === "single") {
      return isAC
        ? settings.rentRates.singleAC
        : settings.rentRates.singleNonAC;
    }
    if (type === "double") {
      return isAC
        ? settings.rentRates.doubleAC
        : settings.rentRates.doubleNonAC;
    }
    return isAC ? settings.rentRates.tripleAC : settings.rentRates.tripleNonAC;
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const initializeRooms = async (count: number) => {
    try {
      console.log(`Creating ${count} rooms...`);

      for (let i = 1; i <= count; i++) {
        const payload = {
  room_id: String(i),         // ✅ UNIQUE ID (1, 2, 3, ...)
  room_type: "Single",        // ✅ MUST match choices
  ac_non_ac: "Non-AC",        // ✅ MUST match choices
  room_rent: 3000,            // ✅ number
  status: "Available",        // ✅ valid choice
  facility: 1,                // ✅ FK ID
  remarks: "",
  extra: {},
};

        try {
          console.log(`Creating room #${i}:`, payload);
          await api.post("/rooms/", payload);
          console.log(`Room #${i} created successfully`);
        } catch (err: any) {
          const status = err?.response?.status;
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err.message;
          console.error(`Room #${i} failed (Status: ${status}):`, msg);
          throw err;
        }
      }

      console.log(`All ${count} rooms created successfully`);
      await fetchRooms();
    } catch (error) {
      console.error("initializeRooms error:", error);
      throw error;
    }
  };

  const deleteAllRooms = async () => {
    try {
      // First, fetch fresh list from backend to ensure we're deleting everything
      const freshRes = await api.get("/rooms/");
      const allRoomsFromBackend = Array.isArray(freshRes.data)
        ? freshRes.data
        : freshRes.data?.results || [];

      console.log(
        `🗑️ Fetched ${allRoomsFromBackend.length} rooms from backend, deleting...`,
      );

      let deletedCount = 0;
      let failedCount = 0;

      for (const room of allRoomsFromBackend) {
        try {
          await api.delete(`/rooms/${room.id}/`);
          deletedCount++;
          console.log(
            `✅ Room #${room.room_number || room.id} (Backend ID: ${room.id}) deleted`,
          );
        } catch (err: any) {
          failedCount++;
          console.error(
            `❌ Room #${room.room_number || room.id} (ID: ${room.id}) deletion failed:`,
            err?.response?.status,
            err?.response?.data?.message,
          );
        }
      }

      console.log(
        `🎉 Deletion complete: ${deletedCount} deleted, ${failedCount} failed`,
      );

      // Clear from frontend immediately
      setRooms([]);
      setTenants([]);
      // setSettings(prev => ({ ...prev, totalRooms: 0 }));

      // Verify deletion by fetching again
      const verifyRes = await api.get("/rooms/");
      const remainingRooms = Array.isArray(verifyRes.data)
        ? verifyRes.data
        : verifyRes.data?.results || [];
      console.log(
        `✅ Verified: ${remainingRooms.length} rooms remaining in backend`,
      );

      if (remainingRooms.length > 0) {
        console.warn(
          `⚠️ WARNING: Still ${remainingRooms.length} rooms in backend after deletion!`,
        );
      }
    } catch (error) {
      console.error("Error in deleteAllRooms:", error);
      throw error;
    }
  };

  //  const addRoom = async (room: Omit<Room, "id">) => {
  //   const res = await api.post("/rooms/", {
  //     room_type: room.type,
  //     ac_non_ac: room.isAC ? "ac" : "non-ac",
  //     room_rent: room.rent,
  //     remarks: "ok",
  //     facility: 1,
  //   });

  //   const savedRoom = {
  //     id: String(res.data.id),
  //     roomNumber: room.roomNumber ?? 0,
  //     type: res.data.room_type,
  //     isAC: res.data.ac_non_ac === "ac",
  //     rent: res.data.room_rent,
  //     isOccupied: false,
  //     tenants: [],
  //   };

  //   setRooms(prev => [...prev, savedRoom]); // 🔥 UI update
  // };

  //  const updateRoom = async (id: string, updates: Partial<Room>) => {
  //   await api.put(`/rooms/${id}/`, {
  //     room_type: updates.type,
  //     ac_non_ac: updates.isAC ? "ac" : "non-ac",
  //     room_rent: updates.rent,
  //     remarks: "ok",
  //     facility: 1,
  //   });

  //   setRooms(prev =>
  //     prev.map(r => (r.id === id ? { ...r, ...updates } : r))
  //   );
  // };

  // DataContext.tsx
  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        console.warn("No auth token - skipping fetchRooms");
        return;
      }

      const res = await api.get("/rooms/");
      console.log("✅ ROOMS API Response:", {
        status: res.status,
        data: res.data,
        type: typeof res.data,
        isArray: Array.isArray(res.data),
      });

      // Check if response is an array or object with array inside
      const roomsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
      
      console.log(`📊 Processed ${roomsArray.length} rooms`);

      setRooms(roomsArray.map(mapRoomFromApi));
    } catch (err: any) {
      console.error("❌ fetchRooms ERROR:", {
        status: err?.response?.status,
        message: err?.message,
        data: err?.response?.data,
        url: err?.config?.url,
      });
    }
  }, []);

  const addRoom = async (room: Omit<Room, "id">) => {
    const toBackendRoomType = (type: Room["type"]) =>
      type === "double" ? "Double" : type === "triple" ? "Triple" : "Single";
    const toBackendAc = (isAC: boolean) => (isAC ? "AC" : "Non-AC");

    // Keep payload aligned with backend expectations used elsewhere in app
    const res = await api.post("/rooms/", {
      room_id: String(room.roomId ?? ""),
      room_type: toBackendRoomType(room.type),
      ac_non_ac: toBackendAc(room.isAC),
      room_rent: Number(room.rent ?? 0),
      status: "Available",
      facility: 1,
      remarks: "",
    });

    setRooms((prev) => [...prev, mapRoomFromApi(res.data)]);
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const toBackendRoomType = (type: Room["type"]) =>
      type === "double" ? "Double" : type === "triple" ? "Triple" : "Single";
    const toBackendAc = (isAC: boolean) => (isAC ? "AC" : "Non-AC");

    const current = rooms.find((r) => r.id === id);

    // PUT expects full/consistent shape in this backend (same as Rooms.tsx)
    const res = await api.put(`/rooms/${id}/`, {
      room_id: String(current?.roomId ?? ""),
      room_type: updates.type ? toBackendRoomType(updates.type as Room["type"]) : undefined,
      ac_non_ac: typeof updates.isAC === "boolean" ? toBackendAc(updates.isAC) : undefined,
      room_rent: typeof updates.rent === "number" ? Number(updates.rent) : undefined,
      facility: 1,
      remarks: "",
    });

    setRooms((prev) =>
      prev.map((r) => (r.id === id ? mapRoomFromApi(res.data) : r)),
    );
  };

  const fetchTenants = useCallback(async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        console.warn("No auth token - skipping fetchTenants");
        return;
      }

      const res = await api.get("/tenants/");
      console.log("✅ TENANTS API Response:", {
        status: res.status,
        data: res.data,
        type: typeof res.data,
        isArray: Array.isArray(res.data),
      });

      // Check if response is an array or object with array inside
      const tenantsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
      
      console.log(`📊 Processed ${tenantsArray.length} tenants`);

      setTenants(tenantsArray.map(mapTenantFromApi));
    } catch (err: any) {
      console.error("❌ fetchTenants ERROR:", {
        status: err?.response?.status,
        message: err?.message,
        data: err?.response?.data,
        url: err?.config?.url,
      });
    }
  }, []);

  const fetchPayments = useCallback(async () => {
  try {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      console.warn("No auth token - skipping fetchPayments");
      return;
    }

    const res = await api.get("/electricity-bills/");
    console.log("✅ PAYMENTS API Response:", {
      status: res.status,
      data: res.data,
      type: typeof res.data,
      isArray: Array.isArray(res.data),
    });
    
    // Handle array or paginated response
    const paymentsArray = Array.isArray(res.data)
      ? res.data
      : res.data?.results || res.data?.data || [];
    
    console.log(`📊 Processed ${paymentsArray.length} payments`);
    
    // Map payments from API format to frontend format
    const mappedPayments = paymentsArray.map(mapPaymentFromApi);
    setPayments(mappedPayments);
  } catch (err: any) {
    console.error("❌ fetchPayments ERROR:", {
      status: err?.response?.status,
      message: err?.message,
      data: err?.response?.data,
      url: err?.config?.url,
    });
    setPayments([]);
  }
}, []);

const fetchTenantHistory = useCallback(async () => {
  try {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      console.warn("No auth token - skipping fetchTenantHistory");
      return;
    }

    const res = await api.get("/tenant-history/");
    console.log("✅ TENANT HISTORY API Response:", {
      status: res.status,
      data: res.data,
      type: typeof res.data,
      isArray: Array.isArray(res.data),
    });

    const historyArray = Array.isArray(res.data)
      ? res.data
      : res.data?.results || res.data?.data || [];

    console.log(`📊 Processed ${historyArray.length} tenant history records`);

    if (historyArray.length === 0) {
      console.warn("⚠️ No tenant history records found");
      setTenantHistory([]);
      return;
    }

    const mappedHistory = historyArray.map((h: any) => {
      // ✅ FIX: Safely handle tenant object
      const tenantObj = typeof h.tenant === "object" && h.tenant !== null ? h.tenant : {};
      // ✅ FIX: Safely handle room object
      const roomObj = typeof h.room === "object" && h.room !== null ? h.room : {};

      // ✅ FIX: Provide fallback values if tenant object is null/undefined
      const tenantFirstName = tenantObj?.first_name || tenantObj?.firstName || "Unknown";
      const tenantLastName = tenantObj?.last_name || tenantObj?.lastName || "";

      const rawName =
        h.tenant_name ||
        h.tenantName ||
        `${tenantFirstName} ${tenantLastName}`.trim();

      const roomIdValue =
        roomObj?.room_id ||
        h.room_detail?.room_id ||
        h.room_id ||
        h.room_number ||
        h.room ||
        roomObj?.id ||
        "";

      const rawRoomType =
        roomObj?.room_type || h.room_type || h.roomType || "single";
      const roomTypeLower = String(rawRoomType).toLowerCase();

      return {
        id: String(h.id),
        tenantName: rawName || "Unknown",
        tenantId: String(
          h.tenant_id || tenantObj?.id || h.tenantId || tenantObj?.pk || "",
        ),
        email: tenantObj?.email || h.email || "",
        phone: tenantObj?.phone_no || tenantObj?.phone || h.phone || "",
        roomId: roomIdValue ? String(roomIdValue) : "",
        roomType: roomTypeLower.includes("double")
          ? "double"
          : roomTypeLower.includes("triple")
          ? "triple"
          : "single",
        isAC:
          (roomObj?.ac_non_ac ||
            roomObj?.ac ||
            roomObj?.is_ac ||
            h.ac_non_ac ||
            "Non-AC") === "AC",
        joinDate: h.join_date || h.joinDate || "",
        leaveDate: h.leave_date || h.leaveDate || new Date().toISOString(),
        checkoutDate: h.checkout_date || h.checkoutDate || "",
        reason: h.reason || "",
        totalRentPaid: Number(h.total_rent_paid ?? h.totalRentPaid ?? 0),
        facilities: Array.isArray(h.facilities) ? h.facilities : [],
      };
    });

    setTenantHistory(mappedHistory);
  } catch (err: any) {
    console.error("❌ fetchTenantHistory ERROR:", {
      status: err?.response?.status,
      message: err?.message,
      data: err?.response?.data,
      url: err?.config?.url,
    });
    setTenantHistory([]);
  }
}, []);

  // ✅ FIX 1: Fetch on mount only (empty dependency array)
 useEffect(() => {
  fetchRooms();
  fetchTenants();
  fetchPayments();
  fetchTenantHistory();
}, [fetchRooms, fetchTenants, fetchPayments, fetchTenantHistory]);

  // 🔔 When login/logout happens, re-fetch (same-tab)
  useEffect(() => {
    const handler = () => {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) return;
      fetchRooms();
      fetchTenants();
      fetchPayments();
      fetchTenantHistory();
    };

    window.addEventListener("rentease:auth-changed", handler);
    return () => window.removeEventListener("rentease:auth-changed", handler);
  }, [fetchRooms, fetchTenants, fetchPayments, fetchTenantHistory]);


  // ✅ FIX 2: Link tenants to rooms - only depend on tenants, not rooms!
  useEffect(() => {
    if (rooms.length === 0 || tenants.length === 0) return;

    const updatedRooms = rooms.map((room) => {
      const roomTenants = tenants.filter((t) => t.roomPk === room.id);

      // ✅ Only update if tenants actually changed for this room
      if (
        roomTenants.length === room.tenants.length &&
        roomTenants.every((t) => room.tenants.some((rt) => rt.id === t.id))
      ) {
        return room;
      }

      return {
        ...room,
        tenants: roomTenants,
        isOccupied: roomTenants.length > 0,
      };
    });

    setRooms(updatedRooms);
  }, [tenants]);



  const addTenant = (tenant: Omit<Tenant, "id">) => {
    const newTenant = { ...tenant, id: `tenant_${Date.now()}` };
    setTenants((prev) => [...prev, newTenant]);

    // Update room
    setRooms((prev) =>
      prev.map((room) =>
        room.roomId === tenant.roomId
          ? { ...room, isOccupied: true, tenants: [...room.tenants, newTenant] }
          : room,
      ),
    );
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === id ? { ...tenant, ...updates } : tenant,
      ),
    );
  };

  const removeTenant = async (id: string, reason?: string) => {
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) {
      console.warn("❌ Tenant not found:", id);
      return;
    }

    const room = rooms.find((r) => r.id === tenant.roomPk || r.roomId === tenant.roomId);

    console.log("🗑️ Removing tenant:", {
      tenantId: id,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      roomId: tenant.roomId,
      roomOccupied: room?.isOccupied,
    });

    // Always move to history (don't permanently delete)
    if (reason) {
      await moveTenantToHistory(id, reason);
    } else {
      await moveTenantToHistory(id, "Tenant removed");
    }
  };

const addPayment = async (payment: Omit<Payment, "id">) => {
  try {
    // ✅ Align payload with backend ElectricityBill model
    const backendPayload: any = {
      tenant: payment.tenant,
      date_month: payment.date_month,
      previous_reading: payment.previous_reading,
      current_reading: payment.current_reading,
      unit_charge: payment.unit_charge,
      remarks: payment.remarks ?? "",
      extra: payment.extra ?? {},
    };

    const res = await api.post("/electricity-bills/", backendPayload);
    console.log("Payment added:", res.data);
    
    // Add to state with ID from response
    if (res.data && res.data.id) {
      // Map the response to our Payment format
      const mappedPayment = mapPaymentFromApi(res.data);
      setPayments(prev => [...prev, mappedPayment]);
    } else {
      // If response doesn't have ID, generate one
      const newPayment = { ...payment, id: `payment_${Date.now()}` };
      setPayments(prev => [...prev, newPayment]);
    }
    
    // Refresh payments list to ensure sync
    await fetchPayments();
  } catch (err) {
    console.error("Error adding payment:", err);
    throw err;
  }
};



  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    const res = await api.patch(`/electricity-bills/${id}/`, updates);

    // Normalize backend shape -> frontend Payment using same mapper
    const updatedMapped = mapPaymentFromApi(res.data);

    setPayments((prev) =>
      prev.map((p) => (p.id === id ? updatedMapped : p)),
    );
  };


 const sendPaymentReminder = async (paymentId: string) => {
  await api.patch(`/electricity-bills/${paymentId}/`, {
    reminder_sent: true,
  });

  setPayments(prev =>
    prev.map(p =>
      p.id === paymentId ? { ...p, reminder_sent: true } : p
    )
  );
};

  const verifyDocument = async (tenantId: string, docId: string) => {
    await api.put(`/tenants/${tenantId}/documents/${docId}/verify/`);

    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              documents: t.documents.map((d) =>
                d.id === docId ? { ...d, verified: true } : d,
              ),
              documentsVerified: true,
            }
          : t,
      ),
    );
  };

  const verifyAllDocuments = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((tenant) => {
        if (tenant.id === tenantId) {
          const updatedDocs = tenant.documents.map((doc) => ({
            ...doc,
            verified: true,
          }));
          return { ...tenant, documents: updatedDocs, documentsVerified: true };
        }
        return tenant;
      }),
    );
  };

const moveTenantToHistory = async (
  tenantId: string,
  reason: string = "Room vacated",
) => {
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) {
    console.error("❌ Tenant not found for history move:", tenantId);
    return;
  }

  const room = rooms.find(
    (r) => r.id === tenant.roomPk || r.roomId === tenant.roomId,
  );

  console.log("🔄 Starting: Moving tenant to history:", {
    tenantId,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    roomId: tenant.roomId,
    roomBackendId: room?.id,
    reason,
  });

  const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Step 2: Update tenant to inactive on backend
  try {
    console.log(`📤 Updating tenant ${tenantId} to inactive on backend...`);
    const tenantUpdatePayload = {
      is_active: false,
    };
    console.log("📋 Tenant update payload:", tenantUpdatePayload);
    
    const res = await api.patch(`/tenants/${tenantId}/`, tenantUpdatePayload);
    console.log("✅ Tenant marked as inactive on backend:", res.data);
  } catch (err: any) {
    console.error(
      "❌ Failed to update tenant on backend:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );
  }

  // Step 1: Update room on backend FIRST
  if (room && room.id) {
    try {
      console.log(`📤 Updating room ${room.id} to Available on backend...`);
      const roomUpdatePayload = {
        status: "Available",
      };
      console.log("📋 Room update payload:", roomUpdatePayload);
      
      const res = await api.patch(`/rooms/${room.id}/`, roomUpdatePayload);
      console.log("✅ Room marked as available on backend:", res.data);
    } catch (err: any) {
      console.error(
        "❌ Failed to update room status on backend:",
        err?.response?.status,
        err?.response?.data || err?.message,
      );
    }
  }

  // Step 3: Update frontend state - Mark tenant as inactive
  setTenants((prev) =>
    prev.map((t) =>
      t.id === tenantId ? { ...t, isActive: false } : t,
    ),
  );
  console.log("✅ Tenant marked as inactive (frontend)");

  // Step 4: Update frontend state - Mark room as available
  if (room) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? { ...r, isOccupied: false, tenants: r.tenants.filter(t => t.id !== tenantId) }
          : r,
      ),
    );
    console.log("✅ Room marked as available (frontend)");
  }

  // Step 5: Create history entry locally
  const tenantNameDisplay = `${tenant.firstName} ${tenant.lastName}`.trim() || "Unknown";
  
  const localEntry: TenantHistory = {
    id: `local_${Date.now()}`,
    tenantName: tenantNameDisplay,
    tenantId: tenant.id,
    email: tenant.email,
    phone: tenant.phone,
    roomId: room?.roomId || tenant.roomId || "",
    roomType: room?.type || "single",
    isAC: room?.isAC ?? false,
    joinDate: tenant.joinDate,
    leaveDate: todayDate,
    checkoutDate: todayDate,
    reason,
    totalRentPaid: 0,
    facilities: [],
  };

  console.log("📝 History entry to create:", localEntry);

  // Add to frontend history
  setTenantHistory((prev) => [localEntry, ...prev]);
  console.log("✅ Tenant history entry created (frontend):", tenantNameDisplay);

  // Step 6: Try to refresh from backend
  try {
    console.log("📥 Refreshing data from backend...");
    await fetchTenantHistory();
    await fetchRooms();
    await fetchTenants();
    console.log("✅ Data refreshed from backend");
  } catch (err: any) {
    console.warn("⚠️ Could not refresh data from backend:", err?.message);
  }

  console.log("✅ Tenant move to history COMPLETE!");
};



  return (
    <DataContext.Provider
      value={{
        rooms,
        tenants,
        payments,
        tenantHistory,
        fetchRooms,
        fetchTenants,
        fetchPayments,
        fetchTenantHistory,
        createTenant, // ✅ REQUIRED
        settings,
        updateSettings,
        addRoom,
        updateRoom,
        addTenant,
        updateTenant,
        removeTenant,
        addPayment,
        updatePayment,
        verifyDocument,
        verifyAllDocuments,
        moveTenantToHistory,
        getRent,

        initializeRooms,
        deleteAllRooms,
        sendPaymentReminder,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
