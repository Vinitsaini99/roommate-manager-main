import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  roomNumber: number;
  documents: Document[];
  documentsVerified: boolean;
  joinDate: string;
  isActive: boolean;
}

export interface Document {
  id: string;
  type: 'address_proof' | 'id_proof';
  name: string;
  url: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Room {
  id: string;
  roomNumber: number;
  type: 'single' | 'double' | 'triple';
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


export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: number;
  month: string;
  year: number;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  electricityRate: number;
  electricityAmount: number;
  rent: number;
  totalAmount: number;
  status: 'paid' | 'pending';
  paidDate?: string;
  reminderSent?: boolean;
}

export interface TenantHistory {
  id: string;
  tenantName: string;
  roomNumber: number;
  roomType: 'single' | 'double' | 'triple';
  isAC: boolean;
  joinDate: string;
  leaveDate: string;
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
  fetchRooms: () => Promise<void>; // 🔥 REQUIRED  
  createTenant: (data: CreateTenantPayload) => Promise<void>;
  tenantHistory: TenantHistory[];
  fetchPayments: () => Promise<void>; // 🔥 REQUIRED
  fetchTenants: () => Promise<void>;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, tenant: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  verifyDocument: (tenantId: string, docId: string) => void;
  verifyAllDocuments: (tenantId: string) => void;
  moveTenantToHistory: (tenantId: string) => void;
  getRent: (type: 'single' | 'double' | 'triple', isAC: boolean) => number;
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

const mapRoomFromApi = (r: any): Room => ({
  id: String(r.id),
  // Prioritize explicit room_number, then fallback to sequential numbering from id
  // If id is numeric and > 0, use 100 + id (common pattern), otherwise use id as-is
  roomNumber: r.room_number || r.roomNumber || (Number(r.id) > 0 ? Number(r.id) : 1),
  type: r.room_type || r.type || "single",
  isAC: r.ac_non_ac === "ac" || r.isAC || false,
  rent: Number(r.room_rent || r.rent || 0),
  isOccupied: r.is_occupied || r.isOccupied || false,
  tenants: r.tenants ? r.tenants.map(mapTenantFromApi) : [],
});


const mapTenantFromApi = (t: any): Tenant => ({
  id: String(t.id),
  firstName: t.first_name,
  lastName: t.last_name,
  email: t.email,
  phone: t.phone,
  // Get room number from room object, or from direct field, fallback to id
  roomNumber: t.room?.room_number || t.room_number || Number(t.room?.id) || Number(t.id) || 0,
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




// Generate initial mock data
// const generateInitialData = () => {
//   const rooms: Room[] = [];
//   const tenants: Tenant[] = [];
//   const payments: Payment[] = [];
  
  // Generate 20 rooms with some occupied
//   for (let i = 1; i <= 20; i++) {
//     const isOccupied = i <= 12;
//     const typeOptions: ('single' | 'double' | 'triple')[] = ['single', 'double', 'triple'];
//     const type = typeOptions[i % 3];
//     const isAC = i % 4 === 0;
    
//     const getRentValue = (t: 'single' | 'double' | 'triple', ac: boolean) => {
//       if (t === 'single') return ac ? 4000 : 3000;
//       if (t === 'double') return ac ? 10000 : 6000;
//       return ac ? 14000 : 9000;
//     };
    
//     const room: Room = {
//       id: `room_${i}`,
//       roomNumber: 100 + i,
//       type,
//       isAC,
//       rent: getRentValue(type, isAC),
//       isOccupied,
//       tenants: [],
//     };
    
//     if (isOccupied) {
//       const tenant: Tenant = {
//         id: `tenant_${i}`,
//         firstName: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavita', 'Raj', 'Meera', 'Arjun', 'Neha', 'Sanjay', 'Pooja'][i - 1] || 'Guest',
//         lastName: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Verma', 'Gupta', 'Yadav', 'Joshi', 'Mehta', 'Reddy', 'Das', 'Nair'][i - 1] || 'User',
//         email: `tenant${i}@gmail.com`,
//         phone: `98765${String(i).padStart(5, '0')}`,
//         landmark: 'Near Main Market',
//         city: 'Mumbai',
//         state: 'Maharashtra',
//         pincode: '400001',
//         aadhaarNumber: `${String(i).padStart(4, '0')} ${String(i).padStart(4, '0')} ${String(i).padStart(4, '0')}`,
//         tokenMoney: type === 'single' ? 3000 : type === 'double' ? 5000 : 7000,
//         roomNumber: 100 + i,
//         documents: [
//           { id: `doc_${i}_1`, type: 'address_proof', name: 'Electricity Bill.pdf', url: '#', verified: i % 2 === 0, uploadedAt: new Date(2024, 0, 15 + i).toISOString() },
//           { id: `doc_${i}_2`, type: 'id_proof', name: 'Aadhaar Card.pdf', url: '#', verified: i % 2 === 0, uploadedAt: new Date(2024, 0, 15 + i).toISOString() },
//         ],
//         documentsVerified: i % 2 === 0,
//         joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
//         isActive: true,
//       };
      
//       tenants.push(tenant);
//       room.tenants = [tenant];
      
//       // Add payment records
//       const months = ['January', 'February', 'March', 'April', 'May', 'June'];
//       months.forEach((month, idx) => {
//         const prevReading = 100 + (idx * 50);
//         const currReading = prevReading + 30 + Math.floor(Math.random() * 40);
//         const units = currReading - prevReading;
//         const elecAmount = units * 8;
        
//         payments.push({
//           id: `payment_${i}_${idx}`,
//           tenantId: tenant.id,
//           tenantName: `${tenant.firstName} ${tenant.lastName}`,
//           roomNumber: room.roomNumber,
//           month,
//           year: 2024,
//           previousReading: prevReading,
//           currentReading: currReading,
//           unitsUsed: units,
//           electricityRate: 8,
//           electricityAmount: elecAmount,
//           rent: room.rent,
//           totalAmount: room.rent + elecAmount,
//           status: idx < 4 ? 'paid' : 'pending',
//           paidDate: idx < 4 ? new Date(2024, idx, 5).toISOString() : undefined,
//           reminderSent: false,
//         });
//       });
//     }
    
//     rooms.push(room);
//   }
  
//   return { rooms, tenants, payments };
// };

export function DataProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantHistory, setTenantHistory] = useState<TenantHistory[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  


const createTenant = async (data: CreateTenantPayload) => {
    try {
      // Check token before attempting request
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        throw new Error("Not authenticated. Please sign in before adding tenants.");
      }

      // Coerce room id to number when possible
      let roomId: any = data.roomId;
      if (typeof roomId === "string" && /^\d+$/.test(roomId)) {
        roomId = Number(roomId);
      }

      // include multiple field name variants to match unknown backend field names
      const payload: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        // accept both variants
        phone_no: data.phone,
        phone: data.phone,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        // Aadhaar field might be named differently
        aadhar_no: data.aadhaarNumber,
        aadhaar_no: data.aadhaarNumber,
        // token field variants
        token: data.tokenMoney,
        token_money: data.tokenMoney,
        remarks: data.remarks,
        // room reference: send as number if possible, otherwise as-is
        room: roomId,
        room_id: roomId,
        // join_date is required by backend
        join_date: data.joinDate || new Date().toISOString().split('T')[0],
      };

      console.log("Creating tenant with payload:", payload);
      const res = await api.post("/tenants/", payload);
      console.log("Tenant created:", res.data);

      // 🔥 UI refresh - update state with new tenant
      setTenants(prev => [...prev, mapTenantFromApi(res.data)]);
      
      // Try to refresh rooms, but don't break on 401
      // (Room component will re-fetch on mount anyway)
      try {
        await fetchRooms();
      } catch (err: any) {
        if (err?.response?.status !== 401) {
          console.warn("Failed to refresh rooms after tenant creation:", err);
        }
      }
    } catch (error: any) {
      console.error("createTenant error:", error);
      
      // Handle specific error codes
      const status = error?.response?.status;
      if (status === 401) {
        throw new Error("Session expired — please sign in again.");
      }
      if (status === 400) {
        const detail = error.response?.data?.detail || error.response?.data?.message;
        if (detail) {
          throw new Error(`Validation error: ${detail}`);
        }
      }
      
      if (error.response) {
        console.error("createTenant response data:", error.response.data);
        const serverMessage = error.response.data?.message || error.response.data?.detail || JSON.stringify(error.response.data);
        if (serverMessage && serverMessage !== "[object Object]") {
          throw new Error(serverMessage);
        }
      }
      throw error;
    }
  };

  



