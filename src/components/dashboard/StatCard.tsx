import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  subtitle?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = 'default',
  subtitle 
}: StatCardProps) {
  const variants = {
    default: 'stat-card',
    primary: 'stat-card-gradient gradient-primary',
    success: 'stat-card-gradient gradient-success',
    warning: 'stat-card-gradient gradient-warning',
  };

  const isGradient = variant !== 'default';

  return (
    <div className={cn(variants[variant], 'animate-fade-in')}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs md:text-sm font-medium truncate',
            isGradient ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-xl md:text-3xl font-bold mt-1 md:mt-2 truncate',
            isGradient ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs md:text-sm mt-1 truncate',
              isGradient ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-1 md:mt-2 text-xs md:text-sm',
              isGradient 
                ? 'text-white/80'
                : trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="truncate">{Math.abs(trend.value)}% from last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl shrink-0 ml-3',
          isGradient ? 'bg-white/20' : 'bg-primary/10'
        )}>
          <Icon className={cn(
            'h-5 w-5 md:h-6 md:w-6',
            isGradient ? 'text-white' : 'text-primary'
          )} />
        </div>
      </div>
    </div>
  );
}
