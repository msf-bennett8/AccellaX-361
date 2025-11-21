/**
 * File: web/frontend/src/services/messageService.js
 * Messaging service
 */

import api, { getErrorMessage } from './api';

export const getMessages = async (filters = {}) => {
  try {
    const response = await api.get('/messages', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await api.post('/messages/send', messageData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getConversation = async (userId) => {
  try {
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/messages/group/create', groupData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const sendGroupMessage = async (groupId, messageData) => {
  try {
    const response = await api.post(`/messages/group/${groupId}/send`, messageData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getMessages,
  sendMessage,
  getConversation,
  createGroup,
  sendGroupMessage,
};