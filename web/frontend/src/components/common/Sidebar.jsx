/**
 * File: web/frontend/src/components/common/Sidebar.jsx
 * AccellaX 361° - Sidebar Navigation Component
 * 
 * Description:
 * Role-based sidebar navigation with collapsible sections.
 * Responsive design with mobile drawer functionality.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Award,
  DollarSign,
  UserCheck,
  TrendingUp,
  HelpCircle,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();

  // Navigation items based on role
  const getNavigationItems = () => {
    const items = [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: `/dashboard/${user?.role?.includes('admin') || user?.role === 'owner' ? 'admin' : user?.role?.includes('coach') ? 'coach' : user?.role}`,
        roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent', 'kid', 'sponsor', 'payment_recorder'],
      },
    ];

    // Kids Management
    if (hasRole(['super_admin', 'owner', 'head_coach', 'coach'])) {
      items.push({
        label: 'Kids',
        icon: Users,
        path: '/kids',
        roles: ['super_admin', 'owner', 'head_coach', 'coach'],
      });
    }

    // Attendance
    if (hasRole(['super_admin', 'owner', 'head_coach', 'coach', 'parent'])) {
      items.push({
        label: 'Attendance',
        icon: ClipboardCheck,
        path: '/attendance',
        roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent'],
      });
    }

    // Events
    items.push({
      label: 'Events',
      icon: Calendar,
      path: '/events',
      roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent', 'kid'],
    });

    // Messages
    items.push({
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages',
      roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent'],
    });

    // Coaches (Admin/Owner only)
    if (hasRole(['super_admin', 'owner', 'head_coach'])) {
      items.push({
        label: 'Coaches',
        icon: UserCheck,
        path: '/coaches',
        roles: ['super_admin', 'owner', 'head_coach'],
      });
    }

    // Reports
    if (hasRole(['super_admin', 'owner', 'head_coach', 'coach'])) {
      items.push({
        label: 'Reports',
        icon: FileText,
        path: '/reports',
        roles: ['super_admin', 'owner', 'head_coach', 'coach'],
      });
    }

    // Payments
    if (hasRole(['super_admin', 'owner', 'payment_recorder'])) {
      items.push({
        label: 'Payments',
        icon: DollarSign,
        path: '/payments',
        roles: ['super_admin', 'owner', 'payment_recorder'],
      });
    }

    // Analytics
    if (hasRole(['super_admin', 'owner', 'head_coach', 'sponsor'])) {
      items.push({
        label: 'Analytics',
        icon: TrendingUp,
        path: '/analytics',
        roles: ['super_admin', 'owner', 'head_coach', 'sponsor'],
      });
    }

    // Sponsors
    if (hasRole(['super_admin', 'owner'])) {
      items.push({
        label: 'Sponsors',
        icon: Award,
        path: '/sponsors',
        roles: ['super_admin', 'owner'],
      });
    }

    // Settings
    items.push({
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent', 'payment_recorder'],
    });

    // Help
    items.push({
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/help',
      roles: ['super_admin', 'owner', 'head_coach', 'coach', 'parent', 'kid', 'sponsor', 'payment_recorder'],
    });

    // Filter by user role
    return items.filter(item => 
      !item.roles || item.roles.includes(user?.role)
    );
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${active
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info (Mobile) */}
          <div className="p-4 border-t border-gray-200 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;