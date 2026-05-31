import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import Constants from 'expo-constants';
import { colors, shadows } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import { requestPermissions, getExpoPushToken, registerPushTokenWithBackend, setupNotificationCategories } from '../services/notificationService';

const isExpoGo = Constants.appOwnership === 'expo';

const NotificationPermissionScreen = ({ onComplete }: { onComplete: (granted: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const handleEnable = async () => {
    setLoading(true);

    // Expo Go does not support remote push — pass through without error
    if (isExpoGo) {
      setLoading(false);
      onComplete(false);
      return;
    }

    const granted = await requestPermissions();
    if (granted) {
      await setupNotificationCategories();
      const token = await getExpoPushToken();
      if (token) {
        await registerPushTokenWithBackend(token);
      }
    }
    setLoading(false);
    onComplete(granted);
  };

  const handleSkip = () => {
    setSkipped(true);
    onComplete(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>
        <Text style={styles.title}>Stay Updated</Text>
        <Text style={styles.subtitle}>
          Get instant alerts when visitors arrive at your gate.
          Approve or reject entries right from the notification.
        </Text>
      </View>

      <View style={styles.featureList}>
        <FeatureRow icon="🚪" text="Know when someone visits your flat" />
        <FeatureRow icon="✅" text="Approve visitors with one tap" />
        <FeatureRow icon="📋" text="Never miss a delivery or guest" />
        <FeatureRow icon="🔄" text="Catch up on missed visits" />
      </View>

      <View style={styles.bottomSection}>
        <CustomButton
          title="Enable Notifications"
          onPress={handleEnable}
          loading={loading}
          variant="primary"
        />
        <View style={{ height: 12 }} />
        <CustomButton
          title="Skip for Now"
          onPress={handleSkip}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
};

const FeatureRow = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureRow}>
    <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryLight }]}>
      <Text style={styles.featureIcon}>{icon}</Text>
    </View>
    <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bellIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    marginTop: 'auto',
  },
});

export default NotificationPermissionScreen;
