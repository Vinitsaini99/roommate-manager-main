import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText,
  LogOut,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/tenant', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/tenant/payments', icon: CreditCard, label: 'Rent Details' },
  { path: '/tenant/documents', icon: FileText, label: 'Documents' },
];

interface TenantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantSidebar({ isOpen, onClose }: TenantSidebarProps) {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out',
      'md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">RentEase</h1>
              <p className="text-xs text-sidebar-foreground/60">Tenant Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.end 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={cn(
                      'nav-link',
                      isActive && 'nav-link-active'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {user?.name?.charAt(0) || 'T'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60">Room #{user?.roomNumber}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
