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
   record_status?: "Paid" | "Pending" | "Active";

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
  tenant?: number;
  room?: number | null;

  firstName?: string;
  lastName?: string;

  roomId?: string;   // "" allowed
  roomType?: string;
  isAC?: boolean;

  joinDate?: string;
  leaveDate?: string;
  totalRentPaid?: number;
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

      // ✅ FIXED: Don't send state/city - backend expects FK IDs, not strings
      const payload: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_no: data.phone,
        phone: data.phone,
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

<<<<<<< HEAD
      // ⚠️ REMOVED: state and city fields cause "Expected pk value" error
      // Backend expects these as Foreign Key IDs (numbers), not strings
      // If you need to save state/city, ask backend team to:
      // 1. Change them to CharField instead of FK, OR
      // 2. Provide /states/ and /cities/ endpoints with IDs

      console.log("[createTenant] Sending payload:", JSON.stringify(payload, null, 2));
     const res = await api.post("/tenants/", payload);
console.log("✅ Tenant created:", res.data);
=======
      console.log("Creating tenant with payload:", payload);
     const res = await api.post("/tenants/", payload);
console.log("Tenant created:", res.data);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3

      const created = mapTenantFromApi(res.data);

      // 🔥 frontend tenant list update
      setTenants((prev) => [...prev, created]);

