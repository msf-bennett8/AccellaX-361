/**
 * File: web/frontend/src/components/dashboard/admin/AdminStats.jsx
 * AccellaX 361° - Admin Statistics Component
 * 
 * Description:
 * Overview statistics cards for admin dashboard.
 */

import React from 'react';
import { Users, ClipboardCheck, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/common/Card';

const AdminStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Kids',
      value: stats?.totalKids || 0,
      change: stats?.kidsChange || 0,
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      change: stats?.attendanceChange || 0,
      icon: ClipboardCheck,
      color: 'success',
    },
    {
      label: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      change: null,
      icon: Calendar,
      color: 'warning',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats?.revenue || 0}`,
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'primary',
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change > 0;
        
        return (
          <Card key={index} hover>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                
                {stat.change !== null && (
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-success-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-danger-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-sm text-gray-500">vs last month</span>
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStats;