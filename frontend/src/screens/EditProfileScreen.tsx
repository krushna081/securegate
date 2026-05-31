import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import CustomButton from '../components/CustomButton';

const EditProfileScreen = () => {
  const { colors, shadows } = useTheme();
  const { user, login } = useAuth();
  const navigation = useNavigation<any>();

  const isGuard = user?.role === 'guard' || user?.role === 'admin';
  const flatInfo = typeof user?.flatId === 'object' ? user.flatId : null;

  const [photo, setPhoto] = useState<string | null>(user?.photoUrl || null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneNumber2, setPhoneNumber2] = useState(user?.phoneNumber2 || '');
  const [flatNumber, setFlatNumber] = useState(flatInfo?.flatNumber || '');
  const [blockName, setBlockName] = useState(flatInfo?.blockName || '');
  const [gateNumber, setGateNumber] = useState(user?.gateNumber || '');
  const [saving, setSaving] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const phoneChanged = phoneNumber !== user?.phoneNumber;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Enter a phone number first');
      return;
    }
    setOtpSending(true);
    try {
      const res = await authService.sendProfileOtp();
      setOtpSent(true);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        Alert.alert('Dev Mode', `OTP: ${res.devOtp}`);
      } else {
        Alert.alert('OTP Sent', `OTP sent to ${user?.email}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Enter the OTP');
      return;
    }
    try {
      const res = await authService.verifyProfileOtp(otp.trim());
      setPhoneVerifiedToken(res.phoneVerifiedToken);
      Alert.alert('Verified', 'Phone number verified successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid OTP');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {};

      if (photo !== user?.photoUrl) {
        updates.photoUrl = photo;
      }

      if (phoneNumber !== user?.phoneNumber) {
        if (!phoneVerifiedToken) {
          Alert.alert('Error', 'Please verify your phone number with OTP first');
          setSaving(false);
          return;
        }
        updates.phoneNumber = phoneNumber;
        updates.phoneVerifiedToken = phoneVerifiedToken;
      }

      if (phoneNumber2 !== user?.phoneNumber2) {
        updates.phoneNumber2 = phoneNumber2;
      }

      if (!isGuard) {
        if (flatNumber !== flatInfo?.flatNumber || blockName !== flatInfo?.blockName) {
          updates.flatNumber = flatNumber;
          updates.blockName = blockName || 'A';
        }
      } else {
        if (gateNumber !== user?.gateNumber) {
          updates.gateNumber = gateNumber;
        }
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('No changes', 'Nothing to update');
        setSaving(false);
        return;
      }

      const { user: updatedUser } = await authService.updateProfile(updates);

      const { getToken } = await import('../services/api');
      const token = await getToken();
      if (token) {
        login(updatedUser, token);
      }

      Alert.alert('Success', 'Profile updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickPhoto}>
            {photo ? (
              <Image source={{ uri: photo }} style={[styles.avatar, { borderColor: colors.white }, shadows.medium]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight, borderColor: colors.white }, shadows.medium]}>
                <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: colors.textMuted }]}>Tap to change photo</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, shadows.small]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Contact</Text>

          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Email (cannot change)</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.email}</Text>

          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 16 }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
          {phoneChanged && !phoneVerifiedToken && (
            <View style={styles.otpRow}>
              <TouchableOpacity
                style={[styles.otpBtn, { backgroundColor: colors.primary }]}
                onPress={handleSendOtp}
                disabled={otpSending}
              >
                <Text style={styles.otpBtnText}>{otpSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {otpSent && !phoneVerifiedToken && (
            <View style={styles.verifyRow}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg, flex: 1 }]}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.verifyBtn, { backgroundColor: colors.success }]}
                onPress={handleVerifyOtp}
              >
                <Text style={styles.verifyBtnText}>✓</Text>
              </TouchableOpacity>
            </View>
          )}
          {phoneVerifiedToken && (
            <Text style={[styles.verifiedBadge, { color: colors.success }]}>✅ Phone verified</Text>
          )}

          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 16 }]}>Alternate Phone (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            value={phoneNumber2}
            onChangeText={setPhoneNumber2}
            placeholder="Enter alternate number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {!isGuard ? (
          <View style={[styles.card, { backgroundColor: colors.card }, shadows.small]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Residence</Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Flat Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              value={flatNumber}
              onChangeText={setFlatNumber}
              placeholder="e.g. 101"
              placeholderTextColor={colors.textMuted}
              keyboardType="default"
            />

            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 16 }]}>Block Name</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              value={blockName}
              onChangeText={setBlockName}
              placeholder="e.g. A"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }, shadows.small]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Post</Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Gate Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              value={gateNumber}
              onChangeText={setGateNumber}
              placeholder="e.g. Gate 1, Main Gate"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <CustomButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} loading={saving} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 40 },
  photoSection: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 40, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: -4,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  cameraIcon: { fontSize: 14 },
  photoHint: { fontSize: 12, marginTop: 8 },
  card: { marginHorizontal: 20, borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  fieldValue: { fontSize: 15, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  otpRow: { marginTop: 10 },
  otpBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  otpBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  verifyRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  verifyBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifyBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  verifiedBadge: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  buttonContainer: { marginHorizontal: 20, marginTop: 8 },
});

export default EditProfileScreen;
