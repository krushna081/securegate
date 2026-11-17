import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'grey' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
  accessibilityLabel,
}: CustomButtonProps) => {
  const { colors, shadows } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.white },
    secondary: { bg: colors.secondary, text: colors.white },
    outline: { bg: colors.card, text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.primary },
    grey: { bg: colors.greyTag, text: colors.greyTagText },
    danger: { bg: colors.danger, text: colors.white },
  };

  const current = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: current.bg },
        current.border ? { borderWidth: 1.5, borderColor: current.border } : null,
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        variant === 'primary' || variant === 'secondary' || variant === 'danger'
          ? shadows.small
          : null,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={current.text} size="small" />
        </View>
      ) : (
        <Text style={[styles.text, { color: current.text }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '700' },
});

export default CustomButton;
