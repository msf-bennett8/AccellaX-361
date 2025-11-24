/**
 * File: web/frontend/src/services/dashboardService.js
 * Dashboard data service - adapted for AccellaX 361°
 */

import api, { getErrorMessage } from './api';

// Get owner/admin dashboard overview
export const getOwnerOverview = async (period = 'week') => {
  try {
    const response = await api.get(`/dashboard/owner/overview`, { params: { period } });
    return response.data;
  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get transactions
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Transactions error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get payment methods breakdown
export const getPaymentMethodsBreakdown = async (period = 'week') => {
  try {
    const response = await api.get('/dashboard/payment-methods', { params: { period } });
    return response.data;
  } catch (error) {
    console.error('❌ Payment methods error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get sale channels breakdown
export const getSaleChannelsBreakdown = async (period = 'week') => {
  try {
    const response = await api.get('/dashboard/sale-channels', { params: { period } });
    return response.data;
  } catch (error) {
    console.error('❌ Sale channels error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get top sellers
export const getTopSellers = async (limit = 5, period = 'week') => {
  try {
    const response = await api.get('/dashboard/top-sellers', { params: { limit, period } });
    return response.data;
  } catch (error) {
    console.error('❌ Top sellers error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get recent orders
export const getRecentOrders = async (limit = 10) => {
  try {
    const response = await api.get('/dashboard/recent-orders', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('❌ Recent orders error:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Get order status distribution
export const getOrderStatusDistribution = async (period = 'week') => {
  try {
    const response = await api.get('/dashboard/order-status', { params: { period } });
    return response.data;
  } catch (error) {
    console.error('❌ Order status error:', error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getOwnerOverview,
  getTransactions,
  getPaymentMethodsBreakdown,
  getSaleChannelsBreakdown,
  getTopSellers,
  getRecentOrders,
  getOrderStatusDistribution,
};
