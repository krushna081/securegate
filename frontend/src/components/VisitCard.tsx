import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Visitor } from '../types';
import { getRelativeTime } from '../utils/format';

interface VisitCardProps {
  visitor: Visitor;
  onPress?: () => void;
}

const statusConfig: Record<string, { label: string; bg: string; textColor: string }> = {
  approved: { label: 'Approved', bg: '#D1FAE5', textColor: '#059669' },
  pending: { label: 'Pending', bg: '#FEF3C7', textColor: '#D97706' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', textColor: '#DC2626' },
};

const VISITOR_TYPE_ICONS: Record<string, string> = {
  guest: '👤', delivery: '📦', maid: '🧹', electrician: '⚡',
  plumber: '🔧', courier: '📬', technician: '🛠️', driver: '🚗', maintenance: '🔨',
};

const VisitCard = ({ visitor, onPress }: VisitCardProps) => {
  const { colors, shadows } = useTheme();
  const status = statusConfig[visitor.status] || statusConfig.pending;
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
      <View style={styles.row}>
        {visitor.photoUrl ? (
          <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {visitor.visitorName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{visitor.visitorName}</Text>
            <Text style={styles.typeIcon}>{typeIcon}</Text>
          </View>
          <Text style={[styles.detail, { color: colors.textLight }]}>
            {visitor.visitorType} · Flat {visitor.flatId?.flatNumber}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{getRelativeTime(visitor.createdAt)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.textColor }]}>{status.label}</Text>
        </View>
      </View>
      {visitor.residentId && (
        <Text style={[styles.extra, { color: colors.text }]}>
          🏠 Visiting: {visitor.residentId.fullName} · Flat {visitor.flatId?.flatNumber}
        </Text>
      )}
      {visitor.vehicleNumber && (
        <Text style={[styles.extra, { color: colors.textLight }]}>🚗 {visitor.vehicleNumber}</Text>
      )}
      {visitor.notes && (
        <Text style={[styles.extra, { color: colors.textLight }]}>📝 {visitor.notes}</Text>
      )}
      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.guardName, { color: colors.textMuted }]}>
          by {visitor.guardId?.fullName || 'Guard'}
        </Text>
        <View style={styles.footerActions}>
          {visitor.guardId?.phoneNumber && (
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.successLight }]} onPress={() => handleCall(visitor.guardId!.phoneNumber!)}>
              <Text style={[styles.callText, { color: colors.success }]}>🛡️ Guard</Text>
            </TouchableOpacity>
          )}
          {visitor.residentId?.phoneNumber && (
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.secondaryLight }]} onPress={() => handleCall(visitor.residentId!.phoneNumber!)}>
              <Text style={[styles.callText, { color: colors.secondary }]}>🏠 Owner</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginHorizontal: 20, marginVertical: 5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600' },
  typeIcon: { fontSize: 14 },
  detail: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  time: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  extra: { fontSize: 13, marginTop: 6, marginLeft: 56 },
  footerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, marginLeft: 56,
  },
  guardName: { fontSize: 12 },
  footerActions: { flexDirection: 'row', gap: 6 },
  callBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  callText: { fontSize: 13, fontWeight: '600' },
});

export default VisitCard;