// 🔥 rooms re-fetch (safe)
await fetchRooms();


      try {
        await fetchRooms();
      } catch (err: any) {
        if (err?.response?.status !== 401) {
          console.warn("Failed to refresh rooms after tenant creation:", err);
        }
      }

      return created;
    } catch (error: any) {
      console.error("createTenant error:", error);
<<<<<<< HEAD
=======
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

>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
      const status = error?.response?.status;
      // Session expired
      if (status === 401) {
        throw new Error("Session expired — please sign in again.");
      }

      // Validation errors (400) — parse common DRF response shapes
      if (status === 400 && error.response?.data) {
        const resp = error.response.data;
        // If response contains a generic detail/message
        if (resp.detail || resp.message) {
          throw new Error(String(resp.detail || resp.message));
        }

        // If response is an object with field errors, convert to readable string
        if (typeof resp === "object") {
          try {
            const parts: string[] = [];
            for (const [k, v] of Object.entries(resp)) {
              if (Array.isArray(v)) {
                parts.push(`${k}: ${v.join(", ")}`);
              } else if (typeof v === "string") {
                parts.push(`${k}: ${v}`);
              } else {
                parts.push(`${k}: ${JSON.stringify(v)}`);
              }
            }
            const message = parts.join(" | ");
            throw new Error(message || "Validation error");
          } catch (e) {
            // fallback to stringified response
            throw new Error(JSON.stringify(resp));
          }
        }
      }

      // Fallback: if server responded with data, show it; otherwise rethrow
      if (error.response) {
        console.error("createTenant response data:", error.response.data);
        const serverMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          (typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data));
        if (serverMessage && serverMessage !== "[object Object]") {
          throw new Error(String(serverMessage));
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

      const endpoints = ["/rooms/", "/api/rooms/", "/api/rooms/initialize/", "/rooms/initialize/"];
      const createdRooms: string[] = [];
      const failures: Array<{ room: number; status?: number; data?: any; message: string }> = [];

<<<<<<< HEAD
      for (let i = 1; i <= count; i++) {
        // Try multiple payload shapes to be compatible with different backends
        const payloadVariants: any[] = [
          {
            room_id: String(i),
            room_type: "Single",
            ac_non_ac: "Non-AC",
            room_rent: 3000,
            status: "Available",
            facility: 1,
            remarks: "",
          },
          // facility_id instead of facility
          {
            room_id: String(i),
            room_type: "Single",
            ac_non_ac: "Non-AC",
            room_rent: 3000,
            status: "Available",
            facility_id: 1,
            remarks: "",
          },
          // alternative field names some backends expect
          {
            room_number: String(i),
            room_type: "Single",
            ac_non_ac: "Non-AC",
            rent: 3000,
            status: "Available",
            facility_id: 1,
          },
          // camelCase variant
          {
            roomId: String(i),
            roomType: "Single",
            acNonAc: "Non-AC",
            roomRent: 3000,
            status: "Available",
            facilityId: 1,
          },
        ];

        let created = false;
        console.log(`Attempting to create room #${i} (trying payload variants and endpoints)`);

        for (const ep of endpoints) {
          for (const payload of payloadVariants) {
            try {
              console.log(`[api] POST ${ep} payload:`, payload);
              const res: any = await api.post(ep, payload);
              console.log(`Room #${i} created via ${ep}:`, res?.data);
              createdRooms.push(String(i));
              created = true;
              break;
            } catch (e: any) {
              // capture server response for debugging
              const status = e?.response?.status;
              const data = e?.response?.data;
              console.warn(`Attempt failed for room #${i} → ${ep}`, { status, data });
              failures.push({ room: i, status, data, message: String(e?.message || "unknown") });
              // continue trying other payloads/endpoints
            }
          }
          if (created) break;
        }

        if (!created) {
          console.error(`All attempts failed for room #${i}`);
          // continue to next room instead of throwing immediately so we can report summary
=======
        try {
          console.log(`Creating room #${i}:`, payload);
          // Try the common endpoints used in this project. backend may be mounted under /api/
          const endpoints = ["/rooms/", "/api/rooms/"];
          let created = false;
          for (const ep of endpoints) {
            try {
              await api.post(ep, { ...payload, facility_id: payload.facility, facility: payload.facility });
              console.log(`Room #${i} created successfully via ${ep}`);
              created = true;
              break;
            } catch (e) {
              console.warn(`Attempt to create room #${i} via ${ep} failed:`, e?.response?.status);
            }
          }

          if (!created) {
            throw new Error(`All endpoints failed for room #${i}`);
          }
        } catch (err: any) {
          const status = err?.response?.status;
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err.message;
          console.error(`Room #${i} failed (Status: ${status}):`, msg);
          throw err;
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
        }
      }

      console.log(`Rooms created: ${createdRooms.length}/${count}`);
      if (failures.length > 0) {
        console.warn("Some create attempts failed. Example failures:", failures.slice(0, 5));
      }

      if (createdRooms.length === 0) {
        throw new Error(`initializeRooms: All endpoints failed for all rooms. See console for server responses.`);
      }

      await fetchRooms();
    } catch (error) {
      console.error("initializeRooms error:", error);
      throw error;
    }
  };

  const deleteAllRooms = async () => {
    try {
      // First, fetch fresh list from backend to ensure we're deleting everything
      // Try both /rooms/ and /api/rooms/ to support different router prefixes
      let freshRes: any;
      try {
        freshRes = await api.get("/rooms/");
      } catch (e) {
        freshRes = await api.get("/api/rooms/");
      }
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
          // delete endpoint may be mounted under /api/
          const deleteEndpoints = [`/rooms/${room.id}/`, `/api/rooms/${room.id}/`];
          let deleted = false;
          for (const dEp of deleteEndpoints) {
            try {
              await api.delete(dEp);
              deleted = true;
              break;
            } catch (e) {
              // try next
            }
          }
          if (!deleted) throw new Error('Delete failed');
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

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        console.warn("No auth token - skipping fetchRooms");
        return;
      }

      // Try both common endpoints in case router is mounted under /api/
      let res: any;
      try {
        res = await api.get("/rooms/");
      } catch (e) {
        console.warn("fetchRooms: /rooms/ failed, trying /api/rooms/", e?.response?.status);
        res = await api.get("/api/rooms/");
      }
<<<<<<< HEAD
      // console.log("ROOMS FROM API 👉", res.data);
      // console.log(
      //   "RESPONSE TYPE:",
      //   typeof res.data,
      //   "IS ARRAY:",
      //   Array.isArray(res.data),
      // );
=======
      console.log("ROOMS FROM API 👉", res.data);
      console.log(
        "RESPONSE TYPE:",
        typeof res.data,
        "IS ARRAY:",
        Array.isArray(res.data),
      );
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3

      // Check if response is an array or object with array inside
      const roomsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
<<<<<<< HEAD
      // console.log("ROOMS ARRAY:", roomsArray);
=======
      console.log("ROOMS ARRAY:", roomsArray);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3

      if (roomsArray.length === 0) {
        console.warn("No rooms found in API response");
      }

      setRooms(roomsArray.map(mapRoomFromApi));
    } catch (err: any) {
      console.error("fetchRooms ERROR:", err);
      if (err?.response?.status === 401) {
        console.warn("Unauthorized - token expired");
      }
      // keep last known state to avoid dashboard flicker
    }
  }, []);

  const addRoom = async (room: Omit<Room, "id">) => {
    const toBackendRoomType = (type: Room["type"]) =>
      type === "double" ? "Double" : type === "triple" ? "Triple" : "Single";
    const toBackendAc = (isAC: boolean) => (isAC ? "AC" : "Non-AC");

    // Keep payload aligned with backend expectations used elsewhere in app
    const payload = {
      room_id: String(room.roomId ?? ""),
      room_type: toBackendRoomType(room.type),
      ac_non_ac: toBackendAc(room.isAC),
      room_rent: Number(room.rent ?? 0),
      status: "Available",
      facility: 1,
      facility_id: 1,
      remarks: "",
    };

    // Try both endpoints until one succeeds
<<<<<<< HEAD
    const endpoints = ["/rooms/"];
    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        console.log(`[addRoom] POST ${ep}:`, JSON.stringify(payload, null, 2));
        const res = await api.post(ep, payload);
        console.log(`✅ [addRoom] success:`, res.data);
        setRooms((prev) => [...prev, mapRoomFromApi(res.data)]);
        return;
      } catch (err: any) {
        console.warn(`❌ [addRoom] failed at ${ep}:`, err?.response?.status, err?.response?.data);
=======
    const endpoints = ["/rooms/", "/api/rooms/"];
    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        const res = await api.post(ep, payload);
        setRooms((prev) => [...prev, mapRoomFromApi(res.data)]);
        return;
      } catch (err: any) {
        console.warn(`addRoom: POST ${ep} failed:`, err?.response?.status, err?.response?.data);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
        lastErr = err;
      }
    }

    // If we reach here, both attempts failed
    throw lastErr;
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const toBackendRoomType = (type: Room["type"]) =>
      type === "double" ? "Double" : type === "triple" ? "Triple" : "Single";
    const toBackendAc = (isAC: boolean) => (isAC ? "AC" : "Non-AC");

    const current = rooms.find((r) => r.id === id);

    // Try /rooms/ endpoint first (backend doesn't have /api/ prefix)
    const endpoints = [`/rooms/${id}/`];

    const payloadVariants: any[] = [
      // Variant 1: Full payload with all fields (snake_case - Django style)
      {
        room_id: String(current?.roomId ?? ""),
        room_type: updates.type ? toBackendRoomType(updates.type as Room["type"]) : current?.type ? toBackendRoomType(current.type) : "Single",
        ac_non_ac: typeof updates.isAC === "boolean" ? toBackendAc(updates.isAC) : current?.isAC ? toBackendAc(current.isAC) : "Non-AC",
        room_rent: typeof updates.rent === "number" ? Number(updates.rent) : (current?.rent ?? 0),
        facility_id: 1,
        facility: 1,
        remarks: "",
        status: "Available",
      },
      // Variant 2: Just the fields that changed (minimal payload)
      {
        room_type: updates.type ? toBackendRoomType(updates.type as Room["type"]) : undefined,
        ac_non_ac: typeof updates.isAC === "boolean" ? toBackendAc(updates.isAC) : undefined,
        room_rent: typeof updates.rent === "number" ? Number(updates.rent) : undefined,
      },
      // Variant 3: Alternative field names
      {
        type: updates.type || current?.type || "single",
        is_ac: typeof updates.isAC === "boolean" ? updates.isAC : current?.isAC ?? false,
        rent: typeof updates.rent === "number" ? Number(updates.rent) : (current?.rent ?? 0),
      },
    ];

    // Filter out undefined values from payloads
    const cleanPayloads = payloadVariants.map(p => {
      const clean: any = {};
      for (const [key, val] of Object.entries(p)) {
        if (val !== undefined && val !== null && val !== "") {
          clean[key] = val;
        }
      }
      return clean;
    });

    let lastError: any = null;
    for (const ep of endpoints) {
      for (const payload of cleanPayloads) {
        try {
          console.log(`[updateRoom] PUT ${ep} with payload:`, JSON.stringify(payload, null, 2));
          const res: any = await api.put(ep, payload);
          console.log(`✅ [updateRoom] PUT success ${ep}:`, res?.data);
          setRooms((prev) => prev.map((r) => (r.id === id ? mapRoomFromApi(res.data) : r)));
          return;
        } catch (err: any) {
          const status = err?.response?.status;
          const errData = err?.response?.data;
          console.warn(`❌ [updateRoom] attempt failed ${ep}`, { status, payload, errData });
          lastError = err;
          // try next payload/endpoint
        }
      }
    }

    // If we reach here, everything failed
    console.error(`❌ [updateRoom] all attempts failed for room ${id}:`, {
      status: lastError?.response?.status,
      data: lastError?.response?.data,
      message: lastError?.message
    });
    throw lastError;
  };

  const fetchTenants = useCallback(async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        console.warn("No auth token - skipping fetchTenants");
        return;
      }

      const res = await api.get("/tenants/");
