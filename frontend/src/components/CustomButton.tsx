import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { colors, shadows } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'grey';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
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
}: CustomButtonProps) => {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[variant],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const labelStyle = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' || variant === 'grey' ? colors.primary : colors.white}
            size="small"
            style={{ marginRight: 8 }}
          />
          <Text style={labelStyle}>{title}</Text>
        </View>
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  secondary: {
    backgroundColor: colors.secondary,
    ...shadows.small,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  grey: {
    backgroundColor: colors.greyTag,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: { color: colors.white },
  secondaryText: { color: colors.white },
  outlineText: { color: colors.primary },
  ghostText: { color: colors.primary },
  greyText: { color: colors.textLight },
  disabledText: { opacity: 0.7 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomButton;
