import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image,
  TextInput, Alert, Linking, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { visitorService } from '../services/visitorService';
import ResidentProfileModal from './ResidentProfileModal';
import { Visitor, VisitorStatus } from '../types';

interface Props {
  visible: boolean;
  visitor: Visitor | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onRefresh?: () => void;
}

const VisitorActionModal = ({ visible, visitor, onEdit, onDelete, onClose, onRefresh }: Props) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showPhoto, setShowPhoto] = useState(false);
  const [visualNotes, setVisualNotes] = useState(visitor?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [residentModalVisible, setResidentModalVisible] = useState(false);

  useEffect(() => {
    setVisualNotes(visitor?.notes || '');
  }, [visitor?._id]);

  const isGuard = user?.role === 'guard' || user?.role === 'admin';
  const isResidentForVisitor = user?.role === 'resident' && visitor?.residentId?._id === user?._id;

  if (!visitor) return null;

  const time = new Date(visitor.createdAt).toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
  });

  const handleCall = (phone: string) => {
    const url = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
  };

  const handleSaveNotes = async () => {
    if (!visitor) return;
    setSavingNotes(true);
    try {
      await visitorService.update(visitor._id, { notes: visualNotes });
      onRefresh?.();
    } catch {
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusUpdate = async (status: VisitorStatus) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)}?`,
      `Set "${visitor.visitorName}" as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await visitorService.updateStatus(visitor._id, status);
              onRefresh?.();
              onClose();
            } catch {
              Alert.alert('Error', `Failed to ${action} visitor`);
            }
          },
        },
      ],
    );
  };

  const handleDeleteConfirm = () => {
    Alert.alert('Remove Visitor', `Remove "${visitor.visitorName}" from records?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => visitor.photoUrl && setShowPhoto(true)} activeOpacity={visitor.photoUrl ? 0.7 : 1}>
                {visitor.photoUrl ? (
                  <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {visitor.visitorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.name, { color: colors.text }]}>{visitor.visitorName}</Text>

              <View style={[styles.badge, { backgroundColor: colors.purpleTagBg }]}>
                <Text style={[styles.badgeText, { color: colors.purpleTag }]}>
                  {visitor.visitorType.toUpperCase()}
                </Text>
              </View>

              {visitor.status && (
                <View style={[styles.statusBadge, {
                  backgroundColor: visitor.status === 'approved' ? '#D1FAE5' : visitor.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                }]}>
                  <Text style={[styles.statusText, {
                    color: visitor.status === 'approved' ? '#059669' : visitor.status === 'rejected' ? '#DC2626' : '#D97706',
                  }]}>
                    {visitor.status === 'approved' ? '✅ Approved' : visitor.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                  </Text>
                </View>
              )}

              <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                <InfoRow icon="🏠" label="Flat" value={`${visitor.flatId?.flatNumber || '—'}`} colors={colors} />
                {isGuard ? (
                  <TouchableOpacity style={styles.residentRow} onPress={() => setResidentModalVisible(true)}>
                    <InfoRow icon="👤" label="Resident" value={visitor.residentId?.fullName || '—'} colors={colors} />
                    <Text style={[styles.viewProfileLink, { color: colors.primary }]}>View ›</Text>
                  </TouchableOpacity>
                ) : (
                  <InfoRow icon="👤" label="Resident" value={visitor.residentId?.fullName || '—'} colors={colors} />
                )}
                <InfoRow icon="🛡️" label="Guard" value={visitor.guardId?.fullName || '—'} colors={colors} />
                <InfoRow icon="🕐" label="Logged at" value={time} colors={colors} />
                {visitor.phoneNumber && (
                  <InfoRow icon="📞" label="Phone" value={visitor.phoneNumber} colors={colors} />
                )}
                {visitor.vehicleNumber && (
                  <InfoRow icon="🚗" label="Vehicle" value={visitor.vehicleNumber} colors={colors} />
                )}
              </View>

              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.textMuted }]}>👁️ Visual Description</Text>
                <TextInput
                  style={[styles.notesInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder="Describe visitor appearance, clothing, height, etc..."
                  placeholderTextColor={colors.textMuted}
                  value={visualNotes}
                  onChangeText={setVisualNotes}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.saveNotesBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveNotes}
                  disabled={savingNotes}
                >
                  <Text style={styles.saveNotesText}>{savingNotes ? 'Saving...' : 'Save Notes'}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.callRow, { borderTopColor: colors.border }]}>
                {visitor.guardId?.phoneNumber && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.successLight }]}
                    onPress={() => handleCall(visitor.guardId!.phoneNumber!)}
                  >
                    <Text style={styles.callIcon}>🛡️</Text>
                    <Text style={[styles.callText, { color: colors.success }]}>Call Guard</Text>
                  </TouchableOpacity>
                )}
                {isGuard && visitor.residentId?.phoneNumber && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: colors.secondaryLight }]}
                    onPress={() => handleCall(visitor.residentId!.phoneNumber!)}
                  >
                    <Text style={styles.callIcon}>🏠</Text>
                    <Text style={[styles.callText, { color: colors.secondary }]}>Call Owner</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isResidentForVisitor && visitor.status === 'pending' && (
                <View style={styles.statusActions}>
                  <TouchableOpacity style={[styles.statusActionBtn, styles.approveAction]} onPress={() => handleStatusUpdate('approved')}>
                    <Text style={styles.actionIcon}>✅</Text>
                    <Text style={styles.actionLabel}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.statusActionBtn, styles.rejectAction]} onPress={() => handleStatusUpdate('rejected')}>
                    <Text style={styles.actionIcon}>❌</Text>
                    <Text style={styles.actionLabel}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isGuard && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={[styles.actionBtn, styles.editAction]} onPress={onEdit}>
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionLabel}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteAction]} onPress={handleDeleteConfirm}>
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={styles.actionLabel}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ResidentProfileModal
        visible={residentModalVisible}
        resident={visitor.residentId ? {
          _id: visitor.residentId._id,
          fullName: visitor.residentId.fullName,
          email: visitor.residentId.email,
          phoneNumber: visitor.residentId.phoneNumber,
          phoneNumber2: (visitor.residentId as any).phoneNumber2,
          flatId: visitor.flatId,
          role: 'resident' as const,
        } : null}
        onClose={() => setResidentModalVisible(false)}
      />

      <Modal visible={showPhoto} transparent animationType="fade" onRequestClose={() => setShowPhoto(false)}>
        <TouchableOpacity style={styles.photoOverlay} activeOpacity={1} onPress={() => setShowPhoto(false)}>
          {visitor?.photoUrl && (
            <Image source={{ uri: visitor.photoUrl }} style={styles.photoFull} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </>
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
  label: { fontSize: 13, width: 55 },
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
  photo: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  badge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  infoBox: { width: '100%', borderRadius: 14, padding: 14, marginBottom: 12 },
  notesSection: { width: '100%', borderTopWidth: 1, paddingTop: 14, marginBottom: 12 },
  notesLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  notesInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 72, textAlignVertical: 'top' },
  saveNotesBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-end' },
  saveNotesText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  residentRow: { flexDirection: 'row', alignItems: 'center' },
  viewProfileLink: { fontSize: 12, fontWeight: '600', marginLeft: 'auto' },
  callRow: {
    flexDirection: 'row', gap: 10, width: '100%',
    borderTopWidth: 1, paddingTop: 14, marginBottom: 16,
  },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12 },
  callIcon: { fontSize: 14 },
  callText: { fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusActions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  statusActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  approveAction: { backgroundColor: '#059669' },
  rejectAction: { backgroundColor: '#DC2626' },
  actionButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  editAction: { backgroundColor: '#3B82F6' },
  deleteAction: { backgroundColor: '#EF4444' },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  photoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  photoFull: { width: '100%', height: '70%' },
});

export default VisitorActionModal;
