import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#6B46C1',
  primaryDark: '#553C9A',
  primaryLight: '#E9D8FD',
  primaryGradientStart: '#6B46C1',
  primaryGradientEnd: '#805AD5',
  secondary: '#3B82F6',
  secondaryLight: '#DBEAFE',
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  tabInactive: '#9CA3AF',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
  greyTag: '#F3F4F6',
  greyTagText: '#6B7280',
  purpleTag: '#6B46C1',
  purpleTagBg: '#EDE9FE',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    ...shadows.small,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: colors.text,
  },
});

export const gradientColors = [colors.primaryGradientStart, colors.primaryGradientEnd];
