import React from 'react';
import { BarChart3, TrendingUp, IndianRupee, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/formatters';

export default function AdminReports() {
  const { payments, rooms, tenants } = useData();

  // Monthly revenue data
  const monthlyData = [
    { month: 'Jan', revenue: 0, expected: 0 },
    { month: 'Feb', revenue: 0, expected: 0 },
    { month: 'Mar', revenue: 0, expected: 0 },
    { month: 'Apr', revenue: 0, expected: 0 },
    { month: 'May', revenue: 0, expected: 0 },
    { month: 'Jun', revenue: 0, expected: 0 },
    { month: 'Jul', revenue: 0, expected: 0 },
    { month: 'Aug', revenue: 0, expected: 0 },
    { month: 'Sep', revenue: 0, expected: 0 },
    { month: 'Oct', revenue: 0, expected: 0 },
    { month: 'Nov', revenue: 0, expected: 0 },
    { month: 'Dec', revenue: 0, expected: 0 },
  ];

  const monthMap: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  // Calculate monthly revenue
  payments.forEach(payment => {
    const monthIndex = monthMap[payment.month];
    if (monthIndex !== undefined) {
      if (payment.status === 'paid') {
        monthlyData[monthIndex].revenue += payment.totalAmount;
      }
      monthlyData[monthIndex].expected += payment.totalAmount;
    }
  });

  // Yearly data (last 3 years for comparison)
  const yearlyData = [
    { year: '2022', revenue: 850000 },
    { year: '2023', revenue: 1250000 },
    { year: '2024', revenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0) || 720000 },
  ];

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalExpected = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const avgMonthlyRevenue = totalRevenue / 6; // Based on 6 months of data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Financial overview and revenue analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card-gradient gradient-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-foreground mt-1">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-primary-foreground/60 mt-1">All time collected</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="stat-card-gradient gradient-success">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-success-foreground/80">Expected Revenue</p>
              <p className="text-2xl font-bold text-success-foreground mt-1">
                {formatCurrency(totalExpected)}
              </p>
              <p className="text-xs text-success-foreground/60 mt-1">Total billable</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success-foreground" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Monthly</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(avgMonthlyRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Per month avg</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Paid vs expected</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-6">Monthly Revenue (2024)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Collected"
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expected" 
                  name="Expected"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Revenue Chart */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-6">Yearly Revenue Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Room Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rooms</span>
              <span className="font-semibold text-foreground">{rooms.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Occupied</span>
              <span className="font-semibold text-success">{rooms.filter(r => r.isOccupied).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-foreground">{rooms.filter(r => !r.isOccupied).length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Occupancy Rate</span>
              <span className="font-semibold text-primary">
                {Math.round((rooms.filter(r => r.isOccupied).length / rooms.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Tenant Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Tenants</span>
              <span className="font-semibold text-foreground">{tenants.filter(t => t.isActive).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documents Verified</span>
              <span className="font-semibold text-success">{tenants.filter(t => t.documentsVerified).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Verification</span>
              <span className="font-semibold text-warning">{tenants.filter(t => !t.documentsVerified && t.isActive).length}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Payment Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Payments</span>
              <span className="font-semibold text-foreground">{payments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-semibold text-success">{payments.filter(p => p.status === 'paid').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-warning">{payments.filter(p => p.status === 'pending').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