  // Save to localStorage on changes
  // useEffect(() => {
  //   if (rooms.length > 0) {
  //     localStorage.setItem('rentease_rooms', JSON.stringify(rooms));
  //   }
  // }, [rooms]);

  // useEffect(() => {
  //   if (tenants.length > 0) {
  //     localStorage.setItem('rentease_tenants', JSON.stringify(tenants));
  //   }
  // }, [tenants]);

  // useEffect(() => {
  //   localStorage.setItem('rentease_payments', JSON.stringify(payments));
  // }, [payments]);

  // useEffect(() => {
  //   localStorage.setItem('rentease_history', JSON.stringify(tenantHistory));
  // }, [tenantHistory]);

  // useEffect(() => {
  //   localStorage.setItem('rentease_settings', JSON.stringify(settings));
  // }, [settings]);

  const getRent = (type: 'single' | 'double' | 'triple', isAC: boolean): number => {
    if (type === 'single') {
      return isAC ? settings.rentRates.singleAC : settings.rentRates.singleNonAC;
    }
    if (type === 'double') {
      return isAC ? settings.rentRates.doubleAC : settings.rentRates.doubleNonAC;
    }
    return isAC ? settings.rentRates.tripleAC : settings.rentRates.tripleNonAC;
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const initializeRooms = async (count: number) => {
    try {
      console.log(`�️ First, deleting all existing rooms...`);
      
      // Delete all existing rooms first
      await deleteAllRooms();
      
      console.log(`🚀 Now creating ${count} fresh rooms starting from room #1...`);
      
      for (let i = 1; i <= count; i++) {
        const payload = {
          room_number: i,
          room_type: "single",
          ac_non_ac: "non_ac",
          room_rent: settings.rentRates.singleNonAC,
          facility: 1,
        };
        
        try {
          const res = await api.post("/rooms/", payload);
          console.log(`✅ Room #${i} created (Backend ID: ${res.data?.id})`);
        } catch (err: any) {
          const status = err?.response?.status;
          const msg = err?.response?.data?.message || err.message;
          console.error(`❌ Room #${i} failed (Status: ${status}):`, msg);
          throw err; // Stop if any room fails
        }
      }
      
      console.log(`🎉 All ${count} fresh rooms created successfully (numbered 1-${count})`);
      await fetchRooms(); // Refresh the rooms list from backend
      setSettings(prev => ({ ...prev, totalRooms: count }));
      
    } catch (error) {
      console.error("Error creating rooms:", error);
      throw error;
    }
  };

  
    const deleteAllRooms = async () => {
    try {
      // First, fetch fresh list from backend to ensure we're deleting everything
      const freshRes = await api.get("/rooms/");
      const allRoomsFromBackend = Array.isArray(freshRes.data) ? freshRes.data : freshRes.data?.results || [];
      
      console.log(`🗑️ Fetched ${allRoomsFromBackend.length} rooms from backend, deleting...`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const room of allRoomsFromBackend) {
        try {
          await api.delete(`/rooms/${room.id}/`);
          deletedCount++;
          console.log(`✅ Room #${room.room_number || room.id} (Backend ID: ${room.id}) deleted`);
        } catch (err: any) {
          failedCount++;
          console.error(`❌ Room #${room.room_number || room.id} (ID: ${room.id}) deletion failed:`, err?.response?.status, err?.response?.data?.message);
        }
      }
      
      console.log(`🎉 Deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
      
      // Clear from frontend immediately
      setRooms([]);
      setTenants([]);
      setSettings(prev => ({ ...prev, totalRooms: 0 }));
      
      // Verify deletion by fetching again
      const verifyRes = await api.get("/rooms/");
      const remainingRooms = Array.isArray(verifyRes.data) ? verifyRes.data : verifyRes.data?.results || [];
      console.log(`✅ Verified: ${remainingRooms.length} rooms remaining in backend`);
      
      if (remainingRooms.length > 0) {
        console.warn(`⚠️ WARNING: Still ${remainingRooms.length} rooms in backend after deletion!`);
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
    const res = await api.get("/rooms/");
    console.log("ROOMS FROM API 👉", res.data);
    console.log("RESPONSE TYPE:", typeof res.data, "IS ARRAY:", Array.isArray(res.data));
    
    // Check if response is an array or object with array inside
    const roomsArray = Array.isArray(res.data) ? res.data : res.data?.results || res.data?.data || [];
    console.log("ROOMS ARRAY:", roomsArray);
    
    if (roomsArray.length === 0) {
      console.warn("No rooms found in API response");
    }
    
    setRooms(roomsArray.map(mapRoomFromApi));
  } catch (err) {
    console.error("fetchRooms ERROR:", err);
    setRooms([]);
  }
}, []);

const addRoom = async (room: Omit<Room, "id">) => {
  const res = await api.post("/rooms/", {
    room_type: room.type,
    ac_non_ac: room.isAC ? "ac" : "non_ac",
    room_rent: room.rent,
    facility: 1,
  });

  setRooms(prev => [...prev, mapRoomFromApi(res.data)]);
};

const updateRoom = async (id: string, updates: Partial<Room>) => {
  const res = await api.put(`/rooms/${id}/`, {
    room_type: updates.type,
    ac_non_ac: updates.isAC ? "ac" : "non_ac",
    room_rent: updates.rent,
  });

  setRooms(prev =>
    prev.map(r => (r.id === id ? mapRoomFromApi(res.data) : r))
  );
};



const fetchTenants = useCallback(async () => {
  try {
    const res = await api.get("/tenants/");
    console.log("TENANTS FROM API 👉", res.data);
    console.log("TENANTS RESPONSE TYPE:", typeof res.data, "IS ARRAY:", Array.isArray(res.data));
    
    // Check if response is an array or object with array inside
    const tenantsArray = Array.isArray(res.data) ? res.data : res.data?.results || res.data?.data || [];
    console.log("TENANTS ARRAY:", tenantsArray);
    
    if (tenantsArray.length === 0) {
      console.warn("No tenants found in API response");
    }
    
    setTenants(tenantsArray.map(mapTenantFromApi));
  } catch (err) {
    console.error("fetchTenants error", err);
    setTenants([]);
  }
}, []);

const fetchPayments = useCallback(async () => {
  try {
    const res = await api.get("/payments/");
    setPayments(res.data);
  } catch (err) {
    console.warn("fetchPayments: Payments endpoint not available yet", err);
    setPayments([]);
  }
}, []);

useEffect(() => {
  fetchRooms();
  fetchTenants();
  // fetchPayments(); // ⬅️ Disabled for now (404 error)
}, [fetchRooms, fetchTenants]);

// Link tenants to rooms after both are fetched
useEffect(() => {
  if (rooms.length > 0 && tenants.length > 0) {
    const updatedRooms = rooms.map(room => {
      const roomTenants = tenants.filter(t => t.roomNumber === room.roomNumber);
      return {
        ...room,
        tenants: roomTenants,
        isOccupied: roomTenants.length > 0,
      };
    });
    setRooms(updatedRooms);
    console.log("🔗 Linked tenants to rooms:", updatedRooms);
  }
}, [tenants]);

  const addTenant = (tenant: Omit<Tenant, 'id'>) => {
    const newTenant = { ...tenant, id: `tenant_${Date.now()}` };
    setTenants(prev => [...prev, newTenant]);
    
    // Update room
    setRooms(prev => prev.map(room => 
      room.roomNumber === tenant.roomNumber 
        ? { ...room, isOccupied: true, tenants: [...room.tenants, newTenant] }
        : room
    ));
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === id ? { ...tenant, ...updates } : tenant
    ));
  };

  

  const removeTenant = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (tenant) {
      setTenants(prev => prev.filter(t => t.id !== id));
      setRooms(prev => prev.map(room => 
        room.roomNumber === tenant.roomNumber
          ? { ...room, isOccupied: room.tenants.length > 1, tenants: room.tenants.filter(t => t.id !== id) }
          : room
      ));
    }
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: `payment_${Date.now()}` };
    setPayments(prev => [...prev, newPayment]);
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(payment => 
      payment.id === id ? { ...payment, ...updates } : payment
    ));
  };

  const sendPaymentReminder = (paymentId: string) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId ? { ...payment, reminderSent: true } : payment
    ));
  };

  const verifyDocument = async (tenantId: string, docId: string) => {
  await api.put(`/tenants/${tenantId}/documents/${docId}/verify/`);

  setTenants(prev =>
    prev.map(t =>
      t.id === tenantId
        ? {
            ...t,
            documents: t.documents.map(d =>
              d.id === docId ? { ...d, verified: true } : d
            ),
            documentsVerified: true,
          }
        : t
    )
  );
};






  const verifyAllDocuments = (tenantId: string) => {
    setTenants(prev => prev.map(tenant => {
      if (tenant.id === tenantId) {
        const updatedDocs = tenant.documents.map(doc => ({ ...doc, verified: true }));
        return { ...tenant, documents: updatedDocs, documentsVerified: true };
      }
      return tenant;
    }));
  };
  

  const moveTenantToHistory = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const room = rooms.find(r => r.roomNumber === tenant?.roomNumber);
    
    if (tenant && room) {
      const tenantPayments = payments.filter(p => p.tenantId === tenantId && p.status === 'paid');
      const totalPaid = tenantPayments.reduce((sum, p) => sum + p.totalAmount, 0);
      
      const historyEntry: TenantHistory = {
        id: `history_${Date.now()}`,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        roomNumber: tenant.roomNumber,
        roomType: room.type,
        isAC: room.isAC,
        joinDate: tenant.joinDate,
        leaveDate: new Date().toISOString(),
        totalRentPaid: totalPaid,
        facilities: [room.isAC ? 'AC' : 'Non-AC', room.type === 'triple' ? 'Triple Bed' : room.type === 'double' ? 'Double Bed' : 'Single Bed'],
      };
      
      setTenantHistory(prev => [...prev, historyEntry]);
      removeTenant(tenantId);
    }
  };

  return (
    <DataContext.Provider
      value={{
        rooms,
        tenants,
        payments,
        fetchRooms,
        fetchTenants,
        fetchPayments,
        createTenant, // ✅ REQUIRED
        tenantHistory,
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
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
