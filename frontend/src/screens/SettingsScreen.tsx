import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const SettingsScreen = () => {
  const { mode, resolvedMode, colors, setMode } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const selected = mode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    { borderColor: colors.border, backgroundColor: colors.inputBg },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setMode(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option.label} theme`}
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selected ? colors.primary : colors.textLight}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            Active theme: {resolvedMode === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Legal</Text>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Privacy')}
            accessibilityRole="button"
            accessibilityLabel="Privacy policy"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Terms')}
            accessibilityRole="button"
            accessibilityLabel="Terms of service"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>Terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>About</Text>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>
              {Constants.expoConfig?.version || '2.0.0'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  scrollContent: { paddingBottom: 40, paddingTop: 20 },
  card: { marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', gap: 6,
  },
  themeLabel: { fontSize: 13, fontWeight: '600' },
  helper: { fontSize: 12, marginTop: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },
});

export default SettingsScreen;
