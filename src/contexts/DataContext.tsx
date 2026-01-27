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
  createTenant: (data: CreateTenantPayload) => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchTenantHistory: () => Promise<void>;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
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
  const acValue = (r.ac_non_ac || "").toLowerCase();
  const isACRoom = acValue === "ac" || r.isAC === true;

  return {
    id: String(r.id),
  roomId: r.room_id,          // 👈 use this everywhere
  type: r.room_type === "Single" ? "single" :
        r.room_type === "Double" ? "double" : "triple",
  isAC: r.ac_non_ac === "AC",
  rent: r.room_rent,
  isOccupied: r.status !== "Available",
  tenants: r.tenants ?? [],
  };
};

const mapTenantFromApi = (t: any): Tenant => ({
  id: String(t.id),
  firstName: t.first_name,
  lastName: t.last_name,
  email: t.email,
  phone: t.phone_no || t.phone || "",
  

  // ✅ FIX HERE
 roomId: t.room_detail?.room_id || t.room_id || "",
roomPk: t.room ? String(t.room) : undefined,

  documents: [],
  documentsVerified: false,
  joinDate: t.join_date ?? "",
  isActive: t.is_active ?? true,
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  aadhaarNumber: "",
  tokenMoney: 0,
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

  const createTenant = async (data: CreateTenantPayload) => {
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

      console.log("Creating tenant with payload:", payload);
     const res = await api.post("/tenants/", payload);
console.log("Tenant created:", res.data);

// 🔥 frontend tenant list update
setTenants((prev) => [...prev, mapTenantFromApi(res.data)]);

// 🔥 rooms re-fetch (safe)
await fetchRooms();


      try {
        await fetchRooms();
      } catch (err: any) {
        if (err?.response?.status !== 401) {
          console.warn("Failed to refresh rooms after tenant creation:", err);
        }
      }
    } catch (error: any) {
      console.error("createTenant error:", error);
      const initializeRooms = async (totalRooms: number) => {
        // 1️⃣ Rooms create API
        await api.post("/api/rooms/initialize/", {
          total_rooms: totalRooms,
        });

        // 2️⃣ Fresh rooms fetch
        const res = await api.get("/api/rooms/");

        // 3️⃣ Update rooms state (THIS makes cards show)
        setRooms(res.data);

        // 4️⃣ Update settings
        setSettings((prev) => ({
          ...prev,
          totalRooms: totalRooms,
        }));
      };

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
        setRooms([]);
        return;
      }

      const res = await api.get("/rooms/");
      console.log("ROOMS FROM API 👉", res.data);
      console.log(
        "RESPONSE TYPE:",
        typeof res.data,
        "IS ARRAY:",
        Array.isArray(res.data),
      );

      // Check if response is an array or object with array inside
      const roomsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
      console.log("ROOMS ARRAY:", roomsArray);

      if (roomsArray.length === 0) {
        console.warn("No rooms found in API response");
      }

      setRooms(roomsArray.map(mapRoomFromApi));
    } catch (err: any) {
      console.error("fetchRooms ERROR:", err);
      if (err?.response?.status === 401) {
        console.warn("Unauthorized - token expired");
      }
      setRooms([]);
    }
  }, []);

  const addRoom = async (room: Omit<Room, "id">) => {
    const res = await api.post("/rooms/", {
      room_type: room.type,
      ac_non_ac: room.isAC ? "AC" : "NON_AC",
      room_rent: room.rent,
      is_occupied: false,
      is_active: true,
    });

    setRooms((prev) => [...prev, mapRoomFromApi(res.data)]);
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const res = await api.put(`/rooms/${id}/`, {
      room_type: updates.type,
      ac_non_ac: updates.isAC ? "AC" : "NON_AC",
      room_rent: updates.rent,
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
        setTenants([]);
        return;
      }

      const res = await api.get("/tenants/");
      console.log("TENANTS FROM API 👉", res.data);
      console.log(
        "TENANTS RESPONSE TYPE:",
        typeof res.data,
        "IS ARRAY:",
        Array.isArray(res.data),
      );

      // Check if response is an array or object with array inside
      const tenantsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
      console.log("TENANTS ARRAY:", tenantsArray);

      if (tenantsArray.length === 0) {
        console.warn("No tenants found in API response");
      }

      setTenants(tenantsArray.map(mapTenantFromApi));
    } catch (err: any) {
      console.error("fetchTenants error", err);
      if (err?.response?.status === 401) {
        console.warn("Unauthorized - token expired");
      }
      setTenants([]);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
  try {
    const res = await api.get("/electricity-bills/");
    console.log("PAYMENTS FROM API 👉", res.data);
    
    // Handle array or paginated response
    const paymentsArray = Array.isArray(res.data)
      ? res.data
      : res.data?.results || res.data?.data || [];
    
    console.log("PAYMENTS ARRAY:", paymentsArray);
    
    // Map payments from API format to frontend format
    const mappedPayments = paymentsArray.map(mapPaymentFromApi);
    setPayments(mappedPayments);
  } catch (err) {
    console.warn("fetchPayments error", err);
    setPayments([]);
  }
}, []);

