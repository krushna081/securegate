import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const PrivacyScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          SecureGate collects only the information needed to manage visitors at your society gate: your name, email, phone number, flat, and visitor details.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Visitor photos are compressed before upload and are stored for operational use. Push notifications may include visitor names and flat numbers, but never photos.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You can delete your account at any time from your profile. Deleting an account anonymizes your personal information while retaining gate records required for society security.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Contact your society administrator for data requests that are not covered in the app.
        </Text>
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
  content: { padding: 24 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});

export default PrivacyScreen;
