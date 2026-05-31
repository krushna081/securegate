import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Linking, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types';

interface Props {
  visible: boolean;
  resident: User | null;
  onClose: () => void;
}

const ResidentProfileModal = ({ visible, resident, onClose }: Props) => {
  const { colors } = useTheme();

  if (!resident) return null;

  const handleCall = (phone: string) => {
    const url = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {resident.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.name, { color: colors.text }]}>{resident.fullName}</Text>

            <View style={[styles.badge, { backgroundColor: colors.purpleTagBg }]}>
              <Text style={[styles.badgeText, { color: colors.purpleTag }]}>RESIDENT</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <InfoRow icon="👤" label="Name" value={resident.fullName} colors={colors} />
              <InfoRow icon="📧" label="Email" value={resident.email} colors={colors} />
              <InfoRow icon="🏠" label="Flat" value={resident.flatId && typeof resident.flatId === 'object' ? `${(resident.flatId as any).flatNumber} - Block ${(resident.flatId as any).blockName}` : '—'} colors={colors} />
              {resident.phoneNumber && (
                <InfoRow icon="📞" label="Phone 1" value={resident.phoneNumber} colors={colors} />
              )}
              {resident.phoneNumber2 && (
                <InfoRow icon="📞" label="Phone 2" value={resident.phoneNumber2} colors={colors} />
              )}
            </View>

            <View style={styles.callRow}>
              {resident.phoneNumber && (
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: colors.secondaryLight }]}
                  onPress={() => handleCall(resident.phoneNumber!)}
                >
                  <Text style={styles.callIcon}>📞</Text>
                  <Text style={[styles.callText, { color: colors.secondary }]}>Call Primary</Text>
                </TouchableOpacity>
              )}
              {resident.phoneNumber2 && (
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: colors.successLight }]}
                  onPress={() => handleCall(resident.phoneNumber2!)}
                >
                  <Text style={styles.callIcon}>📞</Text>
                  <Text style={[styles.callText, { color: colors.success }]}>Call Alternate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const InfoRow = ({ icon, label, value, colors }: any) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.icon}>{icon}</Text>
    <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[infoStyles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  icon: { fontSize: 14, width: 24 },
  label: { fontSize: 13, width: 70 },
  value: { fontSize: 13, fontWeight: '600', flex: 1 },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  scrollCenter: { flexGrow: 1, justifyContent: 'center' },
  card: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  closeBtnText: { fontSize: 18, fontWeight: '600' },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  badge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  infoBox: { width: '100%', borderRadius: 14, padding: 14, marginBottom: 12 },
  callRow: { flexDirection: 'row', gap: 10, width: '100%' },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 12 },
  callIcon: { fontSize: 14 },
  callText: { fontSize: 13, fontWeight: '600' },
});

export default ResidentProfileModal;
