import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const OtpVerificationScreen = () => {
  const { colors, shadows } = useTheme();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { login } = useAuth();
  const params = route.params as { email: string; devOtp?: string; justCreated?: boolean };
  const { email, devOtp, justCreated } = params;

  useEffect(() => {
    if (devOtp) setOtp(devOtp);
  }, [devOtp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.verifyOtp(email, otp);
      login(data.user, data.token);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Network') || msg.includes('connect')) {
        Alert.alert(
          'Connection Error',
          'Cannot reach the server. Please check that the backend is running at the correct IP address.'
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const data = await authService.sendOtp(email);
      setResendTimer(30);
      if (data.devOtp) setOtp(data.devOtp);
      Alert.alert('Success', 'New OTP sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.primary }]}>Verify OTP</Text>
      <Text style={[styles.subtitle, { color: colors.textLight }]}>
        {justCreated
          ? 'Account created! Verify your email to sign in'
          : 'Enter the code sent to your email'}
      </Text>
      <Text style={[styles.email, { color: colors.primary }]}>{email}</Text>

      <TextInput
        style={[styles.otpInput, { borderColor: colors.primary, backgroundColor: colors.card, color: colors.text }, shadows.small]}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        placeholderTextColor={colors.textMuted}
      />

      <CustomButton
        title={loading ? 'Signing in...' : 'Verify & Sign In'}
        onPress={handleVerify}
        loading={loading}
        disabled={otp.length !== 6}
      />

      <TouchableOpacity
        style={styles.resendContainer}
        onPress={handleResend}
        disabled={resendTimer > 0}
      >
        <Text style={[styles.resendText, { color: colors.primary }, resendTimer > 0 && { color: colors.textMuted }]}>
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  backRow: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
  backBtn: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  email: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  otpInput: {
    borderWidth: 2, borderRadius: 14, padding: 16, fontSize: 28,
    textAlign: 'center', letterSpacing: 12, marginVertical: 32,
  },
  resendContainer: { marginTop: 24, alignItems: 'center' },
  resendText: { fontSize: 15, fontWeight: '500' },
});

export default OtpVerificationScreen;
