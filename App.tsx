import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './frontend/src/context/AuthContext';
import { ThemeProvider } from './frontend/src/context/ThemeContext';
import AppNavigator from './frontend/src/navigation/AppNavigator';
import {
  setupNotificationCategories,
  handleNotificationResponse,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
  requestPermissions,
} from './frontend/src/services/notificationService';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30 * 1000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const responseListener = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const init = async () => {
      await SplashScreen.hideAsync();
      await setupNotificationCategories();

      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        await handleNotificationResponse(lastResponse);
      }

      responseListener.current = addNotificationResponseReceivedListener(async (response) => {
        await handleNotificationResponse(response);
      });
    };
    init();

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
