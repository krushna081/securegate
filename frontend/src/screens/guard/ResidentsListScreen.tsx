import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/visitorService';
import ResidentProfileModal from '../../components/ResidentProfileModal';
import { User } from '../../types';

const ResidentsListScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedResident, setSelectedResident] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchResidents = async () => {
    try {
      const data = await userService.getAllUsers({ role: 'resident' });
      setResidents(data.users || []);
    } catch {
      setResidents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => { fetchResidents(); }, [])
  );

  const handleResidentPress = (resident: User) => {
    setSelectedResident(resident);
    setModalVisible(true);
  };

  const renderResident = ({ item }: { item: User }) => {
    const flatInfo = typeof item.flatId === 'object' ? item.flatId : null;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => handleResidentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.name, { color: colors.text }]}>{item.fullName}</Text>
          <Text style={[styles.detail, { color: colors.textLight }]}>
            🏠 {flatInfo ? `Flat ${flatInfo.flatNumber}, Block ${flatInfo.blockName}` : 'No flat'}
          </Text>
          {item.phoneNumber && (
            <Text style={[styles.phonePreview, { color: colors.textMuted }]}>📞 {item.phoneNumber}</Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Residents Directory</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={residents}
        keyExtractor={(item) => item._id}
        renderItem={renderResident}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResidents(); }} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No residents found</Text>
            </View>
          ) : null
        }
      />

      <ResidentProfileModal
        visible={modalVisible}
        resident={selectedResident}
        onClose={() => { setModalVisible(false); setSelectedResident(null); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  listContent: { paddingTop: 12, paddingBottom: 100, paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardLeft: { marginRight: 12, justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  detail: { fontSize: 13, marginTop: 3 },
  phonePreview: { fontSize: 12, marginTop: 3 },
  chevron: { fontSize: 24, fontWeight: '300', marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
});

export default ResidentsListScreen;