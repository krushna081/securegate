import api, { setToken } from './api';
import { User } from '../types';

interface SendOtpResponse {
  message: string;
  devOtp?: string;
}

interface VerifyOtpResponse {
  token: string;
  user: User;
}

interface ProfileOtpResponse {
  message: string;
  devOtp?: string;
}

interface VerifyProfileOtpResponse {
  verified: boolean;
  phoneVerifiedToken: string;
}

export const authService = {
  sendOtp: async (email: string): Promise<SendOtpResponse> => {
    const { data } = await api.post<SendOtpResponse>('/auth/send-otp', { email });
    return data;
  },

  verifyOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', { email, otp });
    await setToken(data.token);
    return data;
  },

  createAccount: async (fullName: string, email: string, role: string = 'resident', phoneNumber?: string, flatNumber?: string, blockName?: string) => {
    const { data } = await api.post('/auth/create-account', { fullName, email, role, phoneNumber, flatNumber, blockName });
    return data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await api.get<{ user: User }>('/users/profile');
    return data;
  },

  updateProfile: async (updates: {
    fullName?: string;
    phoneNumber?: string;
    phoneNumber2?: string;
    photoUrl?: string;
    flatNumber?: string;
    blockName?: string;
    gateNumber?: string;
    phoneVerifiedToken?: string;
  }): Promise<{ user: User }> => {
    const { data } = await api.patch<{ user: User }>('/users/profile', updates);
    return data;
  },

  sendProfileOtp: async (): Promise<ProfileOtpResponse> => {
    const { data } = await api.post<ProfileOtpResponse>('/users/send-otp');
    return data;
  },

  verifyProfileOtp: async (otp: string): Promise<VerifyProfileOtpResponse> => {
    const { data } = await api.post<VerifyProfileOtpResponse>('/users/verify-otp', { otp });
    return data;
  },

  logout: async () => {
    await setToken(null);
  },
};
