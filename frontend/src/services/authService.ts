import api from './api';
import { User } from '../types';

interface AuthResponse {
  token?: string;
  user?: User;
  isNewUser?: boolean;
  registrationToken?: string;
  verified?: boolean;
  verificationToken?: string;
  devOtp?: string;
}

const authService = {
  async sendOtp(email: string): Promise<{ devOtp?: string; message?: string }> {
    const { data } = await api.post('/auth/send-otp', { email });
    return data;
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return data;
  },

  async createAccount(payload: {
    registrationToken: string;
    fullName: string;
    phoneNumber: string;
    role: 'resident' | 'guard';
    inviteCode?: string;
    flatNumber?: string;
    blockName?: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/create-account', payload);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best effort.
    }
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  },

  async getProfile(): Promise<{ user: User }> {
    const { data } = await api.get('/users/profile');
    return data;
  },

  async updateProfile(payload: {
    fullName?: string;
    phoneNumber?: string;
    phoneNumber2?: string;
    photoUrl?: string | null;
    flatNumber?: string;
    blockName?: string;
    gateNumber?: string;
    verificationToken?: string;
  }): Promise<{ user: User }> {
    const { data } = await api.patch('/users/profile', payload);
    return data;
  },

  async sendProfileOtp(): Promise<{ devOtp?: string; message?: string }> {
    const { data } = await api.post('/users/send-otp');
    return data;
  },

  async verifyProfileOtp(otp: string): Promise<{ verified: boolean; verificationToken: string }> {
    const { data } = await api.post('/users/verify-otp', { otp });
    return data;
  },

  async registerPushToken(pushToken: string): Promise<void> {
    await api.post('/users/push-token', { pushToken });
  },

  async unregisterPushToken(): Promise<void> {
    await api.delete('/users/push-token');
  },
};

export default authService;