<<<<<<< HEAD
      // console.log("TENANTS FROM API 👉", res.data);
      // console.log(
      //   "TENANTS RESPONSE TYPE:",
      //   typeof res.data,
      //   "IS ARRAY:",
      //   Array.isArray(res.data),
      // );
=======
      console.log("TENANTS FROM API 👉", res.data);
      console.log(
        "TENANTS RESPONSE TYPE:",
        typeof res.data,
        "IS ARRAY:",
        Array.isArray(res.data),
      );
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3

      // Check if response is an array or object with array inside
      const tenantsArray = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];
<<<<<<< HEAD
      // console.log("TENANTS ARRAY:", tenantsArray);
=======
      console.log("TENANTS ARRAY:", tenantsArray);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3

      if (tenantsArray.length === 0) {
        console.warn("No tenants found in API response");
      }

      setTenants(tenantsArray.map(mapTenantFromApi));
    } catch (err: any) {
      console.error("fetchTenants error", err);
      if (err?.response?.status === 401) {
        console.warn("Unauthorized - token expired");
      }
      // keep last known state to avoid dashboard flicker
    }
  }, []);

  const fetchPayments = useCallback(async () => {
  try {
    const res = await api.get("/electricity-bills/");
<<<<<<< HEAD
    // console.log("PAYMENTS FROM API 👉", res.data);
=======
    console.log("PAYMENTS FROM API 👉", res.data);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
    
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
    const res = await api.get("/tenant-history/");
    console.log("TENANT HISTORY FROM API 👉", res.data);

    const historyArray = Array.isArray(res.data)
      ? res.data
      : res.data?.results || res.data?.data || [];

<<<<<<< HEAD
    if (historyArray.length === 0) return;

    const mappedHistory = historyArray.map((h: any) => {
      // 🔑 Resolve tenant name SAFELY
      const tenantObj = tenants.find(
        (t) => String(t.id) === String(h.tenant)
      );

      const firstName =
        h.first_name ||
        tenantObj?.firstName ||
        "";

      const lastName =
        h.last_name ||
        tenantObj?.lastName ||
        "";

      return {
        id: String(h.id),
        tenant: h.tenant,
        room: h.room,

        firstName,
        lastName,

        roomId: h.room_id || "",
        roomType: (h.room_type || "single").toLowerCase(),
        isAC: h.is_ac === true || h.is_ac === "true",

        joinDate: h.join_date || "",
        leaveDate: h.leave_date || "",
        totalRentPaid: Number(h.total_rent_paid ?? 0),
      };
    });

    setTenantHistory(mappedHistory);
  } catch (err) {
    console.warn("fetchTenantHistory error", err);
=======
    console.log("TENANT HISTORY ARRAY:", historyArray);
    if (historyArray.length === 0) {
      console.warn('fetchTenantHistory: backend returned empty array — keeping local history');
      return; // do not clear local tenantHistory when backend has none
    }

    const mappedHistory = historyArray.map((h: any) => {
      const tenantObj = typeof h.tenant === "object" ? h.tenant : {};
      const roomObj = typeof h.room === "object" ? h.room : {};

      const rawName =
        h.tenant_name ||
        h.tenantName ||
        `${tenantObj.first_name || ""} ${tenantObj.last_name || ""}`.trim();
      const [firstFromRaw = "Unknown", ...restName] = rawName
        .trim()
        .split(" ");

      const tenantFirstName =
        tenantObj.first_name || tenantObj.firstName || firstFromRaw;
      const tenantLastName =
        tenantObj.last_name ||
        tenantObj.lastName ||
        restName.join(" ");

      const roomIdValue =
        roomObj.room_id ||
        h.room_detail?.room_id ||
        h.room_id ||
        h.room_number ||
        h.room ||
        roomObj.id ||
        "";

      const rawRoomType =
        roomObj.room_type || h.room_type || h.roomType || "single";
      const roomTypeLower = String(rawRoomType).toLowerCase();

      return {
        id: String(h.id),
        tenantName: `${tenantFirstName} ${tenantLastName}`.trim() || "Unknown",
        tenantId: String(
          h.tenant_id || tenantObj.id || h.tenantId || tenantObj.pk || "",
        ),
        email: tenantObj.email || h.email || "",
        phone: tenantObj.phone_no || tenantObj.phone || h.phone || "",
        roomId: roomIdValue ? String(roomIdValue) : "",
        roomType: roomTypeLower.includes("double")
          ? "double"
          : roomTypeLower.includes("triple")
          ? "triple"
          : "single",
        isAC:
          (roomObj.ac_non_ac ||
            roomObj.ac ||
            roomObj.is_ac ||
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

    // Merge backend items with existing local history and dedupe by id
    setTenantHistory((prev) => {
      const combined = [...mappedHistory, ...prev];
      const byId = new Map<string, any>();
      for (const item of combined) {
        if (!byId.has(item.id)) byId.set(item.id, item);
      }
      return Array.from(byId.values());
    });
  } catch (err: any) {
    console.warn("fetchTenantHistory error", err);
    setTenantHistory([]);
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
  }
}, [tenants]);



  // ✅ FIX 1: Fetch on mount only (empty dependency array)
useEffect(() => {
  fetchRooms();
  fetchTenants();
  fetchPayments();
}, [fetchRooms, fetchTenants, fetchPayments]);

// ⬇️ SEPARATE effect (IMPORTANT)
useEffect(() => {
  if (tenants.length > 0) {
    fetchTenantHistory();
  }
}, [tenants, fetchTenantHistory]);


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
    if (!tenant) return;
<<<<<<< HEAD

    const room = rooms.find((r) => r.id === tenant.roomPk || r.roomId === tenant.roomId);

    // If tenant exists on backend (numeric id), move to history via backend endpoint
    if (/^\d+$/.test(String(tenant.id))) {
      try {
        await moveTenantToHistory(String(tenant.id), reason || "Room vacated");
        // frontend will refresh state after move (fetchRooms/fetchTenantHistory inside moveTenantToHistory)
        return;
      } catch (err) {
        console.error("Failed to move tenant to history", err);
        throw err;
      }
    }

    // Otherwise tenant is local-only — remove locally
    console.log("🗑️ Deleting local tenant");
    setTenants((prev) => prev.filter((t) => t.id !== id));

=======

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
    
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
    if (room) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? {
                ...r,
<<<<<<< HEAD
                isOccupied: r.tenants.filter((t) => t.id !== id).length > 0,
=======
                isOccupied: r.tenants.length > 1,
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
                tenants: r.tenants.filter((t) => t.id !== id),
              }
            : r,
        ),
      );
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



  const updatePayment = async (id: string, data: any) => {
  const res = await api.patch(`/electricity-bills/${id}/`, data);

  setPayments((prev) =>
    prev.map((p) =>
      String(p.id) === String(id) ? { ...p, ...res.data } : p
    )
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
<<<<<<< HEAD
  try {
    // ✅ CORRECT BACKEND ENDPOINT
    await api.post(`/tenant-history/${tenantId}/move/`);

    // 🔁 Sync frontend from backend (source of truth)
    await fetchRooms();
    await fetchTenants();
    await fetchTenantHistory();

  } catch (err: any) {
    console.error("moveTenantToHistory failed:", {
      status: err?.response?.status,
      data: err?.response?.data,
    });
    throw err;
  }
=======
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) {
    console.error("Tenant not found for history move:", tenantId);
    return;
  }

  const room = rooms.find(
    (r) => r.id === tenant.roomPk || r.roomId === tenant.roomId,
  );

  console.log("🔄 Moving tenant to history:", {
    tenantId,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    roomId: tenant.roomId,
    roomPk: tenant.roomPk,
    reason,
  });

  const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let backendOk = false;
  
  // ========== STEP 1: Move tenant on backend ==========
  try {
    console.log("📤 Attempting POST to /tenants/{id}/move/:", { tenantId });
    const resp = await api.post(`/tenants/${tenantId}/move/`);
    backendOk = true;
    console.log("✅ Tenant moved via /tenants/{id}/move/", resp.data);
  } catch (e: any) {
    console.warn("❌ /tenants/{id}/move/ failed:", {
      status: e?.response?.status,
      data: e?.response?.data,
      message: e?.message,
    });

    // Fallback: try /tenants/{id}/move-to-history/
    try {
      console.log("📤 Attempting fallback: /tenants/{id}/move-to-history/");
      const resp = await api.post(`/tenants/${tenantId}/move-to-history/`);
      backendOk = true;
      console.log("✅ Tenant moved via /tenants/{id}/move-to-history/", resp.data);
    } catch (e2: any) {
      console.warn("❌ /tenants/{id}/move-to-history/ also failed:", {
        status: e2?.response?.status,
        data: e2?.response?.data,
      });
    }
  }

  // ========== STEP 2: Update room as available ==========
  if (room && room.id) {
    try {
      console.log("📤 Updating room to Available:", { 
        roomId: room.id, 
        roomPk: room.id,
        currentStatus: room.isOccupied ? "Occupied" : "Available"
      });
      
      // Try both field combinations since backend may use different names
      const roomUpdatePayload = {
        status: "Available",
        is_occupied: false,
        isOccupied: false,
        record_status: "Active",
      };
      
      // Try both endpoints
      let roomUpdated = false;
      try {
        const resp = await api.patch(`/rooms/${room.id}/`, roomUpdatePayload);
        console.log("✅ Room marked as available via PATCH /rooms/{id}/:", resp.data);
        roomUpdated = true;
      } catch (patchErr) {
        console.warn("⚠️ PATCH /rooms/{id}/ failed, trying PUT:");
        const resp = await api.put(`/rooms/${room.id}/`, {
          ...roomUpdatePayload,
          room_id: room.roomId,
          room_type: "Single", // preserve existing fields
          ac_non_ac: room.isAC ? "AC" : "Non-AC",
          room_rent: room.rent,
          facility: 1,
        });
        console.log("✅ Room marked as available via PUT /rooms/{id}/:", resp.data);
        roomUpdated = true;
      }
      
      if (roomUpdated) {
        console.log("✅ Room successfully updated on backend");
      }
    } catch (err: any) {
      console.error("❌ Room update failed completely:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    }
  } else {
    console.warn("⚠️ Room not found to update:", { roomId: tenant.roomId, roomPk: tenant.roomPk });
  }

  // ========== STEP 3: Create tenant-history record ==========
  const historyPayload: any = {
    tenant: tenantId,
    tenant_id: tenantId,
    room: room?.id,
    room_id: room?.id,
    join_date: tenant.joinDate,
    leave_date: todayDate,
    checkout_date: todayDate,
    reason,
    total_rent_paid: 0,
    facilities: [],
  };

  const historyEndpoints = ["/tenant-history/", "/tenant_history/"];
  for (const ep of historyEndpoints) {
    try {
      console.log(`📤 Attempting POST to ${ep}:`, historyPayload);
      const resp = await api.post(ep, historyPayload);
      backendOk = true;
      console.log(`✅ Tenant history created via ${ep}`, resp.data);
      break;
    } catch (err: any) {
      console.warn(`❌ POST ${ep} failed:`, {
        status: err?.response?.status,
        data: err?.response?.data,
      });
    }
  }

  // ========== STEP 4: Update frontend state ==========
  // Mark tenant inactive
  setTenants((prev) =>
    prev.map((t) =>
      t.id === tenantId ? { ...t, isActive: false } : t,
    ),
  );

  // Update room state
  if (room) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? { ...r, isOccupied: false, tenants: [] }
          : r,
      ),
    );
  }

  // ========== STEP 5: Sync tenant history from backend ==========
  if (backendOk) {
    try {
      await fetchTenantHistory();
      console.log("✅ Fetched updated tenant history from backend");
    } catch (err) {
      console.warn("⚠️ Could not fetch updated tenant history:", err);
    }
  } else {
    // If backend failed, add local entry only
    console.warn("⚠️ No backend save succeeded; adding local entry only");
    const localEntry: TenantHistory = {
      id: `local_${Date.now()}`,
      tenantName: `${tenant.firstName} ${tenant.lastName}`.trim() || "Unknown",
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
    setTenantHistory((prev) => [localEntry, ...prev]);
  }

  console.log("✅ Tenant moved to history (all steps complete)");
>>>>>>> 306546b424c047394fb6ab1bc06dfb375f70bdf3
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
