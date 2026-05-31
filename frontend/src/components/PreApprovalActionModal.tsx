import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert,
  Linking, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PreApproval } from '../types';

const VEHICLE_ICONS: Record<string, string> = {
  none: '🚶', '2-wheeler': '🏍️', '4-wheeler': '🚗',
};

interface Props {
  visible: boolean;
  preApproval: PreApproval | null;
  isGuard: boolean;
  onStatusToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const PreApprovalActionModal = ({ visible, preApproval, isGuard, onStatusToggle, onEdit, onDelete, onClose }: Props) => {
  const { colors } = useTheme();

  if (!preApproval) return null;

  const statusCfg: Record<string, { label: string; bg: string; dot: string; icon: string }> = {
    expected: { label: 'Expected', bg: '#FEF3C7', dot: '#D97706', icon: '⏳' },
    approved: { label: 'Approved', bg: '#D1FAE5', dot: '#059669', icon: '✅' },
    arrived: { label: 'Arrived', bg: '#DBEAFE', dot: '#2563EB', icon: '📍' },
  };

  const cfg = statusCfg[preApproval.status] || statusCfg.expected;
  const nextStatus = preApproval.status === 'expected' ? 'approved' : 'expected';

  const handleCall = (phone: string) => {
    const url = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
  };

  const handleToggle = () => {
    const action = nextStatus === 'approved' ? 'approve' : 'mark as expected';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)}?`,
      `Set "${preApproval.guestName}" as ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: onStatusToggle },
      ],
    );
  };

  const handleDeleteConfirm = () => {
    Alert.alert('Remove', `Remove "${preApproval.guestName}" from upcoming visitors?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onDelete },
    ]);
  };

  const formatTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'Anytime';

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
                {preApproval.guestName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.name, { color: colors.text }]}>{preApproval.guestName}</Text>

            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.dot }]}>
                {cfg.icon} {cfg.label}
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <InfoRow icon="👤" label="Guest" value={preApproval.guestName} colors={colors} />
              <InfoRow icon="👥" label="People" value={`${preApproval.numberOfPeople || 1} pax`} colors={colors} />
              <InfoRow icon="🕐" label="Time" value={formatTime(preApproval.expectedTime)} colors={colors} />
              <InfoRow icon="🏠" label="Flat" value={`${preApproval.flatId?.flatNumber || '—'}${preApproval.flatId?.blockName ? `, Block ${preApproval.flatId.blockName}` : ''}`} colors={colors} />
              {isGuard && (
                <InfoRow icon="👤" label="Sent by" value={preApproval.residentId?.fullName || 'Unknown'} colors={colors} />
              )}
              {preApproval.vehicleType && preApproval.vehicleType !== 'none' && (
                <InfoRow icon={VEHICLE_ICONS[preApproval.vehicleType] || '🚗'} label="Vehicle" value={`${preApproval.vehicleType}${preApproval.vehicleNumber ? ` · ${preApproval.vehicleNumber}` : ''}`} colors={colors} />
              )}
            </View>

            {preApproval.notes && (
              <View style={[styles.notesBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.notesLabel, { color: colors.textMuted }]}>📝 Notes</Text>
                <Text style={[styles.notesText, { color: colors.text }]}>{preApproval.notes}</Text>
              </View>
            )}

            {isGuard ? (
              <>
                <View style={[styles.callRow, { borderTopColor: colors.border }]}>
                  {preApproval.residentId?.phoneNumber && (
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.secondaryLight }]}
                      onPress={() => handleCall(preApproval.residentId!.phoneNumber!)}
                    >
                      <Text style={styles.callIcon}>🏠</Text>
                      <Text style={[styles.callText, { color: colors.secondary }]}>Call Owner</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: nextStatus === 'approved' ? colors.success : colors.warning }]}
                  onPress={handleToggle}
                >
                  <Text style={styles.toggleIcon}>{nextStatus === 'approved' ? '✅' : '⏳'}</Text>
                  <Text style={styles.toggleText}>
                    {nextStatus === 'approved' ? 'Approve' : 'Mark as Expected'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: nextStatus === 'approved' ? colors.success : colors.warning, marginBottom: 12 }]}
                  onPress={handleToggle}
                >
                  <Text style={styles.toggleIcon}>{nextStatus === 'approved' ? '✅' : '⏳'}</Text>
                  <Text style={styles.toggleText}>
                    {nextStatus === 'approved' ? 'Approve' : 'Mark as Expected'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.residentActions}>
                  <TouchableOpacity
                    style={[styles.residentActionBtn, styles.editActionBtn]}
                    onPress={onEdit}
                  >
                    <Text style={styles.actionBtnIcon}>✏️</Text>
                    <Text style={styles.actionBtnLabel}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.residentActionBtn, styles.deleteActionBtn]}
                    onPress={handleDeleteConfirm}
                  >
                    <Text style={styles.actionBtnIcon}>🗑️</Text>
                    <Text style={styles.actionBtnLabel}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  label: { fontSize: 13, width: 60 },
  value: { fontSize: 13, fontWeight: '600', flex: 1 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 24,
  },
  scrollCenter: { flexGrow: 1, justifyContent: 'center' },
  card: {
    width: '100%', borderRadius: 24, padding: 24,
    alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  closeBtnText: { fontSize: 18, fontWeight: '600' },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: '700' },
  infoBox: { width: '100%', borderRadius: 14, padding: 14, marginBottom: 12 },
  notesBox: { width: '100%', borderRadius: 14, padding: 14, marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  notesText: { fontSize: 14, lineHeight: 20 },
  callRow: {
    flexDirection: 'row', gap: 10, width: '100%',
    borderTopWidth: 1, paddingTop: 14, marginBottom: 16,
  },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12 },
  callIcon: { fontSize: 14 },
  callText: { fontSize: 13, fontWeight: '600' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, width: '100%',
  },
  toggleIcon: { fontSize: 16 },
  toggleText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  residentActions: { flexDirection: 'row', gap: 12, width: '100%' },
  residentActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18, borderRadius: 14,
  },
  editActionBtn: { backgroundColor: '#3B82F6' },
  deleteActionBtn: { backgroundColor: '#EF4444' },
  actionBtnIcon: { fontSize: 20 },
  actionBtnLabel: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});

export default PreApprovalActionModal;