const fetchTenantHistory = useCallback(async () => {
  try {
    // Try to fetch from /tenant-history/
    const res = await api.get("/tenant-history/");
    console.log("TENANT HISTORY FROM API 👉", res.data);
    
    // Handle array or paginated response
    const historyArray = Array.isArray(res.data)
      ? res.data
      : res.data?.results || res.data?.data || [];
    
    console.log("TENANT HISTORY ARRAY:", historyArray);
    
    if (historyArray.length === 0) {
      setTenantHistory([]);
      return;
    }
    
    // Map the response from /tenant-historys/ endpoint
    const mappedHistory = historyArray.map((h: any) => {
      // Backend returns nested tenant and room objects
      const tenantObj = typeof h.tenant === 'object' ? h.tenant : {};
      const roomObj = typeof h.room === 'object' ? h.room : {};
      
      const tenantFirstName = tenantObj?.first_name || h.tenant_name?.split(' ')[0] || 'Unknown';
      const tenantLastName = tenantObj?.last_name || h.tenant_name?.split(' ')[1] || '';
      const roomId = roomObj?.room_id || h.room_detail?.room_id || roomObj?.id || '';
      const roomType = (roomObj?.room_type || 'single').toLowerCase();
      
      return {
        id: String(h.id),
        tenantName: `${tenantFirstName} ${tenantLastName}`.trim(),
        roomId: String(roomId),
        roomType: roomType.includes("double") ? "double" : roomType.includes("triple") ? "triple" : "single",
        isAC: (roomObj?.ac_non_ac || 'Non-AC') === 'AC',
        joinDate: h.join_date || '',
        leaveDate: h.leave_date || new Date().toISOString(),
        totalRentPaid: h.total_rent_paid || 0,
        facilities: h.facilities || [],
      };
    });
    
    setTenantHistory(mappedHistory);
  } catch (err: any) {
    console.warn("fetchTenantHistory error", err);
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
    if (!tenant) return;

    const room = rooms.find((r) => r.id === tenant.roomPk || r.roomId === tenant.roomId);
    
    // ✅ If room is occupied, move to history instead of deleting
    if (room && room.isOccupied) {
      console.log("🔄 Room is occupied, moving tenant to history instead of deleting");
      await moveTenantToHistory(id, reason || "Room vacated");
      return;
    }

    // ❌ If room is not occupied, directly delete tenant
    console.log("🗑️ Deleting tenant from empty room");
    setTenants((prev) => prev.filter((t) => t.id !== id));
    
    if (room) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? {
                ...r,
                isOccupied: r.tenants.length > 1,
                tenants: r.tenants.filter((t) => t.id !== id),
              }
            : r,
        ),
      );
    }
  };

const addPayment = async (payment: Omit<Payment, "id">) => {
  try {
    const res = await api.post("/electricity-bills/", payment);
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

  setPayments(prev =>
    prev.map(p => (p.id === id ? res.data : p))
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

const moveTenantToHistory = async (tenantId: string, reason: string = "Room vacated") => {
  try {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    const room = rooms.find((r) => r.id === tenant.roomPk || r.roomId === tenant.roomId);

    console.log("🔄 Moving tenant to history:", {
      tenantId,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      roomId: tenant.roomId,
      reason,
    });

    // ✅ 1. Move tenant to history via backend
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const historyPayload = {
      tenant_id: tenantId,
      checkout_date: todayDate,
      reason: reason,
      is_active: false,
    };

    // POST to move-to-history endpoint
    await api.post(`/tenants/${tenantId}/move-to-history/`, historyPayload);

    console.log("✅ Tenant moved to history in backend");

    // ✅ 2. Update room to mark as available (if room exists)
    if (room && room.id) {
      try {
        await api.patch(`/rooms/${room.id}/`, {
          status: "Available",
          is_occupied: false,
        });
        console.log("✅ Room marked as available");
      } catch (err: any) {
        console.warn("⚠️ Could not update room status:", err?.response?.status, err?.message);
      }
    }

    // ✅ 3. Remove from active tenants in frontend
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));

    // ✅ 4. Refresh tenant history from backend
    await fetchTenantHistory();

    // ✅ 5. Free room in frontend
    if (room) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? { ...r, isOccupied: false, tenants: [] }
            : r
        )
      );
    }

    console.log("✅ Tenant moved to history successfully");
  } catch (error: any) {
    console.error("❌ Error moving tenant to history:", error);
    throw error;
  }
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
