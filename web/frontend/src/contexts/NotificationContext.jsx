/**
 * File: web/frontend/src/contexts/NotificationContext.jsx
 * AccellaX 361° - Notification Context
 * 
 * Description:
 * Provides real-time notification system throughout the app.
 * Listens to Firebase for new notifications and manages notification state.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firebaseService from '@/services/firebaseService';
import notificationService from '@/services/notificationService';
import toast from 'react-hot-toast';

// Create context
const NotificationContext = createContext(null);

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      const unsubscribe = subscribeToNotifications();
      return () => unsubscribe && unsubscribe();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Subscribe to Firebase notifications
  const subscribeToNotifications = () => {
    try {
      const unsubscribe = firebaseService.subscribeToNotifications(
        user.id,
        (newNotifications) => {
          setNotifications(newNotifications);
          
          // Count unread
          const unread = newNotifications.filter(n => !n.read).length;
          setUnreadCount(unread);

          // Show toast for new notifications
          if (newNotifications.length > notifications.length) {
            const latestNotification = newNotifications[0];
            if (!latestNotification.read) {
              showToast(latestNotification);
            }
          }

          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Subscribe to notifications error:', error);
      setLoading(false);
      return null;
    }
  };

  // Show toast notification
  const showToast = (notification) => {
    const types = {
      success: () => toast.success(notification.message),
      error: () => toast.error(notification.message),
      warning: () => toast(notification.message, { icon: '⚠️' }),
      info: () => toast(notification.message, { icon: 'ℹ️' }),
    };

    const showFn = types[notification.type] || types.info;
    showFn();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await firebaseService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      throw error;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      throw error;
    }
  };

  // Create popup notification (admin only)
  const createPopupNotification = async (notificationData) => {
    try {
      await notificationService.createPopupNotification(notificationData);
      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('❌ Create popup error:', error);
      toast.error('Failed to send notification');
      throw error;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    try {
      const freshNotifications = await firebaseService.getUserNotifications(user.id);
      setNotifications(freshNotifications);
      
      const unread = freshNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Refresh notifications error:', error);
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createPopupNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;