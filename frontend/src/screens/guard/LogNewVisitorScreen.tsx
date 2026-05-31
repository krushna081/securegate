import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { visitorService } from '../../services/visitorService';
import api from '../../services/api';
import CustomButton from '../../components/CustomButton';

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

const LogNewVisitorScreen = () => {
  const { colors, shadows } = useTheme();
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState('guest');
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const navigation = useNavigation<any>();

  const handleSearch = useCallback(async (text: string) => {
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

  const handlePickPhoto = async () => {
    Alert.alert('Select Photo', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            setPhoto(result.assets[0].base64 || null);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            setPhoto(result.assets[0].base64 || null);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      Alert.alert('Error', 'Please enter visitor name');
      return;
    }
    if (!visitorPhone.trim()) {
      Alert.alert('Error', 'Please enter visitor phone number');
      return;
    }
    if (!selectedFlat) {
      Alert.alert('Error', 'Please search and select a destination flat');
      return;
    }
    setLoading(true);
    try {
      await visitorService.create({
        visitorName: visitorName.trim(),
        visitorType,
        flatId: selectedFlat._id,
        phoneNumber: visitorPhone.trim(),
        photoUrl: photo ? `data:image/jpeg;base64,${photo}` : undefined,
      });
      setVisitorName('');
      setVisitorPhone('');
      setVisitorType('guest');
      setPhoto(null);
      setSelectedFlat(null);
      setSearchQuery('');
      setSearchResults([]);
      Alert.alert('Success', 'Visitor logged successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log visitor');
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log New Visitor</Text>
          <View style={styles.gateBadge}>
            <View style={styles.gateDot} />
            <Text style={styles.gateLabel}>Main Gate</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.photoSection} onPress={handlePickPhoto}>
          {photo ? (
            <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.photoIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
              <Text style={[styles.photoTitle, { color: colors.text }]}>Tap to capture photo</Text>
              <Text style={[styles.photoSubtext, { color: colors.textMuted }]}>Camera or choose from gallery</Text>
            </View>
          )}
          {photo && (
            <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: colors.primaryLight }]} onPress={handlePickPhoto}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

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

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Enter phone number"
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

          {selectedFlat && selectedFlat.residentId && (
            <View style={[styles.residentCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}>
              <Text style={styles.residentInfoIcon}>📋</Text>
              <View style={styles.residentInfoText}>
                <Text style={[styles.residentInfoLabel, { color: colors.primaryDark }]}>
                  {selectedFlat.residentId.fullName}
                </Text>
                <Text style={[styles.residentInfoSub, { color: colors.textLight }]}>
                  Flat {selectedFlat.flatNumber}, Block {selectedFlat.blockName}
                </Text>
                {selectedFlat.residentId.phoneNumber && (
                  <Text style={[styles.residentInfoSub, { color: colors.textLight }]}>
                    📞 {selectedFlat.residentId.phoneNumber}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedFlat(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
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
            title={loading ? 'Logging Visitor...' : 'Log Visitor'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!visitorName.trim() || !visitorPhone.trim() || !selectedFlat}
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
    paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4, marginRight: 12 },
  backIcon: { fontSize: 24, color: '#FFFFFF' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  gateBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  gateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399', marginRight: 6 },
  gateLabel: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  photoSection: { alignItems: 'center', marginTop: 24, marginBottom: 8 },
  photoPreview: { width: 120, height: 120, borderRadius: 16, borderWidth: 3, borderColor: '#FFFFFF' },
  photoPlaceholder: { width: '85%', borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center' },
  photoIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cameraIcon: { fontSize: 24 },
  photoTitle: { fontSize: 15, fontWeight: '600' },
  photoSubtext: { fontSize: 13, marginTop: 4 },
  changePhotoBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  changePhotoText: { fontSize: 13, fontWeight: '600' },
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
  residentCard: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  residentInfoIcon: { fontSize: 22, marginRight: 12 },
  residentInfoText: { flex: 1 },
  residentInfoLabel: { fontSize: 15, fontWeight: '700' },
  residentInfoSub: { fontSize: 13, marginTop: 2 },
  changeResidentBtn: { fontSize: 13, fontWeight: '600' },
  noResults: { textAlign: 'center', marginTop: 12, fontSize: 14 },
  buttonContainer: { marginHorizontal: 20, marginTop: 24 },
});

export default LogNewVisitorScreen;
