/**
 * File: web/frontend/src/services/notificationService.js
 * Notification service
 */

import api, { getErrorMessage } from './api';

export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createPopupNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications/popup', notificationData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await api.post('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getNotifications,
  createPopupNotification,
  markAsRead,
  markAllAsRead,
};