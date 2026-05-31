import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { visitorService } from '../../services/visitorService';
import VisitCard from '../../components/VisitCard';
import VisitorActionModal from '../../components/VisitorActionModal';
import { Visitor } from '../../types';
import { VisitCardSkeleton } from '../../components/SkeletonLoader';

const FILTERS = ['All', 'Approved', 'Pending', 'Rejected'];

const VisitorsListScreen = () => {
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const loadStart = useRef(0);

  const handleVisitorPress = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setModalVisible(true);
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
      fetchVisitors();
    } catch {
      Alert.alert('Error', 'Failed to remove visitor');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedVisitor(null);
  };

  const fetchVisitors = async () => {
    loadStart.current = Date.now();
    try {
      const params = user?.role === 'resident' ? { scope: 'society' } : {};
      const data = await visitorService.getAll(params);
      setVisitors(data.visitors || []);
    } catch {
      setVisitors([]);
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
      fetchVisitors();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors();
  };

  const filtered = activeFilter === 'All'
    ? visitors
    : visitors.filter((v) => v.status === activeFilter.toLowerCase());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Visitors History</Text>
        <Text style={styles.headerCount}>{visitors.length} total</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.small,
              activeFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: colors.textLight },
                activeFilter === filter && { color: '#FFFFFF' },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.listContent}>
          <VisitCardSkeleton />
          <VisitCardSkeleton />
          <VisitCardSkeleton />
          <VisitCardSkeleton />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <VisitCard visitor={item} onPress={() => handleVisitorPress(item)} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {activeFilter === 'All' ? '📋' : activeFilter === 'Approved' ? '✅' : activeFilter === 'Pending' ? '⏳' : '❌'}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeFilter.toLowerCase()} visitors</Text>
              <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
                {activeFilter === 'All'
                  ? 'No visitors have been logged yet.'
                  : `No visitors with "${activeFilter}" status`}
              </Text>
            </View>
          ) : null
        }
      />
      )}

      <VisitorActionModal
        visible={modalVisible}
        visitor={selectedVisitor}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={handleModalClose}
        onRefresh={fetchVisitors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerCount: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
});

export default VisitorsListScreen;
