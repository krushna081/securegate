import api from './api';
import { Visitor, PreApproval } from '../types';

export const visitorService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    flatId?: string;
  }): Promise<{ visitors: Visitor[]; total: number; page: number; pages: number }> => {
    const { data } = await api.get('/visitors', { params });
    return data;
  },

  getStats: async (): Promise<{
    total: number;
    pending: number;
    approvedToday: number;
    rejectedToday: number;
    today: number;
  }> => {
    const { data } = await api.get('/visitors/stats');
    return data;
  },

  getById: async (id: string): Promise<{ visitor: Visitor }> => {
    const { data } = await api.get(`/visitors/${id}`);
    return data;
  },

  create: async (formData: {
    visitorName: string;
    visitorType: string;
    photoUrl?: string;
    flatId: string;
    notes?: string;
    vehicleNumber?: string;
    phoneNumber?: string;
  }): Promise<{ visitor: Visitor }> => {
    const { data } = await api.post('/visitors', formData);
    return data;
  },

  updateStatus: async (id: string, status: string): Promise<{ visitor: Visitor }> => {
    const { data } = await api.patch(`/visitors/${id}/status`, { status });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visitors/${id}`);
  },

  update: async (id: string, formData: {
    visitorName?: string;
    visitorType?: string;
    phoneNumber?: string;
    flatId?: string;
    notes?: string;
    vehicleNumber?: string;
  }): Promise<{ visitor: Visitor }> => {
    const { data } = await api.put(`/visitors/${id}`, formData);
    return data;
  },
};

export const preApprovalService = {
  update: async (id: string, data: {
    guestName?: string;
    numberOfPeople?: number;
    vehicleType?: string;
    vehicleNumber?: string;
    expectedTime?: string;
    notes?: string;
  }): Promise<{ preApproval: PreApproval }> => {
    const { data: res } = await api.put(`/pre-approvals/${id}`, data);
    return res;
  },
  updateStatus: async (id: string, status: string): Promise<{ preApproval: PreApproval }> => {
    const { data } = await api.patch(`/pre-approvals/${id}/status`, { status });
    return data;
  },
};

export const userService = {
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },

  getAllUsers: async (params?: { role?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/users/all', { params });
    return data;
  },

  getFlats: async () => {
    const { data } = await api.get('/users/flats');
    return data;
  },

  getSocieties: async () => {
    const { data } = await api.get('/users/societies');
    return data;
  },
};
