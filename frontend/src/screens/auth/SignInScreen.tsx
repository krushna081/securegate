import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import CustomButton from '../../components/CustomButton';

const SignInScreen = () => {
  const { colors, shadows } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.sendOtp(trimmedEmail);
      navigation.navigate('OtpVerification', {
        email: trimmedEmail,
        devOtp: data.devOtp,
      });
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Network') || msg.includes('connect')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Make sure the backend is running.'
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>SecureGate</Text>
          <Text style={[styles.tagline, { color: colors.textLight }]}>
            Society Gate Management
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, shadows.medium]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.welcomeSub, { color: colors.textLight }]}>Sign in to your account</Text>

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter your email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <CustomButton
            title={loading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleSendOtp}
            loading={loading}
            disabled={!email.trim()}
            style={{ marginTop: 20 }}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>new here?</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.signupBtn, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateAccount')}
          >
            <Text style={[styles.signupBtnText, { color: colors.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  shieldIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800' },
  tagline: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 24, padding: 28 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  welcomeSub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  signupBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  signupBtnText: { fontSize: 15, fontWeight: '600' },
});

export default SignInScreen;
