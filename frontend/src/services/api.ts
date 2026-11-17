import axios from 'axios';
import Constants from 'expo-constants';
import { emitUnauthorized } from './authEvents';
import { getToken } from './tokenStorage';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const CONFIG_API_URL = Constants.expoConfig?.extra?.apiUrl?.trim();

export function getApiBaseUrl(): string {
  if (ENV_API_URL) return ENV_API_URL;
  if (CONFIG_API_URL) return CONFIG_API_URL;
  if (__DEV__) return 'http://10.0.2.2:5000/api';
  return '';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  if (!getApiBaseUrl()) {
    return Promise.reject(
      new Error(
        'The API URL is not configured. Set EXPO_PUBLIC_API_URL when building the app.',
      ),
    );
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
