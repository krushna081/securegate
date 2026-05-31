import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Visitor } from '../types';
import { getRelativeTime, getStatusColor } from '../utils/format';

interface VisitorCardProps {
  visitor: Visitor;
  onPress?: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const VISITOR_TYPE_ICONS: Record<string, string> = {
  guest: '👤', delivery: '📦', maid: '🧹', electrician: '⚡',
  plumber: '🔧', courier: '📬', technician: '🛠️', driver: '🚗', maintenance: '🔨',
};

const VisitorCard = ({
  visitor,
  onPress,
  showActions = false,
  onApprove,
  onReject,
}: VisitorCardProps) => {
  const { colors, shadows } = useTheme();
  const typeIcon = VISITOR_TYPE_ICONS[visitor.visitorType] || '👤';

  const handleCall = (phone: string) => {
    const url = Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`;
    Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, shadows.small]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {visitor.visitorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{visitor.visitorName}</Text>
            <Text style={styles.typeIcon}>{typeIcon}</Text>
          </View>
          <Text style={[styles.type, { color: colors.textLight }]}>{visitor.visitorType}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(visitor.status) }]}>
            {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={[styles.details, { borderTopColor: colors.border }]}>
        <Text style={[styles.detail, { color: colors.textLight }]}>
          Flat {visitor.flatId?.flatNumber} - {visitor.flatId?.blockName}
        </Text>
        {visitor.residentId && (
          <Text style={[styles.detail, { color: colors.text }]}>
            🏠 Owner: {visitor.residentId.fullName}
          </Text>
        )}
        {visitor.vehicleNumber && (
          <Text style={[styles.detail, { color: colors.textLight }]}>Vehicle: {visitor.vehicleNumber}</Text>
        )}
        {visitor.notes && (
          <Text style={[styles.detail, { color: colors.textLight }]}>Note: {visitor.notes}</Text>
        )}
        {visitor.phoneNumber && (
          <TouchableOpacity onPress={() => handleCall(visitor.phoneNumber!)}>
            <Text style={[styles.detail, { color: colors.primary }]}>📞 Visitor: {visitor.phoneNumber}</Text>
          </TouchableOpacity>
        )}
        {visitor.residentId?.phoneNumber && (
          <TouchableOpacity onPress={() => handleCall(visitor.residentId!.phoneNumber!)}>
            <Text style={[styles.detail, { color: colors.secondary }]}>🏠 Owner: {visitor.residentId.phoneNumber}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.time, { color: colors.textMuted }]}>{getRelativeTime(visitor.createdAt)}</Text>
        <Text style={[styles.guard, { color: colors.textMuted }]}>by {visitor.guardId?.fullName}</Text>
      </View>

      {showActions && visitor.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.approveBtn, { backgroundColor: colors.success }]} onPress={onApprove}>
            <Text style={styles.actionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rejectBtn, { borderColor: colors.danger }]} onPress={onReject}>
            <Text style={[styles.rejectText, { color: colors.danger }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginHorizontal: 16, marginVertical: 6 },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  nameSection: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600' },
  typeIcon: { fontSize: 14 },
  type: { fontSize: 13, textTransform: 'capitalize' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  detail: { fontSize: 14, marginBottom: 2 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1,
  },
  time: { fontSize: 12 },
  guard: { fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  approveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  rejectText: { fontWeight: '600', fontSize: 15 },
});

export default VisitorCard;
