import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'securegate_token';
const API_URL_KEY = 'securegate_api_url';

function getDefaultApiUrl(): string {
  if (!__DEV__) return 'https://securegate-api.vercel.app/api';

  try {
    const Constants = require('expo-constants').default;
    const configuredUrl = Constants.expoConfig?.extra?.apiUrl;
    if (configuredUrl) {
      return configuredUrl;
    }
  } catch {}

  return 'http://10.0.2.2:4000/api';
}

const DEFAULT_BASE_URL = getDefaultApiUrl();

const api: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const [token, customUrl] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(API_URL_KEY),
      ]);

      if (customUrl && config.baseURL !== customUrl) {
        config.baseURL = customUrl;
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch { /* ignore */ }

    if (__DEV__) {
      console.log('[API]', config.method?.toUpperCase(), (config.baseURL ?? '') + (config.url ?? ''));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    if (__DEV__) {
      console.log('[API] Error:', error.config?.url, message);
    }
    return Promise.reject(new Error(message));
  }
);

export const setToken = async (token: string | null) => {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getStoredApiUrl = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(API_URL_KEY);
  } catch {
    return null;
  }
};

export const setStoredApiUrl = async (url: string | null) => {
  if (url) {
    await SecureStore.setItemAsync(API_URL_KEY, url);
  } else {
    await SecureStore.deleteItemAsync(API_URL_KEY);
  }
};

export const getCurrentBaseUrl = () => api.defaults.baseURL;

export default api;
