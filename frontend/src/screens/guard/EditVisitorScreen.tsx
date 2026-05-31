import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { visitorService } from '../../services/visitorService';
import api from '../../services/api';
import CustomButton from '../../components/CustomButton';
import { Visitor } from '../../types';

const VISITOR_TYPES = [
  { label: 'Guest', value: 'guest', icon: '👤' },
  { label: 'Delivery', value: 'delivery', icon: '📦' },
  { label: 'Maid', value: 'maid', icon: '🧹' },
  { label: 'Electrician', value: 'electrician', icon: '⚡' },
  { label: 'Plumber', value: 'plumber', icon: '🔧' },
  { label: 'Courier', value: 'courier', icon: '📬' },
  { label: 'Technician', value: 'technician', icon: '🛠️' },
  { label: 'Driver', value: 'driver', icon: '🚗' },
  { label: 'Maintenance', value: 'maintenance', icon: '🔨' },
];

let searchTimeout: any = null;

const EditVisitorScreen = () => {
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: { visitor: Visitor } }, 'params'>>();
  const visitor = route.params?.visitor;

  const [visitorName, setVisitorName] = useState(visitor?.visitorName || '');
  const [visitorPhone, setVisitorPhone] = useState(visitor?.phoneNumber || '');
  const [visitorType, setVisitorType] = useState(visitor?.visitorType || 'guest');
  const [selectedFlat, setSelectedFlat] = useState<any>(visitor?.flatId || null);
  const [loading, setLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    visitor?.flatId ? `${visitor.flatId.flatNumber} - Block ${visitor.flatId.blockName}` : ''
  );
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/users/flats/search', { params: { q: text.trim() } });
        setSearchResults(data.flats || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      Alert.alert('Error', 'Please enter visitor name');
      return;
    }

    setLoading(true);
    try {
      await visitorService.update(visitor!._id, {
        visitorName: visitorName.trim(),
        visitorType,
        flatId: selectedFlat?._id,
        phoneNumber: visitorPhone.trim() || undefined,
      });
      Alert.alert('Success', 'Visitor details updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = VISITOR_TYPES.find((t) => t.value === visitorType);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Visitor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card }, shadows.small]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visitor Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter visitor's full name"
            placeholderTextColor={colors.textMuted}
            value={visitorName}
            onChangeText={setVisitorName}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter phone number (optional)"
            placeholderTextColor={colors.textMuted}
            value={visitorPhone}
            onChangeText={setVisitorPhone}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Visitor Type</Text>
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
            onPress={() => setShowTypePicker(!showTypePicker)}
          >
            <Text style={styles.dropdownIcon}>{selectedType?.icon}</Text>
            <Text style={[styles.dropdownText, { color: colors.text }]}>
              {selectedType?.label || 'Select type'}
            </Text>
            <Text style={styles.dropdownArrow}>{showTypePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showTypePicker && (
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.pickerList}>
                {VISITOR_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      visitorType === t.value && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => { setVisitorType(t.value); setShowTypePicker(false); }}
                  >
                    <Text style={styles.pickerIcon}>{t.icon}</Text>
                    <Text style={[styles.pickerLabel, { color: colors.text }]}>{t.label}</Text>
                    {visitorType === t.value && <Text style={[styles.pickerCheck, { color: colors.primary }]}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }, shadows.small]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Destination Resident</Text>
          <Text style={[styles.label, { color: colors.text }]}>Enter Flat Number</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="e.g. 101, 202, 305..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />

          {searching && (
            <Text style={[styles.searchingText, { color: colors.textMuted }]}>Searching...</Text>
          )}

          {searchResults.length > 0 && searchQuery.trim() !== '' && !selectedFlat && (
            <View style={[styles.searchResultsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {searchResults.map((flat: any) => (
                <TouchableOpacity
                  key={flat._id}
                  style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedFlat(flat);
                    setSearchResults([]);
                    setSearchQuery(`${flat.flatNumber} - Block ${flat.blockName}`);
                  }}
                >
                  <View style={styles.searchResultLeft}>
                    <Text style={[styles.searchResultFlat, { color: colors.primary }]}>{flat.flatNumber}</Text>
                    <Text style={[styles.searchResultBlock, { color: colors.textLight }]}>Block {flat.blockName}</Text>
                  </View>
                  <View style={styles.searchResultRight}>
                    {flat.residentId ? (
                      <>
                        <Text style={[styles.searchResultName, { color: colors.text }]}>{flat.residentId.fullName}</Text>
                        <Text style={[styles.searchResultPhone, { color: colors.textMuted }]}>{flat.residentId.phoneNumber || 'No phone'}</Text>
                      </>
                    ) : (
                      <Text style={[styles.searchResultNoOwner, { color: colors.textMuted }]}>No resident assigned</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedFlat && (
            <View style={[styles.residentCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}>
              <Text style={styles.residentInfoIcon}>📋</Text>
              <View style={styles.residentInfoText}>
                <Text style={[styles.residentInfoLabel, { color: colors.primaryDark }]}>
                  {selectedFlat.residentId?.fullName || 'No resident'}
                </Text>
                <Text style={[styles.residentInfoSub, { color: colors.textLight }]}>
                  Flat {selectedFlat.flatNumber}, Block {selectedFlat.blockName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedFlat(null); setSearchQuery(''); setSearchResults([]); }}>
                <Text style={[styles.changeResidentBtn, { color: colors.danger }]}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {searchQuery.trim() !== '' && searchResults.length === 0 && !searching && !selectedFlat && (
            <Text style={[styles.noResults, { color: colors.textMuted }]}>No flats found matching "{searchQuery}"</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title={loading ? 'Updating...' : 'Save Changes'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!visitorName.trim()}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  section: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  dropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownIcon: { fontSize: 18, marginRight: 8 },
  dropdownText: { flex: 1, fontSize: 15 },
  dropdownArrow: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  pickerContainer: { marginTop: 8, borderWidth: 1, borderRadius: 12, maxHeight: 200 },
  pickerList: { maxHeight: 200 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  pickerIcon: { fontSize: 16, marginRight: 10 },
  pickerLabel: { fontSize: 15, flex: 1 },
  pickerCheck: { fontSize: 16, fontWeight: '700' },
  searchingText: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  searchResultsContainer: { marginTop: 8, borderWidth: 1, borderRadius: 12, maxHeight: 300 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  searchResultLeft: { marginRight: 16, alignItems: 'center', minWidth: 60 },
  searchResultFlat: { fontSize: 20, fontWeight: '800' },
  searchResultBlock: { fontSize: 11, marginTop: 2 },
  searchResultRight: { flex: 1 },
  searchResultName: { fontSize: 15, fontWeight: '600' },
  searchResultPhone: { fontSize: 12, marginTop: 2 },
  searchResultNoOwner: { fontSize: 13, fontStyle: 'italic' },
  residentCard: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  residentInfoIcon: { fontSize: 22, marginRight: 12 },
  residentInfoText: { flex: 1 },
  residentInfoLabel: { fontSize: 15, fontWeight: '700' },
  residentInfoSub: { fontSize: 13, marginTop: 2 },
  changeResidentBtn: { fontSize: 13, fontWeight: '600' },
  noResults: { textAlign: 'center', marginTop: 12, fontSize: 14 },
  buttonContainer: { marginHorizontal: 20, marginTop: 24 },
});

export default EditVisitorScreen;
