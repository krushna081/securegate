import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';
import { authService } from '../../services/authService';
import {
  ProfileHeaderSkeleton, ProfileCardSkeleton,
} from '../../components/SkeletonLoader';

const ProfileScreen = () => {
  const { colors, shadows } = useTheme();
  const { user, logout, login } = useAuth();
  const navigation = useNavigation<any>();
  const [editing, setEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(0);

  useFocusEffect(
    useCallback(() => {
      loadStart.current = Date.now();
      setLoading(true);
      const refresh = async () => {
        try {
          const { user: freshUser } = await authService.getProfile();
          if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(user)) {
            const token = await import('../../services/api').then(m => m.getToken());
            if (token) login(freshUser, token);
          }
        } catch {}
        const elapsed = Date.now() - loadStart.current;
        if (elapsed < 400) await new Promise(r => setTimeout(r, 400 - elapsed));
        setLoading(false);
      };
      refresh();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ phoneNumber: editPhone });
      Alert.alert('Success', 'Phone number updated');
      setEditing(false);
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <ProfileHeaderSkeleton />
            <ProfileCardSkeleton />
          </>
        ) : (
        <>
        <View style={styles.avatarSection}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={[styles.avatarImg, { borderColor: colors.white }, shadows.medium]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.white }, shadows.medium]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textLight }]}>{user?.email || ''}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.purpleTagBg }]}>
            <Text style={[styles.roleText, { color: colors.purpleTag }]}>{user?.role?.toUpperCase() || 'GUARD'}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, shadows.small]}>
          <ProfileRow label="Role" value={user?.role} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileRow label="Email" value={user?.email} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: colors.textLight }]}>Phone</Text>
            {editing ? (
              <View style={styles.editPhoneRow}>
                <TextInput
                  style={[styles.phoneInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity onPress={handleSavePhone} disabled={saving}>
                  <Text style={[styles.saveBtn, { color: colors.primary }]}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditing(false)}>
                  <Text style={[styles.cancelBtn, { color: colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setEditPhone(user?.phoneNumber || ''); setEditing(true); }}>
                <Text style={[styles.profileValue, { color: colors.text }]}>
                  {user?.phoneNumber || '— Add phone'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {user?.phoneNumber2 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <ProfileRow label="Phone 2" value={user.phoneNumber2} colors={colors} />
            </>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ProfileRow
            label="Society"
            value={
              typeof user?.societyId === 'object'
                ? `${(user as any).societyId?.name}`
                : (user?.societyId || 'Not assigned')
            }
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {user?.role === 'guard' || user?.role === 'admin' ? (
            <ProfileRow label="Gate" value={user?.gateNumber || 'Not assigned'} colors={colors} />
          ) : (
            <ProfileRow
              label="Flat"
              value={
                typeof user?.flatId === 'object'
                  ? `${(user as any).flatId?.flatNumber} - Block ${(user as any).flatId?.blockName}`
                  : (user?.flatId || 'Not assigned')
              }
              colors={colors}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.menuCard, { backgroundColor: colors.card }, shadows.small]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <View style={styles.menuTextWrap}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.menuSub, { color: colors.textLight }]}>
              Update photo, phone{user?.role === 'resident' ? ', flat' : user?.role === 'guard' ? ', gate' : ''}
            </Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        {user?.role === 'resident' && (
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.card }, shadows.small]}
            onPress={() => navigation.navigate('PreApproval')}
          >
            <Text style={styles.menuIcon}>📅</Text>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Pre-Approved Visitors</Text>
              <Text style={[styles.menuSub, { color: colors.textLight }]}>
                Pre-register guests for guard verification
              </Text>
            </View>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.logoutSection}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="outline"
          />
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>SecureGate v1.0.0</Text>
        </> )}
      </ScrollView>
    </View>
  );
};

const ProfileRow = ({ label, value, colors }: { label: string; value?: string; colors: any }) => (
  <View style={styles.profileRow}>
    <Text style={[styles.profileLabel, { color: colors.textLight }]}>{label}</Text>
    <Text style={[styles.profileValue, { color: colors.text }]}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  settingsIcon: { fontSize: 22 },
  scrollContent: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginTop: 24, marginBottom: 20 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 4 },
  avatarText: { fontSize: 36, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  email: { fontSize: 15, marginTop: 4 },
  roleBadge: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  card: { marginHorizontal: 20, borderRadius: 16, padding: 4 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
  },
  profileLabel: { fontSize: 14, fontWeight: '500' },
  profileValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginHorizontal: 20 },
  editPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  phoneInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, flex: 1, maxWidth: 140 },
  saveBtn: { fontSize: 14, fontWeight: '600' },
  cancelBtn: { fontSize: 14, fontWeight: '600' },
  menuCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 16,
    padding: 16, borderRadius: 16,
  },
  menuIcon: { fontSize: 28, marginRight: 14 },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuSub: { fontSize: 13, marginTop: 2 },
  menuArrow: { fontSize: 20 },
  logoutSection: { marginHorizontal: 20, marginTop: 28 },
  version: { textAlign: 'center', marginTop: 24, fontSize: 13 },
});

export default ProfileScreen;
