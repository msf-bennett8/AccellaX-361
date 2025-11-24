/**
 * File: web/frontend/src/components/common/Header.jsx
 * AccellaX 361° - Header Component
 * 
 * Description:
 * Main application header with navigation, notifications, user menu, search,
 * and SECRET ROLE ELEVATION (11 rapid clicks on user avatar).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Search,
  ChevronDown,
  Shield,
  Crown
} from 'lucide-react';

const Header = ({ onMenuToggle, showMenuButton = true }) => {
  const navigate = useNavigate();
  const { user, logout, elevateRole, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  
  // UI State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Elevation State
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [elevationMessage, setElevationMessage] = useState('');
  const [showElevationModal, setShowElevationModal] = useState(false);
  const [elevationPassword, setElevationPassword] = useState('');
  const [targetRole, setTargetRole] = useState('admin');
  const [isElevating, setIsElevating] = useState(false);
  const [elevationError, setElevationError] = useState('');
  
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear elevation message after 3 seconds
  useEffect(() => {
    if (elevationMessage) {
      const timer = setTimeout(() => setElevationMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [elevationMessage]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  /**
   * SECRET ELEVATION FEATURE
   * Click user avatar 11 times rapidly (within 3 seconds) to trigger elevation
   */
  const handleUserAvatarClick = (e) => {
    const now = Date.now();
    
    // Reset if more than 3 seconds since last click
    if (now - lastClickTime > 3000) {
      setClickCount(1);
      setLastClickTime(now);
      setShowUserMenu(!showUserMenu);
      return;
    }
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setLastClickTime(now);
    
    // If rapid clicking detected (5+ clicks), close menu and show countdown
    if (newCount >= 5) {
      setShowUserMenu(false);
    }
    
    // Show countdown messages
    if (newCount === 7) {
      setElevationMessage('🔐 4 more clicks to access elevation...');
    } else if (newCount === 8) {
      setElevationMessage('🔐 3 more clicks...');
    } else if (newCount === 9) {
      setElevationMessage('🔐 2 more clicks...');
    } else if (newCount === 10) {
      setElevationMessage('🔐 1 more click...');
    } else if (newCount === 11) {
      setShowElevationModal(true);
      setClickCount(0);
      setElevationMessage('');
      setElevationError('');
      
      // Auto-select target role based on current role
      if (user?.role === 'admin') {
        setTargetRole('super_admin');
      } else {
        setTargetRole('admin');
      }
    } else if (newCount < 5) {
      // Normal click - toggle menu
      setShowUserMenu(!showUserMenu);
    }
  };

  /**
   * Handle role elevation submission
   */
  const handleElevation = async () => {
    if (!elevationPassword.trim()) {
      setElevationError('Please enter the elevation password');
      return;
    }

    setIsElevating(true);
    setElevationError('');

    try {
      // Call elevation API (this already updates user state)
      const response = await elevateRole('MASTER_SECRET', elevationPassword, targetRole);
      
      // Close modal
      setShowElevationModal(false);
      setElevationPassword('');
      
      // Show success message
      setElevationMessage(`✅ Elevated to ${targetRole.replace('_', ' ')}!`);
      
      // Force clean navigation to dashboard (bypasses unauthorized check)
      setTimeout(() => {
        // Clear any cached route state
        sessionStorage.removeItem('lastRoute');
        
        // Hard navigate to dashboard (new token will be in headers)
        window.location.href = '/dashboard/admin';
      }, 1000); // Reduced to 1 second
      
    } catch (error) {
      console.error("Elevation error:", error);
      setElevationError(
        error.response?.data?.message || 
        "Invalid password. Access denied."
      );
    } finally {
      setIsElevating(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Menu Toggle */}
            <div className="flex items-center space-x-4">
              {showMenuButton && (
                <button
                  onClick={onMenuToggle}
                  className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">
                    AccellaX 361°
                  </h1>
                  <p className="text-xs text-gray-500">Sports Academy Platform</p>
                </div>
              </Link>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search kids, sessions, events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Icon (Mobile) */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md md:hidden">
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto animate-fade-in">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-500">{unreadCount} unread</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <div className="p-4 text-center text-gray-500">
                        <p>No new notifications</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <Link
                        to="/notifications"
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium block text-center"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu - WITH SECRET ELEVATION CLICK */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={handleUserAvatarClick}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace('_', ' ') || 'Role'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 animate-fade-in">
                    <div className="p-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs text-primary-600 mt-1 capitalize flex items-center gap-1">
                        {user?.role === 'super_admin' && <Crown className="w-3 h-3" />}
                        {user?.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-danger-600 hover:bg-danger-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Elevation Countdown Message */}
      {elevationMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-primary-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">{elevationMessage}</span>
          </div>
        </div>
      )}

      {/* Elevation Password Modal */}
      {showElevationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {targetRole === 'super_admin' ? (
                  <Crown className="w-8 h-8 text-yellow-500" />
                ) : (
                  <Shield className="w-8 h-8 text-blue-600" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Role Elevation</h2>
                  <p className="text-sm text-gray-600">
                    Elevate to {targetRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowElevationModal(false);
                  setElevationPassword('');
                  setElevationError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isElevating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This action will grant elevated privileges. Enter the secret password to proceed.
              </p>
            </div>
            
            <input
              type="password"
              placeholder="Enter elevation password"
              value={elevationPassword}
              onChange={(e) => setElevationPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
              autoFocus
              disabled={isElevating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleElevation();
                }
              }}
            />
            
            {elevationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {elevationError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowElevationModal(false);
                  setElevationPassword('');
                  setElevationError('');
                }}
                disabled={isElevating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleElevation}
                disabled={isElevating || !elevationPassword.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isElevating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Elevate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;