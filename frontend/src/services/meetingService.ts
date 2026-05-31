import api from './api';
import { Meeting } from '../types';

export const meetingService = {
  getAll: async (): Promise<{ meetings: Meeting[] }> => {
    const { data } = await api.get('/meetings');
    return data;
  },
  create: async (formData: {
    title: string;
    description?: string;
    date: string;
    time: string;
    location?: string;
  }): Promise<{ meeting: Meeting }> => {
    const { data } = await api.post('/meetings', formData);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/meetings/${id}`);
  },
};
