import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, TouchableOpacity,
  ScrollView, SafeAreaView, Image, Modal, TextInput, Alert, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { visitorService } from '../../services/visitorService';
import { meetingService } from '../../services/meetingService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import VisitCard from '../../components/VisitCard';
import VisitorActionModal from '../../components/VisitorActionModal';
import {
  HeaderSkeleton, ProfileBannerSkeleton, StatsGridSkeleton,
  QuickLinkSkeleton, SectionHeaderSkeleton, MeetingCardSkeleton,
  VisitCardSkeleton,
} from '../../components/SkeletonLoader';
import { Visitor, Meeting } from '../../types';

const GuardDashboardScreen = () => {
  const { colors, shadows } = useTheme();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [meetingTime, setMeetingTime] = useState<Date>(new Date());
  const [meetingLocation, setMeetingLocation] = useState('');
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { user, login } = useAuth();
  const navigation = useNavigation<any>();

  const isGuard = user?.role === 'guard' || user?.role === 'admin';
  const loadStart = useRef(0);

  const fetchData = async () => {
    loadStart.current = Date.now();
    try {
      const [vData, mData, pData] = await Promise.all([
        visitorService.getAll({}),
        meetingService.getAll(),
        authService.getProfile(),
      ]);
      setVisitors(vData.visitors || []);
      setMeetings(mData.meetings || []);
      if (pData.user && JSON.stringify(pData.user) !== JSON.stringify(user)) {
        const token = await import('../../services/api').then(m => m.getToken());
        if (token) login(pData.user, token);
      }
    } catch {
      setVisitors([]);
      setMeetings([]);
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
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleVisitorPress = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedVisitor(null);
  };

  const handleEdit = () => {
    if (!selectedVisitor) return;
    setModalVisible(false);
    const visitor = selectedVisitor;
    setSelectedVisitor(null);
    navigation.navigate('EditVisitor', { visitor });
  };

  const handleDelete = async () => {
    if (!selectedVisitor) return;
    try {
      await visitorService.delete(selectedVisitor._id);
      setModalVisible(false);
      setSelectedVisitor(null);
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to remove visitor');
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    setSavingMeeting(true);
    try {
      const dateStr = meetingDate.toISOString().split('T')[0];
      const hours = meetingTime.getHours();
      const minutes = meetingTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const timeStr = `${h12}:${minutes} ${ampm}`;
      await meetingService.create({
        title: meetingTitle.trim(),
        description: meetingDesc.trim() || undefined,
        date: dateStr,
        time: timeStr,
        location: meetingLocation.trim() || undefined,
      });
      setShowMeetingForm(false);
      setMeetingTitle('');
      setMeetingDesc('');
      setMeetingDate(new Date());
      setMeetingTime(new Date());
      setMeetingLocation('');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to create meeting');
    } finally {
      setSavingMeeting(false);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setMeetingDate(selectedDate);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setMeetingTime(selectedDate);
  };

  const formatMeetingDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatMeetingTime = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pending = visitors.filter((v) => v.status === 'pending').length;
  const approved = visitors.filter((v) => v.status === 'approved').length;
  const rejected = visitors.filter((v) => v.status === 'rejected').length;
  const today = visitors.length;

  const getHourLabel = (): string => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ backgroundColor: colors.primary }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <>
            <HeaderSkeleton />
            <ProfileBannerSkeleton />
            <StatsGridSkeleton />
            <QuickLinkSkeleton />
            {isGuard && <QuickLinkSkeleton />}
            <SectionHeaderSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <SectionHeaderSkeleton />
            <VisitCardSkeleton />
            <VisitCardSkeleton />
            <VisitCardSkeleton />
          </>
        ) : (
          <>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextArea}>
              <Text style={styles.greeting}>{getHourLabel()}, {user?.fullName?.split(' ')[0] || 'User'}</Text>
              <View style={styles.gateRow}>
                <View style={styles.gateDot} />
                <Text style={styles.gateText}>Main Gate – East Wing</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {!user?.phoneNumber && (
          <TouchableOpacity
            style={[styles.profilePrompt, { backgroundColor: colors.infoLight, borderColor: colors.info }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.profilePromptIcon}>👤</Text>
            <View style={styles.profilePromptText}>
              <Text style={[styles.profilePromptTitle, { color: colors.info }]}>Complete Your Profile</Text>
              <Text style={[styles.profilePromptSub, { color: colors.textLight }]}>Add your phone number and details</Text>
            </View>
            <Text style={[styles.profilePromptArrow, { color: colors.info }]}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatsCard label="Today" value={today} icon="📊" color={colors.info} bgColor={colors.infoLight} />
            <View style={{ width: 12 }} />
            <StatsCard label="Pending" value={pending} icon="⏳" color={colors.warning} bgColor={colors.warningLight} />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.statsRow}>
            <StatsCard label="Approved" value={approved} icon="✅" color={colors.success} bgColor={colors.successLight} />
            <View style={{ width: 12 }} />
            <StatsCard label="Rejected" value={rejected} icon="❌" color={colors.danger} bgColor={colors.dangerLight} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: colors.card }, shadows.small]}
          onPress={() => navigation.navigate('UpcomingVisitors')}
        >
          <View style={[styles.quickIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.quickIcon}>📅</Text>
          </View>
          <View style={styles.quickTextWrap}>
            <Text style={[styles.quickTitle, { color: colors.text }]}>Upcoming Visitors</Text>
            <Text style={[styles.quickSub, { color: colors.textLight }]}>
              View residents' pre-approved guests
            </Text>
          </View>
          <Text style={[styles.quickArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        {isGuard && (
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.card }, shadows.small]}
            onPress={() => navigation.navigate('ResidentsList')}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: colors.infoLight }]}>
              <Text style={styles.quickIcon}>👥</Text>
            </View>
            <View style={styles.quickTextWrap}>
              <Text style={[styles.quickTitle, { color: colors.text }]}>Residents Directory</Text>
              <Text style={[styles.quickSub, { color: colors.textLight }]}>
                View all resident profiles & contacts
              </Text>
            </View>
            <Text style={[styles.quickArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Society Meetings</Text>
          {isGuard && (
            <TouchableOpacity onPress={() => setShowMeetingForm(true)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {meetings.length === 0 ? (
          <View style={styles.emptyMeetings}>
            <Text style={[styles.emptyMeetingsText, { color: colors.textLight }]}>No upcoming meetings</Text>
          </View>
        ) : (
          meetings.slice(0, 3).map((m) => (
            <View key={m._id} style={[styles.meetingCard, { backgroundColor: colors.card }, shadows.small]}>
              <View style={styles.meetingIconWrap}>
                <Text style={styles.meetingIcon}>📋</Text>
              </View>
              <View style={styles.meetingBody}>
                <Text style={[styles.meetingTitle, { color: colors.text }]}>{m.title}</Text>
                <Text style={[styles.meetingMeta, { color: colors.textLight }]}>
                  📅 {formatDate(m.date)} at {m.time}
                </Text>
                {m.location && (
                  <Text style={[styles.meetingMeta, { color: colors.textLight }]}>📍 {m.location}</Text>
                )}
                {m.description && (
                  <Text style={[styles.meetingDesc, { color: colors.textMuted }]}>{m.description}</Text>
                )}
                <Text style={[styles.meetingAuthor, { color: colors.textMuted }]}>
                  by {m.createdBy?.fullName || 'Unknown'}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Visitors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VisitorsList')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {visitors.slice(0, 5).map((visitor) => (
          <VisitCard key={visitor._id} visitor={visitor} onPress={() => handleVisitorPress(visitor)} />
        ))}

        {visitors.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No visitors yet today</Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
              Tap "+" to log a new visitor at the gate
            </Text>
          </View>
        )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <VisitorActionModal
        visible={modalVisible}
        visitor={selectedVisitor}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={handleModalClose}
        onRefresh={fetchData}
      />

      <Modal visible={showMeetingForm} transparent animationType="fade" onRequestClose={() => setShowMeetingForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Meeting</Text>
              <TouchableOpacity onPress={() => setShowMeetingForm(false)}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Title *</Text>
            <TextInput style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} value={meetingTitle} onChangeText={setMeetingTitle} placeholder="Meeting title" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 12 }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerBtnText, { color: colors.text }]}>{formatMeetingDate(meetingDate)}</Text>
              <Text style={[styles.pickerIcon, { color: colors.textMuted }]}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={meetingDate}
                mode="date"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={onDateChange}
              />
            )}

            <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 12 }]}>Time *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.pickerBtnText, { color: colors.text }]}>{formatMeetingTime(meetingTime)}</Text>
              <Text style={[styles.pickerIcon, { color: colors.textMuted }]}>🕐</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={meetingTime}
                mode="time"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={onTimeChange}
              />
            )}

            <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 12 }]}>Location</Text>
            <TextInput style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]} value={meetingLocation} onChangeText={setMeetingLocation} placeholder="e.g. Community Hall" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 12 }]}>Description</Text>
            <TextInput style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg, minHeight: 60, textAlignVertical: 'top' }]} value={meetingDesc} onChangeText={setMeetingDesc} placeholder="Optional details" placeholderTextColor={colors.textMuted} multiline />

            <TouchableOpacity
              style={[styles.modalSubmit, { backgroundColor: colors.primary, opacity: savingMeeting ? 0.6 : 1 }]}
              onPress={handleCreateMeeting}
              disabled={savingMeeting}
            >
              <Text style={styles.modalSubmitText}>{savingMeeting ? 'Creating...' : 'Create Meeting'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTextArea: { flex: 1, marginRight: 12 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  gateRow: { flexDirection: 'row', alignItems: 'center' },
  gateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399', marginRight: 8 },
  gateText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  statsGrid: { paddingHorizontal: 20, marginTop: 20 },
  statsRow: { flexDirection: 'row' },
  quickCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 16 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  quickIcon: { fontSize: 22 },
  quickTextWrap: { flex: 1 },
  quickTitle: { fontSize: 15, fontWeight: '600' },
  quickSub: { fontSize: 12, marginTop: 2 },
  quickArrow: { fontSize: 20 },
  profilePrompt: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  profilePromptIcon: { fontSize: 24, marginRight: 12 },
  profilePromptText: { flex: 1 },
  profilePromptTitle: { fontSize: 15, fontWeight: '600' },
  profilePromptSub: { fontSize: 12, marginTop: 2 },
  profilePromptArrow: { fontSize: 18, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  emptyMeetings: { marginHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  emptyMeetingsText: { fontSize: 14 },
  meetingCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 14 },
  meetingIconWrap: { marginRight: 12, marginTop: 2 },
  meetingIcon: { fontSize: 20 },
  meetingBody: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '600' },
  meetingMeta: { fontSize: 12, marginTop: 3 },
  meetingDesc: { fontSize: 13, marginTop: 4 },
  meetingAuthor: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 20, fontWeight: '600' },
  modalLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  modalSubmit: { marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  pickerBtnText: { fontSize: 14, fontWeight: '500' },
  pickerIcon: { fontSize: 16 },
});

export default GuardDashboardScreen;
