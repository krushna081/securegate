import { Platform } from 'react-native';

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  card: string;
  text: string;
  textLight: string;
  textMuted: string;
  border: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  tabInactive: string;
  white: string;
  overlay: string;
  greyTag: string;
  greyTagText: string;
  purpleTag: string;
  purpleTagBg: string;
  inputBg: string;
};

export const lightColors: ThemeColors = {
  primary: '#0B2545',
  primaryDark: '#071A33',
  primaryLight: '#DCE7F3',
  primaryGradientStart: '#0B2545',
  primaryGradientEnd: '#123A63',
  secondary: '#0E7C66',
  secondaryLight: '#D6F0E8',
  background: '#F4F7FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textLight: '#475569',
  textMuted: '#94A3B8',
  border: '#D9E2EC',
  success: '#0E7C66',
  successLight: '#D6F0E8',
  danger: '#B42318',
  dangerLight: '#FEE4E2',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  info: '#0369A1',
  infoLight: '#E0F2FE',
  tabInactive: '#64748B',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  greyTag: '#E2E8F0',
  greyTagText: '#334155',
  purpleTag: '#DBEAFE',
  purpleTagBg: '#EFF6FF',
  inputBg: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  primary: '#6FB3FF',
  primaryDark: '#4A94E6',
  primaryLight: '#12324F',
  primaryGradientStart: '#0F2A43',
  primaryGradientEnd: '#173B5F',
  secondary: '#3DD6B3',
  secondaryLight: '#123A33',
  background: '#0B1220',
  card: '#111B2D',
  text: '#E6EDF3',
  textLight: '#9FB0C3',
  textMuted: '#6B7B8C',
  border: '#223047',
  success: '#3DD6B3',
  successLight: '#123A33',
  danger: '#FF6B6B',
  dangerLight: '#3A1D22',
  warning: '#F5B942',
  warningLight: '#3A2F1A',
  info: '#60A5FA',
  infoLight: '#172554',
  tabInactive: '#6B7B8C',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
  greyTag: '#1F2937',
  greyTagText: '#CBD5E1',
  purpleTag: '#1E3A5F',
  purpleTagBg: '#0F172A',
  inputBg: '#0F172A',
};

export const colors = lightColors;

export const shadows = {
  small: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 1 },
    default: {},
  }),
  medium: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
    android: { elevation: 3 },
    default: {},
  }),
  large: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 18 },
    android: { elevation: 6 },
    default: {},
  }),
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
