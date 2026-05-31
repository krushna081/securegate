import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';
import { visitorService } from './visitorService';

// Expo Go (SDK 53+) does not support remote push notifications on Android.
// This flag lets us skip token registration in Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CATEGORY_ID = 'visitor-approval';

export const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: 'approve',
      buttonTitle: '✅ Approve',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'reject',
      buttonTitle: '❌ Reject',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'details',
      buttonTitle: '👁️ See More',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
};

export const checkPermissionStatus = async (): Promise<boolean> => {
  try {
    if (!Device.isDevice || isExpoGo) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice || isExpoGo) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B46C1',
    });
  }

  return true;
};

export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice || isExpoGo) {
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    return token;
  } catch {
    return null;
  }
};

export const registerPushTokenWithBackend = async (pushToken: string) => {
  if (isExpoGo) return;
  try {
    await api.post('/users/push-token', { pushToken });
  } catch {}
};

export const unregisterPushTokenFromBackend = async () => {
  if (isExpoGo) return;
  try {
    await api.delete('/users/push-token');
  } catch {}
};

let onNotificationResponse: ((data: any, actionId: string) => void) | null = null;

export const setNotificationResponseHandler = (
  handler: (data: any, actionId: string) => void,
) => {
  onNotificationResponse = handler;
};

export const handleNotificationResponse = async (
  response: Notifications.NotificationResponse,
) => {
  const data = response.notification.request.content.data;
  const actionId = response.actionIdentifier;

  if (actionId === 'expo.modules.notifications.actions.DEFAULT') {
    if (onNotificationResponse) {
      onNotificationResponse(data, 'default');
    }
    return;
  }

  if (actionId === 'approve' || actionId === 'reject') {
    const visitorId = data?.visitorId;
    if (visitorId) {
      const status = actionId === 'approve' ? 'approved' : 'rejected';
      try {
        await visitorService.updateStatus(visitorId as string, status);
      } catch {}
    }

    if (onNotificationResponse) {
      onNotificationResponse(data, actionId);
    }
    return;
  }

  if (actionId === 'details') {
    if (onNotificationResponse) {
      onNotificationResponse(data, 'details');
    }
  }
};

export const runCatchUp = async (): Promise<number> => {
  try {
    const { data } = await api.get('/notifications/catchup');
    return data.missed || 0;
  } catch {
    return 0;
  }
};

export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void,
) => {
  return Notifications.addNotificationReceivedListener(handler);
};

export const addNotificationResponseReceivedListener = (
  handler: (response: Notifications.NotificationResponse) => void,
) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

export const getLastNotificationResponse = async () => {
  return Notifications.getLastNotificationResponseAsync();
};
