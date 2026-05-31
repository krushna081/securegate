import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SkeletonBlock = ({ width, height, borderRadius = 8, style, color }: { width?: number | string; height?: number | string; borderRadius?: number; style?: any; color?: string }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: color || '#CBD5E1', opacity }, style]}
    />
  );
};

const useSkeletonColors = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  return {
    base: isDark ? '#475569' : '#CBD5E1',
    cardBg: isDark ? '#1E293B' : '#F8FAFC',
    statsBg: isDark ? '#1E293B' : '#F1F5F9',
    bannerBg: isDark ? '#1E3A5F' : '#DBEAFE',
    border: isDark ? '#334155' : '#E2E8F0',
  };
};

export const HeaderSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.headerSection]}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <SkeletonBlock width="60%" height={22} borderRadius={6} color={c.base} />
          <SkeletonBlock width="40%" height={14} borderRadius={6} style={{ marginTop: 8 }} color={c.base} />
        </View>
        <SkeletonBlock width={44} height={44} borderRadius={22} color={c.base} />
      </View>
    </View>
  );
};

export const ProfileBannerSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.bannerSkeleton, { backgroundColor: c.bannerBg }]}>
      <SkeletonBlock width={24} height={24} borderRadius={12} color={c.base} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonBlock width="50%" height={14} borderRadius={6} color={c.base} />
        <SkeletonBlock width="35%" height={11} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
      </View>
    </View>
  );
};

export const StatsGridSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={s.statsGrid}>
      <View style={s.statsRow}>
        <StatsCardSkeleton bg={c.statsBg} color={c.base} />
        <View style={{ width: 12 }} />
        <StatsCardSkeleton bg={c.statsBg} color={c.base} />
      </View>
      <View style={{ height: 12 }} />
      <View style={s.statsRow}>
        <StatsCardSkeleton bg={c.statsBg} color={c.base} />
        <View style={{ width: 12 }} />
        <StatsCardSkeleton bg={c.statsBg} color={c.base} />
      </View>
    </View>
  );
};

const StatsCardSkeleton = ({ bg, color }: { bg: string; color: string }) => (
  <View style={[s.statsCard, { backgroundColor: bg }]}>
    <SkeletonBlock width={30} height={26} borderRadius={6} style={{ alignSelf: 'flex-end' }} color={color} />
    <SkeletonBlock width="55%" height={11} borderRadius={6} style={{ alignSelf: 'flex-start', marginTop: 'auto' }} color={color} />
  </View>
);

export const QuickLinkSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.quickLink, { backgroundColor: c.cardBg }]}>
      <SkeletonBlock width={44} height={44} borderRadius={14} color={c.base} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <SkeletonBlock width="45%" height={15} borderRadius={6} color={c.base} />
        <SkeletonBlock width="65%" height={12} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
      </View>
    </View>
  );
};

export const MeetingCardSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.meetingCard, { backgroundColor: c.cardBg }]}>
      <SkeletonBlock width={20} height={20} borderRadius={10} color={c.base} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonBlock width="55%" height={15} borderRadius={6} color={c.base} />
        <SkeletonBlock width="40%" height={12} borderRadius={6} style={{ marginTop: 6 }} color={c.base} />
        <SkeletonBlock width="60%" height={11} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
      </View>
    </View>
  );
};

export const VisitCardSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.visitCard, { backgroundColor: c.cardBg }]}>
      <SkeletonBlock width={44} height={44} borderRadius={22} color={c.base} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBlock width="40%" height={15} borderRadius={6} color={c.base} />
          <SkeletonBlock width={50} height={20} borderRadius={12} color={c.base} />
        </View>
        <SkeletonBlock width="55%" height={12} borderRadius={6} style={{ marginTop: 8 }} color={c.base} />
        <SkeletonBlock width="35%" height={11} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
      </View>
    </View>
  );
};

export const SectionHeaderSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={s.sectionHeader}>
      <SkeletonBlock width="35%" height={18} borderRadius={6} color={c.base} />
      <SkeletonBlock width={50} height={14} borderRadius={6} color={c.base} />
    </View>
  );
};

export const UpcomingCardSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.visitCard, { backgroundColor: c.cardBg }]}>
      <View style={{ width: 4, backgroundColor: c.border }} />
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SkeletonBlock width={44} height={44} borderRadius={22} color={c.base} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonBlock width="50%" height={16} borderRadius={6} color={c.base} />
            <SkeletonBlock width="35%" height={13} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
          </View>
          <SkeletonBlock width={40} height={36} borderRadius={10} color={c.base} />
        </View>
        <SkeletonBlock width="70%" height={12} borderRadius={6} style={{ marginTop: 12 }} color={c.base} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }}>
          <SkeletonBlock width={30} height={14} borderRadius={6} color={c.base} />
          <SkeletonBlock width={80} height={14} borderRadius={6} color={c.base} />
        </View>
      </View>
    </View>
  );
};

export const ProfileHeaderSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
      <SkeletonBlock width={88} height={88} borderRadius={44} color={c.base} />
      <SkeletonBlock width="40%" height={24} borderRadius={6} style={{ marginTop: 12 }} color={c.base} />
      <SkeletonBlock width="30%" height={15} borderRadius={6} style={{ marginTop: 4 }} color={c.base} />
      <SkeletonBlock width={80} height={22} borderRadius={20} style={{ marginTop: 12 }} color={c.base} />
    </View>
  );
};

export const ProfileCardSkeleton = () => {
  const c = useSkeletonColors();
  return (
    <View style={[s.profileCard, { backgroundColor: c.cardBg }]}>
      <ProfileRowSkeletonInner color={c.base} />
      <View style={[s.divider, { backgroundColor: c.border }]} />
      <ProfileRowSkeletonInner color={c.base} />
      <View style={[s.divider, { backgroundColor: c.border }]} />
      <ProfileRowSkeletonInner color={c.base} />
      <View style={[s.divider, { backgroundColor: c.border }]} />
      <ProfileRowSkeletonInner color={c.base} />
    </View>
  );
};

const ProfileRowSkeletonInner = ({ color }: { color: string }) => (
  <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
    <SkeletonBlock width="25%" height={14} borderRadius={6} color={color} />
    <SkeletonBlock width="35%" height={14} borderRadius={6} style={{ marginTop: 4 }} color={color} />
  </View>
);

const s = StyleSheet.create({
  headerSection: {
    paddingBottom: 28,
    backgroundColor: '#6B46C1',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  bannerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
  },
  statsGrid: { paddingHorizontal: 20, marginTop: 20 },
  statsRow: { flexDirection: 'row' },
  statsCard: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  meetingCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
  },
  visitCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
});

export default SkeletonBlock;
