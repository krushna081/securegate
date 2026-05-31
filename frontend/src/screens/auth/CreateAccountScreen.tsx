import React, { useState } from 'react';
import {
  View, Text, TextInput, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import CustomButton from '../../components/CustomButton';

const ROLES = [
  { label: 'Resident', value: 'resident', icon: '👤' },
  { label: 'Guard', value: 'guard', icon: '🛡️' },
];

const CreateAccountScreen = () => {
  const { colors, shadows } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [blockName, setBlockName] = useState('');
  const [role, setRole] = useState('resident');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleCreate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (role === 'resident') {
      if (!flatNumber.trim()) {
        Alert.alert('Error', 'Flat number is required for residents');
        return;
      }
      if (!blockName.trim()) {
        Alert.alert('Error', 'Block name is required for residents');
        return;
      }
    }
    setLoading(true);
    try {
      await authService.createAccount(
        fullName.trim(),
        email.trim(),
        role,
        phoneNumber.trim(),
        flatNumber.trim() || undefined,
        blockName.trim() || undefined
      );

      const otpData = await authService.sendOtp(email.trim());

      navigation.replace('OtpVerification', {
        email: email.trim(),
        devOtp: otpData.devOtp,
        justCreated: true,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={[styles.title, { color: colors.primary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>Join SecureGate community</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, shadows.medium]}>
          <Text style={[styles.label, { color: colors.text }]}>I am a</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.roleChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  role === r.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setRole(r.value)}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text
                  style={[
                    styles.roleLabel,
                    { color: colors.textLight },
                    role === r.value && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20, color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter your email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          {role === 'resident' && (
            <>
              <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Flat Number *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="e.g. 101"
                placeholderTextColor={colors.textMuted}
                value={flatNumber}
                onChangeText={setFlatNumber}
              />

              <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Block Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="e.g. A"
                placeholderTextColor={colors.textMuted}
                value={blockName}
                onChangeText={setBlockName}
              />
            </>
          )}

          <CustomButton
            title={loading ? 'Creating...' : 'Create Account'}
            onPress={handleCreate}
            loading={loading}
            disabled={!fullName.trim() || !email.trim() || !phoneNumber.trim() || (role === 'resident' && (!flatNumber.trim() || !blockName.trim()))}
            variant="primary"
            style={{ marginTop: 24 }}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={[styles.loginLinkText, { color: colors.textLight }]}>
              Already have an account?{' '}
              <Text style={[styles.loginHighlight, { color: colors.primary }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backRow: { marginBottom: 8, marginTop: 8 },
  backBtn: { fontSize: 16, fontWeight: '600' },
  headerSection: { alignItems: 'center', marginBottom: 24 },
  shieldIcon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 4 },
  card: { borderRadius: 20, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  roleIcon: { fontSize: 20 },
  roleLabel: { fontSize: 15, fontWeight: '500' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 14 },
  loginHighlight: { fontWeight: '600' },
});

export default CreateAccountScreen;
