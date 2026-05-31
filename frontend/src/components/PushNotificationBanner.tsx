import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface BannerData {
  title: string;
  body: string;
  data?: any;
}

interface Props {
  banner: BannerData | null;
  onDismiss: () => void;
  onPress?: (data: any) => void;
}

const PushNotificationBanner = ({ banner, onDismiss, onPress }: Props) => {
  const { colors, shadows: themeShadows } = useTheme();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (banner) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
    }
  }, [banner]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!banner) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: colors.text,
          transform: [{ translateY }],
        },
        themeShadows.medium,
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => {
          onPress?.(banner.data);
          handleDismiss();
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={[styles.body, { color: colors.textLight }]} numberOfLines={2}>
            {banner.body}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  indicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PushNotificationBanner;
