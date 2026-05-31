import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import CustomButton from '../components/CustomButton';
import { PreApproval } from '../types';
import { preApprovalService } from '../services/visitorService';

const VEHICLE_TYPES = [
  { label: 'None / Walking', value: 'none' },
  { label: '2-Wheeler (Bike/Scooter)', value: '2-wheeler' },
  { label: '4-Wheeler (Car/SUV)', value: '4-wheeler' },
];

const PreApprovalScreen = () => {
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: { openForm?: boolean } }, 'params'>>();

  const [preApprovals, setPreApprovals] = useState<PreApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (route.params?.openForm) {
      setShowForm(true);
    }
  }, [route.params?.openForm]);

  const [guestName, setGuestName] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [vehicleType, setVehicleType] = useState('none');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPreApprovals();
    }, [])
  );

  const fetchPreApprovals = async () => {
    try {
      const { data } = await api.get('/pre-approvals/my');
      setPreApprovals(data.preApprovals || []);
    } catch {
      setPreApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGuestName('');
    setNumberOfPeople('1');
    setVehicleType('none');
    setVehicleNumber('');
    setExpectedTime('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      Alert.alert('Error', 'Please enter the guest name');
      return;
    }

    let parsedTime: string | undefined;
    if (expectedTime.trim()) {
      const [hours, minutes] = expectedTime.trim().split(':');
      if (!hours || !minutes || isNaN(Number(hours)) || isNaN(Number(minutes))) {
        Alert.alert('Error', 'Enter valid time in HH:MM format (e.g. 14:30)');
        return;
      }
      const d = new Date();
      d.setHours(Number(hours), Number(minutes), 0, 0);
      parsedTime = d.toISOString();
    }

    setSubmitting(true);
    try {
      await api.post('/pre-approvals', {
        guestName: guestName.trim(),
        numberOfPeople: parseInt(numberOfPeople) || 1,
        vehicleType,
        vehicleNumber: vehicleNumber.trim() || undefined,
        expectedTime: parsedTime,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Upcoming visitor added');
      resetForm();
      setShowForm(false);
      fetchPreApprovals();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this pre-approved visitor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/pre-approvals/${id}`);
            fetchPreApprovals();
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
    expected: { label: 'Expected', bg: '#FEF3C7', dot: '#D97706' },
    approved: { label: 'Approved', bg: '#D1FAE5', dot: '#059669' },
    arrived: { label: 'Arrived', bg: '#DBEAFE', dot: '#2563EB' },
  };

  const handleApprove = async (pa: PreApproval) => {
    const next = pa.status === 'expected' ? 'approved' : 'expected';
    const action = next === 'approved' ? 'approve' : 'mark as expected';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)}?`,
      `Set "${pa.guestName}" as ${next}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await preApprovalService.updateStatus(pa._id, next);
              fetchPreApprovals();
            } catch {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ],
    );
  };

  const vehicleIcons: Record<string, string> = { none: '🚶', '2-wheeler': '🏍️', '4-wheeler': '🚗' };

  const expected = preApprovals.filter(pa => pa.status === 'expected');
  const approvedArrived = preApprovals.filter(pa => pa.status === 'approved' || pa.status === 'arrived');

  const renderCard = (pa: PreApproval) => {
    const statusCfg = STATUS_CONFIG[pa.status] || STATUS_CONFIG.expected;
    const timeStr = pa.expectedTime
      ? new Date(pa.expectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'Anytime';
    return (
      <View key={pa._id} style={[styles.card, { backgroundColor: colors.card }, shadows.small]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardAvatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.cardAvatarText, { color: colors.primary }]}>
              {pa.guestName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>{pa.guestName}</Text>
            <Text style={[styles.cardTime, { color: colors.textLight }]}>🕐 {timeStr}</Text>
          </View>
          <View style={[styles.cardPeople, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.cardPeopleText, { color: colors.secondary }]}>{pa.numberOfPeople || 1}</Text>
            <Text style={[styles.cardPeopleLabel, { color: colors.secondary }]}>pax</Text>
          </View>
        </View>

        <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
          <Text style={[styles.cardDetail, { color: colors.textLight }]}>
            {vehicleIcons[pa.vehicleType || 'none'] || '🚶'} {pa.vehicleType === 'none' ? 'On foot' : pa.vehicleType}
            {pa.vehicleNumber ? ` · ${pa.vehicleNumber}` : ''}
          </Text>
          {pa.notes && (
            <Text style={[styles.cardNote, { color: colors.textMuted }]}>📝 {pa.notes}</Text>
          )}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.dot }]}>{statusCfg.label}</Text>
          </View>
          <View style={styles.cardActions}>
            {pa.status !== 'arrived' && (
              <TouchableOpacity
                style={[styles.approveBtn, { backgroundColor: pa.status === 'expected' ? colors.success : colors.warning }]}
                onPress={() => handleApprove(pa)}
              >
                <Text style={styles.approveBtnText}>
                  {pa.status === 'expected' ? '✅ Approve' : '⏳ Revert'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.deleteSmallBtn, { backgroundColor: colors.danger }]}
              onPress={() => handleDelete(pa._id)}
            >
              <Text style={styles.deleteSmallBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcoming Visitors</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addIcon}>{showForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.card }, shadows.medium]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Add Upcoming Visitor</Text>

            <Text style={[styles.label, { color: colors.text }]}>Guest Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              placeholder="Enter guest name"
              placeholderTextColor={colors.textMuted}
              value={guestName}
              onChangeText={setGuestName}
            />

            <Text style={[styles.label, { marginTop: 14, color: colors.text }]}>Number of People</Text>
            <View style={styles.peopleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.peopleChip,
                    { borderColor: colors.border, backgroundColor: colors.inputBg },
                    numberOfPeople === String(n) && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setNumberOfPeople(String(n))}
                >
                  <Text style={[styles.peopleText, { color: colors.text }, numberOfPeople === String(n) && { color: colors.primary, fontWeight: '700' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 14, color: colors.text }]}>Vehicle</Text>
            <View style={styles.vehicleRow}>
              {VEHICLE_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt.value}
                  style={[
                    styles.vehicleChip,
                    { borderColor: colors.border, backgroundColor: colors.inputBg },
                    vehicleType === vt.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setVehicleType(vt.value)}
                >
                  <Text style={[styles.vehicleText, { color: colors.text }, vehicleType === vt.value && { color: colors.primary, fontWeight: '700' }]}>
                    {vt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {vehicleType !== 'none' && (
              <>
                <Text style={[styles.label, { marginTop: 14, color: colors.text }]}>Vehicle Number</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
                  placeholder="e.g. MH01AB1234"
                  placeholderTextColor={colors.textMuted}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />
              </>
            )}

            <Text style={[styles.label, { marginTop: 14, color: colors.text }]}>Expected Time (HH:MM)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              placeholder="e.g. 14:30"
              placeholderTextColor={colors.textMuted}
              value={expectedTime}
              onChangeText={setExpectedTime}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={[styles.label, { marginTop: 14, color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
              placeholder="Any special instructions..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title={submitting ? 'Adding...' : 'Add Visitor'}
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
          {preApprovals.length} upcoming visitor{preApprovals.length !== 1 ? 's' : ''}
        </Text>

        {preApprovals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming visitors</Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
              Pre-register guests so the guard knows they're expected
            </Text>
          </View>
        )}

        {expected.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textLight, marginTop: 16 }]}>
              ⏳ Expected ({expected.length})
            </Text>
            {expected.map((pa) => renderCard(pa))}
          </>
        )}

        {approvedArrived.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textLight, marginTop: 16 }]}>
              ✅ Approved / Arrived ({approvedArrived.length})
            </Text>
            {approvedArrived.map((pa) => renderCard(pa))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  addIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: '600', paddingHorizontal: 4 },
  scrollContent: { paddingBottom: 20 },
  formCard: { margin: 20, borderRadius: 16, padding: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  peopleRow: { flexDirection: 'row', gap: 10 },
  peopleChip: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  peopleText: { fontSize: 18, fontWeight: '600' },
  vehicleRow: { gap: 8 },
  vehicleChip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 6 },
  vehicleText: { fontSize: 14, fontWeight: '500' },
  sectionLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 20, marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 6, paddingHorizontal: 40, textAlign: 'center' },
  card: { marginHorizontal: 20, marginVertical: 6, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardAvatarText: { fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardTime: { fontSize: 13, marginTop: 2 },
  cardPeople: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginLeft: 8 },
  cardPeopleText: { fontSize: 18, fontWeight: '800' },
  cardPeopleLabel: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  cardDetails: { marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  cardDetail: { fontSize: 14 },
  cardNote: { fontSize: 13, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  approveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  deleteSmallBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  deleteSmallBtnText: { fontSize: 16 },
});

export default PreApprovalScreen;
