/**
 * File: web/frontend/src/services/kidService.js
 * Kid management service
 */

import api, { getErrorMessage } from './api';

export const getKids = async (filters = {}) => {
  try {
    const response = await api.get('/kids', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getKid = async (kidId) => {
  try {
    const response = await api.get(`/kids/${kidId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createKid = async (kidData) => {
  try {
    const response = await api.post('/kids', kidData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateKid = async (kidId, kidData) => {
  try {
    const response = await api.put(`/kids/${kidId}`, kidData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteKid = async (kidId) => {
  try {
    const response = await api.delete(`/kids/${kidId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const suspendKid = async (kidId) => {
  try {
    const response = await api.post(`/kids/${kidId}/suspend`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const activateKid = async (kidId) => {
  try {
    const response = await api.post(`/kids/${kidId}/activate`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getKidAttendanceHistory = async (kidId) => {
  try {
    const response = await api.get(`/kids/${kidId}/attendance-history`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getKidStatistics = async (kidId) => {
  try {
    const response = await api.get(`/kids/${kidId}/statistics`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getKids,
  getKid,
  createKid,
  updateKid,
  deleteKid,
  suspendKid,
  activateKid,
  getKidAttendanceHistory,
  getKidStatistics,
};
