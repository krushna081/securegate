import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '../constants/theme';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}

const StatsCard = ({ label, value, color, bgColor }: StatsCardProps) => (
  <View style={[styles.card, { backgroundColor: bgColor }]}>
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={[styles.label, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    ...shadows.small,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
});

export default StatsCard;
