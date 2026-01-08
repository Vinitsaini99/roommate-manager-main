import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roomNumber?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  { id: '1', email: 'admin@rentease.com', password: 'admin123', name: 'Admin User', role: 'admin' },
  { id: '2', email: 'tenant@rentease.com', password: 'tenant123', name: 'Rahul Sharma', role: 'tenant', roomNumber: 101 },
  { id: '3', email: 'priya@gmail.com', password: 'tenant123', name: 'Priya Patel', role: 'tenant', roomNumber: 102 },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rentease_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('rentease_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    // Check if tenant exists in localStorage (added by admin)
    const tenants = JSON.parse(localStorage.getItem('rentease_tenants') || '[]');
    const tenant = tenants.find((t: any) => t.email === email);
    
    if (tenant) {
      const tenantUser: User = {
        id: tenant.id,
        email: tenant.email,
        name: `${tenant.firstName} ${tenant.lastName}`,
        role: 'tenant',
        roomNumber: tenant.roomNumber,
      };
      setUser(tenantUser);
      localStorage.setItem('rentease_user', JSON.stringify(tenantUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rentease_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
