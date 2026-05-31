import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
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

const BACKGROUND_NOTIF_ID = 'securegate-running';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30 * 1000, refetchOnWindowFocus: false },
  },
});

async function showBackgroundNotification() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: BACKGROUND_NOTIF_ID,
      content: {
        title: 'SecureGate',
        body: 'App is running — monitoring visitors',
        data: { type: 'background' },
        priority: Notifications.AndroidNotificationPriority.LOW,
        sound: false,
        vibrate: [0],
        autoDismiss: false,
        ...(Platform.OS === 'android' ? { ongoing: true } : {}),
      } as Notifications.NotificationContentInput,
      trigger: null,
    });
  } catch {}
}

async function cancelBackgroundNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync(BACKGROUND_NOTIF_ID);
  } catch {}
}

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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        await showBackgroundNotification();
      }

      if ((prevState === 'background' || prevState === 'inactive') && nextState === 'active') {
        await cancelBackgroundNotification();
      }
    });

    return () => subscription.remove();
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
