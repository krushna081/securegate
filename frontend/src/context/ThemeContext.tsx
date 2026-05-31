import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
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
}

const lightColors: ThemeColors = {
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
  inputBg: '#F9FAFB',
};

const darkColors: ThemeColors = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#2D1B69',
  primaryGradientStart: '#6B46C1',
  primaryGradientEnd: '#8B5CF6',
  secondary: '#60A5FA',
  secondaryLight: '#1E3A5F',
  background: '#0F0F1A',
  card: '#1A1A2E',
  text: '#E5E7EB',
  textLight: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#2D2D44',
  success: '#34D399',
  successLight: '#064E3B',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  warning: '#FBBF24',
  warningLight: '#78350F',
  info: '#60A5FA',
  infoLight: '#1E3A5F',
  tabInactive: '#6B7280',
  white: '#1A1A2E',
  overlay: 'rgba(0,0,0,0.7)',
  greyTag: '#2D2D44',
  greyTagText: '#9CA3AF',
  purpleTag: '#8B5CF6',
  purpleTagBg: '#2D1B69',
  inputBg: '#25253D',
};

const shadows = {
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

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: typeof shadows;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightColors,
  shadows,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = mode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, shadows, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
