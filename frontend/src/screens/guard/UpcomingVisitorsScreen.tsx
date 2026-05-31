import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { preApprovalService } from '../../services/visitorService';
import PreApprovalActionModal from '../../components/PreApprovalActionModal';
import { PreApproval } from '../../types';
import { UpcomingCardSkeleton } from '../../components/SkeletonLoader';

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  expected: { label: 'Expected', bg: '#FEF3C7', dot: '#D97706' },
  approved: { label: 'Approved', bg: '#D1FAE5', dot: '#059669' },
  arrived: { label: 'Arrived', bg: '#DBEAFE', dot: '#2563EB' },
};

const UpcomingVisitorsScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [preApprovals, setPreApprovals] = useState<PreApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPa, setSelectedPa] = useState<PreApproval | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editPeople, setEditPeople] = useState('1');
  const [editVehicleType, setEditVehicleType] = useState('none');
  const [editVehicleNumber, setEditVehicleNumber] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const isGuard = user?.role === 'guard' || user?.role === 'admin';
  const loadStart = useRef(0);

  const fetchPreApprovals = async () => {
    loadStart.current = Date.now();
    try {
      const endpoint = isGuard ? '/pre-approvals/all' : '/pre-approvals/my';
      const { data } = await api.get(endpoint);
      setPreApprovals(data.preApprovals || []);
    } catch {
      setPreApprovals([]);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPreApprovals();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPreApprovals();
  };

  const formatTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'Anytime';

  const handleCardPress = (pa: PreApproval) => {
    setSelectedPa(pa);
    setModalVisible(true);
  };

  const handleStatusToggle = async () => {
    if (!selectedPa) return;
    const next = selectedPa.status === 'expected' ? 'approved' : 'expected';
    try {
      await preApprovalService.updateStatus(selectedPa._id, next);
      setModalVisible(false);
      setSelectedPa(null);
      fetchPreApprovals();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleEdit = () => {
    if (!selectedPa) return;
    setModalVisible(false);
    startEdit(selectedPa);
  };

  const handleDelete = async () => {
    if (!selectedPa) return;
    try {
      await api.delete(`/pre-approvals/${selectedPa._id}`);
      setModalVisible(false);
      setSelectedPa(null);
      fetchPreApprovals();
    } catch {
      Alert.alert('Error', 'Failed to remove');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedPa(null);
  };

  const startEdit = (pa: PreApproval) => {
    setEditingId(pa._id);
    setEditGuestName(pa.guestName);
    setEditPeople(String(pa.numberOfPeople || 1));
    setEditVehicleType(pa.vehicleType || 'none');
    setEditVehicleNumber(pa.vehicleNumber || '');
    setEditTime(pa.expectedTime || '');
    setEditNotes(pa.notes || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editGuestName.trim()) {
      Alert.alert('Error', 'Guest name is required');
      return;
    }
    try {
      await preApprovalService.update(editingId, {
        guestName: editGuestName.trim(),
        numberOfPeople: parseInt(editPeople) || 1,
        vehicleType: editVehicleType,
        vehicleNumber: editVehicleNumber.trim() || undefined,
        expectedTime: editTime || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingId(null);
      fetchPreApprovals();
    } catch {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const renderCard = (pa: PreApproval) => {
    const isEditing = editingId === pa._id;
    const statusCfg = STATUS_CONFIG[pa.status] || STATUS_CONFIG.expected;

    return (
      <TouchableOpacity
        key={pa._id}
        activeOpacity={0.7}
        onPress={() => handleCardPress(pa)}
        style={[styles.card, { backgroundColor: colors.card }]}
      >
        <View style={[styles.cardAccent, { backgroundColor: colors.primary }]} />

        <View style={styles.cardBody}>
          {isEditing ? (
            <View>
              <Text style={[styles.editTitle, { color: colors.text }]}>Edit Visitor</Text>
              <TextInput style={[styles.editInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} value={editGuestName} onChangeText={setEditGuestName} placeholder="Guest name" placeholderTextColor={colors.textMuted} />
              <View style={styles.editPeopleRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} style={[styles.editChip, { borderColor: colors.border }, editPeople === String(n) && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setEditPeople(String(n))}>
                    <Text style={[styles.editChipText, { color: colors.text }, editPeople === String(n) && { color: colors.primary, fontWeight: '700' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.editVehicleRow}>
                {['none', '2-wheeler', '4-wheeler'].map((v) => (
                  <TouchableOpacity key={v} style={[styles.editChip, { borderColor: colors.border }, editVehicleType === v && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setEditVehicleType(v)}>
                    <Text style={[styles.editChipText, { color: colors.text }, editVehicleType === v && { color: colors.primary, fontWeight: '700' }]}>{v === 'none' ? '🚶 Walk' : v === '2-wheeler' ? '🏍️ Bike' : '🚗 Car'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editVehicleType !== 'none' && (
                <TextInput style={[styles.editInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} value={editVehicleNumber} onChangeText={setEditVehicleNumber} placeholder="Vehicle number" placeholderTextColor={colors.textMuted} />
              )}
              <TextInput style={[styles.editInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} value={editTime} onChangeText={setEditTime} placeholder="Expected time (HH:MM)" placeholderTextColor={colors.textMuted} />
              <TextInput style={[styles.editInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg, minHeight: 60, textAlignVertical: 'top' }]} value={editNotes} onChangeText={setEditNotes} placeholder="Notes" placeholderTextColor={colors.textMuted} multiline />
              <View style={styles.editActions}>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.danger }]} onPress={cancelEdit}><Text style={styles.editBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={saveEdit}><Text style={styles.editBtnText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.topRow}>
                <View style={[styles.guestAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.guestAvatarText, { color: colors.primary }]}>
                    {pa.guestName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.guestInfo}>
                  <Text style={[styles.guestName, { color: colors.text }]}>{pa.guestName}</Text>
                  <Text style={[styles.meta, { color: colors.textLight }]}>🕐 {formatTime(pa.expectedTime)}</Text>
                </View>
                <View style={[styles.peopleBadge, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.peopleCount, { color: colors.secondary }]}>{pa.numberOfPeople || 1}</Text>
                  <Text style={[styles.peopleLabel, { color: colors.secondary }]}>pax</Text>
                </View>
              </View>

              {isGuard && (
                <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>👤</Text>
                    <View>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Sent by</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{pa.residentId?.fullName || 'Unknown'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>🏠</Text>
                    <View>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Flat</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{pa.flatId?.flatNumber || '—'}</Text>
                      {pa.flatId?.blockName && (
                        <Text style={[styles.detailSub, { color: colors.textLight }]}>Block {pa.flatId.blockName}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {(pa.vehicleType || pa.vehicleNumber) && (
                <View style={[styles.extras, { borderTopColor: colors.border }]}>
                  <Text style={[styles.extraText, { color: colors.text }]}>
                    {pa.vehicleType === 'none' ? '🚶 On foot' : pa.vehicleType === '2-wheeler' ? '🏍️ Bike' : pa.vehicleType === '4-wheeler' ? '🚗 Car' : '🚶'}
                    {pa.vehicleNumber ? ` · ${pa.vehicleNumber}` : ''}
                  </Text>
                </View>
              )}

              {pa.notes && (
                <View style={[styles.notesBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>📝 {pa.notes}</Text>
                </View>
              )}

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                  <Text style={[styles.statusText, { color: statusCfg.dot }]}>{statusCfg.label}</Text>
                </View>
                <Text style={[styles.tapHint, { color: colors.textLight }]}>Tap for details ›</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Upcoming Visitors</Text>
          {!isGuard && (
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PreApproval', { openForm: true })}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerCount}>{preApprovals.length} expected</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <UpcomingCardSkeleton />
            <UpcomingCardSkeleton />
            <UpcomingCardSkeleton />
          </>
        ) : (
        <>
        {preApprovals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming visitors</Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
              {isGuard ? 'Residents haven\'t pre-approved any guests yet' : 'Pre-register your guests so the guard knows they\'re expected'}
            </Text>
          </View>
        )}

        {preApprovals.map(renderCard)}
        </> )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PreApprovalActionModal
        visible={modalVisible}
        preApproval={selectedPa}
        isGuard={isGuard}
        onStatusToggle={handleStatusToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={handleModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 30, color: '#FFFFFF', fontWeight: '700', lineHeight: 34 },
  headerCount: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  scrollContent: { paddingTop: 20, paddingBottom: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 6, paddingHorizontal: 40, textAlign: 'center' },
  card: { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  guestAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  guestAvatarText: { fontSize: 18, fontWeight: '700' },
  guestInfo: { flex: 1, marginLeft: 12 },
  guestName: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
  peopleBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  peopleCount: { fontSize: 18, fontWeight: '800' },
  peopleLabel: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  detailRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  detailIcon: { fontSize: 16, marginTop: 2 },
  detailLabel: { fontSize: 11, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  detailSub: { fontSize: 12, marginTop: 1 },
  extras: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  extraText: { fontSize: 14 },
  notesBox: { marginTop: 12, padding: 10, borderRadius: 10 },
  notesText: { fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tapHint: { fontSize: 12, fontWeight: '500' },
  editTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  editInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginBottom: 10 },
  editPeopleRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  editChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  editChipText: { fontSize: 14, fontWeight: '500' },
  editVehicleRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

export default UpcomingVisitorsScreen;
