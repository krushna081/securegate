import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const TermsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          SecureGate is provided for society gate management. Users are responsible for the accuracy of visitor information they enter.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Guards and admins must not share accounts or invite codes. Residents are responsible for approving visitors they expect.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The service is provided as-is. Societies should maintain their own backup and compliance processes.
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

export default TermsScreen;
