import React from 'react';
import {
  View, Text, StyleSheet, StatusBar, ScrollView, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, shadows } from '../constants/theme';
import CustomButton from '../components/CustomButton';

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.gradientSection}>
          <Text style={styles.shield}>🛡️</Text>
          <Text style={styles.appName}>SecureGate</Text>
          <Text style={styles.tagline}>Smart Visitor Management{'\n'}for Modern Societies</Text>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <Text style={styles.cardIcon}>ℹ️</Text>
              </View>
              <Text style={styles.cardTitle}>About the App</Text>
            </View>
            <Text style={styles.cardBody}>
              Streamline visitor entry and exit at your residential society.
              Real-time tracking, digital logs, and instant notifications
              for a secure and modern living experience.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <Text style={styles.cardIcon}>🔔</Text>
              </View>
              <Text style={styles.cardTitle}>Real-time Alerts</Text>
            </View>
            <Text style={styles.cardBody}>
              Get instant notifications when visitors arrive. Approve or
              reject entries from anywhere with one tap.
            </Text>
          </View>

          <View style={styles.buttonSection}>
            <CustomButton
              title="Sign In"
              onPress={() => navigation.navigate('SignIn')}
              variant="primary"
            />
            <View style={{ height: 12 }} />
            <CustomButton
              title="Create Account"
              onPress={() => navigation.navigate('CreateAccount')}
              variant="grey"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradientSection: {
    backgroundColor: colors.primary,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  shield: {
    fontSize: 72,
    marginBottom: 12,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  cardSection: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  buttonSection: {
    marginTop: 20,
    paddingHorizontal: 0,
  },
});

export default WelcomeScreen;
