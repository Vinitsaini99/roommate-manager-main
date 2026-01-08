import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  tenantHistory: TenantHistory[];
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
  initializeRooms: (count: number) => void;
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

// Generate initial mock data
const generateInitialData = () => {
  const rooms: Room[] = [];
  const tenants: Tenant[] = [];
  const payments: Payment[] = [];
  
  // Generate 20 rooms with some occupied
  for (let i = 1; i <= 20; i++) {
    const isOccupied = i <= 12;
    const typeOptions: ('single' | 'double' | 'triple')[] = ['single', 'double', 'triple'];
    const type = typeOptions[i % 3];
    const isAC = i % 4 === 0;
    
    const getRentValue = (t: 'single' | 'double' | 'triple', ac: boolean) => {
      if (t === 'single') return ac ? 4000 : 3000;
      if (t === 'double') return ac ? 10000 : 6000;
      return ac ? 14000 : 9000;
    };
    
    const room: Room = {
      id: `room_${i}`,
      roomNumber: 100 + i,
      type,
      isAC,
      rent: getRentValue(type, isAC),
      isOccupied,
      tenants: [],
    };
    
    if (isOccupied) {
      const tenant: Tenant = {
        id: `tenant_${i}`,
        firstName: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavita', 'Raj', 'Meera', 'Arjun', 'Neha', 'Sanjay', 'Pooja'][i - 1] || 'Guest',
        lastName: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Verma', 'Gupta', 'Yadav', 'Joshi', 'Mehta', 'Reddy', 'Das', 'Nair'][i - 1] || 'User',
        email: `tenant${i}@gmail.com`,
        phone: `98765${String(i).padStart(5, '0')}`,
        landmark: 'Near Main Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        aadhaarNumber: `${String(i).padStart(4, '0')} ${String(i).padStart(4, '0')} ${String(i).padStart(4, '0')}`,
        tokenMoney: type === 'single' ? 3000 : type === 'double' ? 5000 : 7000,
        roomNumber: 100 + i,
        documents: [
          { id: `doc_${i}_1`, type: 'address_proof', name: 'Electricity Bill.pdf', url: '#', verified: i % 2 === 0, uploadedAt: new Date(2024, 0, 15 + i).toISOString() },
          { id: `doc_${i}_2`, type: 'id_proof', name: 'Aadhaar Card.pdf', url: '#', verified: i % 2 === 0, uploadedAt: new Date(2024, 0, 15 + i).toISOString() },
        ],
        documentsVerified: i % 2 === 0,
        joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        isActive: true,
      };
      
      tenants.push(tenant);
      room.tenants = [tenant];
      
      // Add payment records
      const months = ['January', 'February', 'March', 'April', 'May', 'June'];
      months.forEach((month, idx) => {
        const prevReading = 100 + (idx * 50);
        const currReading = prevReading + 30 + Math.floor(Math.random() * 40);
        const units = currReading - prevReading;
        const elecAmount = units * 8;
        
        payments.push({
          id: `payment_${i}_${idx}`,
          tenantId: tenant.id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          roomNumber: room.roomNumber,
          month,
          year: 2024,
          previousReading: prevReading,
          currentReading: currReading,
          unitsUsed: units,
          electricityRate: 8,
          electricityAmount: elecAmount,
          rent: room.rent,
          totalAmount: room.rent + elecAmount,
          status: idx < 4 ? 'paid' : 'pending',
          paidDate: idx < 4 ? new Date(2024, idx, 5).toISOString() : undefined,
          reminderSent: false,
        });
      });
    }
    
    rooms.push(room);
  }
  
  return { rooms, tenants, payments };
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantHistory, setTenantHistory] = useState<TenantHistory[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    // Load data from localStorage or initialize
    const savedRooms = localStorage.getItem('rentease_rooms');
    const savedTenants = localStorage.getItem('rentease_tenants');
    const savedPayments = localStorage.getItem('rentease_payments');
    const savedHistory = localStorage.getItem('rentease_history');
    const savedSettings = localStorage.getItem('rentease_settings');
    
    if (savedRooms && savedTenants && savedPayments) {
      setRooms(JSON.parse(savedRooms));
      setTenants(JSON.parse(savedTenants));
      setPayments(JSON.parse(savedPayments));
      setTenantHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setSettings(savedSettings ? JSON.parse(savedSettings) : defaultSettings);
    } else {
      const { rooms, tenants, payments } = generateInitialData();
      setRooms(rooms);
      setTenants(tenants);
      setPayments(payments);
      localStorage.setItem('rentease_rooms', JSON.stringify(rooms));
      localStorage.setItem('rentease_tenants', JSON.stringify(tenants));
      localStorage.setItem('rentease_payments', JSON.stringify(payments));
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem('rentease_rooms', JSON.stringify(rooms));
    }
  }, [rooms]);

  useEffect(() => {
    if (tenants.length > 0) {
      localStorage.setItem('rentease_tenants', JSON.stringify(tenants));
    }
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('rentease_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('rentease_history', JSON.stringify(tenantHistory));
  }, [tenantHistory]);

  useEffect(() => {
    localStorage.setItem('rentease_settings', JSON.stringify(settings));
  }, [settings]);

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

  const initializeRooms = (count: number) => {
    const newRooms: Room[] = [];
    for (let i = 1; i <= count; i++) {
      newRooms.push({
        id: `room_${i}`,
        roomNumber: 100 + i,
        type: 'single',
        isAC: false,
        rent: settings.rentRates.singleNonAC,
        isOccupied: false,
        tenants: [],
      });
    }
    setRooms(newRooms);
    setSettings(prev => ({ ...prev, totalRooms: count }));
  };

  const addRoom = (room: Omit<Room, 'id'>) => {
    const newRoom = { ...room, id: `room_${Date.now()}` };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };

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

  const verifyDocument = (tenantId: string, docId: string) => {
    setTenants(prev => prev.map(tenant => {
      if (tenant.id === tenantId) {
        const updatedDocs = tenant.documents.map(doc => 
          doc.id === docId ? { ...doc, verified: true } : doc
        );
        const allVerified = updatedDocs.every(doc => doc.verified);
        return { ...tenant, documents: updatedDocs, documentsVerified: allVerified };
      }
      return tenant;
    }));
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
    <DataContext.Provider value={{
      rooms,
      tenants,
      payments,
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
      sendPaymentReminder,
    }}>
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
