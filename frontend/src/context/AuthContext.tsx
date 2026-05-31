import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { getToken, removeToken } from '../services/api';
import {
  getExpoPushToken,
  registerPushTokenWithBackend,
  unregisterPushTokenFromBackend,
  runCatchUp,
  setupNotificationCategories,
  requestPermissions,
} from '../services/notificationService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  notificationPermissionAsked: boolean;
}

type AuthAction =
  | { type: 'RESTORE'; user: User; token: string }
  | { type: 'LOGIN'; user: User; token: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'NOTIFICATION_PERMISSION_ASKED' };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  notificationPermissionAsked: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE':
    case 'LOGIN':
      return { ...state, user: action.user, token: action.token, isLoading: false, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isLoading: false, isAuthenticated: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'NOTIFICATION_PERMISSION_ASKED':
      return { ...state, notificationPermissionAsked: true };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  markNotificationPermissionAsked: () => void;
  setupPushNotifications: () => Promise<void>;
  performCatchUp: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: () => {},
  logout: () => {},
  markNotificationPermissionAsked: () => {},
  setupPushNotifications: async () => {},
  performCatchUp: async () => 0,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    restoreToken();
  }, []);

  async function restoreToken() {
    const timeout = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }, 5000);

    try {
      const token = await getToken();
      clearTimeout(timeout);
      if (!token) {
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
      const { user } = await authService.getProfile();
      dispatch({ type: 'RESTORE', user, token });
    } catch {
      clearTimeout(timeout);
      try { await removeToken(); } catch {}
      dispatch({ type: 'LOGOUT' });
    }
  }

  const login = (user: User, token: string) => {
    dispatch({ type: 'LOGIN', user, token });
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const markNotificationPermissionAsked = () => {
    dispatch({ type: 'NOTIFICATION_PERMISSION_ASKED' });
  };

  const setupPushNotifications = async () => {
    try {
      await setupNotificationCategories();
      const granted = await requestPermissions();
      if (granted) {
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          await registerPushTokenWithBackend(pushToken);
        }
      }
    } catch {}
  };

  const performCatchUp = async (): Promise<number> => {
    try {
      return await runCatchUp();
    } catch {
      return 0;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, markNotificationPermissionAsked, setupPushNotifications, performCatchUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
