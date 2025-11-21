/**
 * File: web/frontend/src/services/eventService.js
 * Event management service
 */

import api, { getErrorMessage } from './api';

export const getEvents = async (filters = {}) => {
  try {
    const response = await api.get('/events', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getEvent = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}`);
     return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const rsvpEvent = async (eventId, status) => {
  try {
    const response = await api.post(`/events/${eventId}/rsvp`, { status });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
};