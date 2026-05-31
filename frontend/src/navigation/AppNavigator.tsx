import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import PreApprovalScreen from '../screens/PreApprovalScreen';
import EditVisitorScreen from '../screens/guard/EditVisitorScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ResidentsListScreen from '../screens/guard/ResidentsListScreen';
import NotificationPermissionScreen from '../screens/NotificationPermissionScreen';
import { checkPermissionStatus, setNotificationResponseHandler } from '../services/notificationService';
import { visitorService } from '../services/visitorService';
import { useTheme } from '../context/ThemeContext';

// Expo Go (SDK 53+) does not support remote push notifications
const isExpoGo = Constants.appOwnership === 'expo';

const Stack = createNativeStackNavigator();

const NotificationHandler = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    setNotificationResponseHandler(async (data, actionId) => {
      if ((actionId === 'details' || actionId === 'default') && data?.visitorId) {
        try {
          const { visitor } = await visitorService.getById(data.visitorId);
          navigation.navigate('EditVisitor', { visitor });
        } catch {}
      }
    });
  }, [navigation]);

  return null;
};

const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡️</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>SecureGate</Text>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={{ marginTop: 20 }} />
    </View>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, notificationPermissionAsked, markNotificationPermissionAsked, setupPushNotifications, performCatchUp } = useAuth();
  const [showPermission, setShowPermission] = useState(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    if (initialCheckDone.current) return;
    if (!isAuthenticated || !user) return;

    initialCheckDone.current = true;

    // Expo Go (SDK 53+) does not support remote push — skip entirely
    if (isExpoGo) return;

    checkPermissionStatus().then((granted) => {
      if (granted) {
        setupPushNotifications().then(() => performCatchUp());
      } else if (!notificationPermissionAsked) {
        setShowPermission(true);
      }
    });
  }, [isAuthenticated, user]);

  const handlePermissionComplete = useCallback((granted: boolean) => {
    setShowPermission(false);
    if (granted) {
      markNotificationPermissionAsked();
    }
    setupPushNotifications().then(() => {
      performCatchUp();
    });
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && showPermission) {
    return <NotificationPermissionScreen onComplete={handlePermissionComplete} />;
  }

  return (
    <NavigationContainer>
      <NotificationHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="PreApproval" component={PreApprovalScreen} />
            <Stack.Screen name="EditVisitor" component={EditVisitorScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ResidentsList" component={ResidentsListScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
