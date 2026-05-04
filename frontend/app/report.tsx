import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar
} from 'react-native';
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import * as Location from 'expo-location';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, parseResponseJson } from "../lib/api";

type MapVet = {
  id: number;
  display_name: string;
  latitude: number;
  longitude: number;
  address_line?: string | null;
  city?: string | null;
  verified: boolean;
};

type VetWithKm = MapVet & { km?: number };

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseLatLng(text: string): { latitude?: number; longitude?: number; address_text?: string } {
  const loc = text.trim();
  const parts = loc.split(/[,\s]+/).map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
  if (parts.length >= 2) {
    return { latitude: parts[0], longitude: parts[1], address_text: loc };
  }
  return { address_text: loc || undefined };
}

export default function ReportScreen() {
  const { t } = useLanguage();
  const [location, setLocation] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vetList, setVetList] = useState<MapVet[]>([]);
  const [vetLoadErr, setVetLoadErr] = useState('');
  const [selectedVetId, setSelectedVetId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [animalType, setAnimalType] = React.useState('');
  const [injury, setInjury] = React.useState('');
  const [condition, setCondition] = React.useState('');
  const [urgency, setUrgency] = React.useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/organizations/map`);
        const parsed = await parseResponseJson<{ organizations?: MapVet[] }>(res);
        if (cancelled) return;
        if (!parsed.ok || !parsed.data?.organizations) {
          setVetLoadErr(t("report.loadVetsError"));
          return;
        }
        const rows = parsed.data.organizations.filter(
          (o) => o && Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude))
        );
        setVetList(rows);
      } catch {
        if (!cancelled) setVetLoadErr(t("report.loadVetsError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const coordsForSort = useMemo(() => {
    const g = parseLatLng(location);
    if (g.latitude != null && g.longitude != null) return { lat: g.latitude, lng: g.longitude };
    return userCoords;
  }, [location, userCoords]);

  const sortedVets = useMemo((): VetWithKm[] => {
    if (!vetList.length) return [];
    if (!coordsForSort) return vetList.slice(0, 12).map((o) => ({ ...o }));
    return [...vetList]
      .map((o) => ({
        ...o,
        km: distanceKm(coordsForSort.lat, coordsForSort.lng, o.latitude, o.longitude),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 12);
  }, [vetList, coordsForSort]);

  const handleSubmit = async () => {
    const detail = [animalType, injury, condition, urgency].filter((s) => s.trim()).join("\n");
    if (!detail.trim() || !location.trim()) {
      Alert.alert(t('report.alertMissingTitle'), t('report.alertMissingBody'));
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const geo = parseLatLng(location);
      const title = [animalType.trim(), urgency.trim()].filter(Boolean).join(" · ") || "Injury report";
      const body = {
        title,
        description: detail.trim(),
        photo_url: photoUris[0] || null,
        latitude: geo.latitude ?? userCoords?.lat ?? null,
        longitude: geo.longitude ?? userCoords?.lng ?? null,
        address_text: geo.address_text ?? location.trim(),
        target_organization_id: selectedVetId ?? undefined,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || data.message || res.statusText);
      }
      Alert.alert(t('report.alertSuccessTitle'), t('report.alertSuccessBody'));
      router.back();
    } catch (e) {
      Alert.alert(t('report.alertErrorTitle'), e instanceof Error ? e.message : t('report.alertErrorBody'));
    } finally {
      setSubmitting(false);
    }
  };
  
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (source: "gallery" | "camera") => {
    setIsLoading(true);
    try {
      let permissionResult;
      let pickerResult: ImagePicker.ImagePickerResult;

      if (source === "gallery") {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(t('report.permGalleryTitle'), t('report.permGalleryBody'));
          setIsLoading(false);
          return;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          setPhotoUris((prev) => [
            ...prev,
            ...pickerResult.assets!
              .map((asset: ImagePicker.ImagePickerAsset) => asset.uri)
              .filter((uri: string) => uri && !prev.includes(uri)),
          ]);
        }
      } else {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(t('report.permCameraTitle'), t('report.permCameraBody'));
          setIsLoading(false);
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          const takenUri = pickerResult.assets[0].uri;
          setPhotoUris((prev) => takenUri && !prev.includes(takenUri) ? [...prev, takenUri] : prev);
        }
      }
    } catch (e) {
      Alert.alert(t('report.alertErrorTitle'), source === "gallery"
        ? t('report.pickErrorGallery')
        : t('report.pickErrorCamera'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = () => pickImage("gallery");
  const handleTakePhoto = () => pickImage("camera");

  const handleRemovePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter(item => item !== uri));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.mainContainer} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      {/* --- Fancy Glassy Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessible
          onPress={() => router.back()}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#066958" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('report.headerTitle')}
        </Text>
        <View style={{ width: 28 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Glowy Icon header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconGlow}>
            <MaterialCommunityIcons name="paw" size={60} color="#fff" style={{ textShadowColor: '#ff5252', textShadowRadius: 14 }} />
            <MaterialCommunityIcons name="alert-circle" size={26} color="#FFD600" style={{ position: 'absolute', bottom: 3, right: 3 }} />
       
          </View>
          <Text style={styles.heroTitle}>{t('report.title')}</Text>
          <Text style={styles.subtitle}>{t('report.subtitle')}</Text>
        </View>

        {/* Upload or Take Picture Section */}
        <View style={[styles.surfaceCard, styles.inputWrapper]}>
          <Text style={styles.label}>{t('report.labelPhoto')}</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              disabled={isLoading}
              style={[styles.uploadBtn, styles.uploadBtnFancy, isLoading && { opacity: 0.5 }]}
              onPress={handlePickImage}
            >
              <Ionicons name="image-outline" size={22} color="#30AEA9" />
              <Text style={styles.uploadBtnText}>{t('report.uploadImage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, styles.takeBtnFancy]}
              accessibilityLabel="Take a new photo"
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={22} color="#183362" />
              <Text style={[styles.uploadBtnText, {color: "#183362"}]}>{t('report.takePhoto')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoPreviewGrid}>
            {photoUris.map((uri) => (
              <View key={uri} style={styles.previewContainer}>
                {/* Fancy shadow & border effect */}
                <View style={styles.previewShadow}>
                  <Image
                    source={{ uri }}
                    style={styles.previewImage}
                    accessibilityLabel="Selected photo preview"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(uri)}
                  style={styles.removePhotoBtn}
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t("report.sectionDetails")}</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('report.labelAnimalType')}</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="paw-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder={t('report.phAnimalType')}
                value={animalType}
                onChangeText={setAnimalType}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('report.labelInjury')}</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="bandage-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder={t('report.phInjury')}
                value={injury}
                onChangeText={setInjury}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('report.labelCondition')}</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="pulse-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder={t('report.phCondition')}
                value={condition}
                onChangeText={setCondition}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{t('report.labelUrgency')}</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="alert-circle-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder={t('report.phUrgency')}
                value={urgency}
                onChangeText={setUrgency}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t("report.sectionLocation")}</Text>

          {/* --- Location Input --- */}
          <View style={styles.inputWrapper}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>{t('report.locationLabel')}</Text>
              <TouchableOpacity
                onPress={async () => {
                  const { granted } = await Location.requestForegroundPermissionsAsync();
                  if (!granted) {
                    Alert.alert(t('report.permLocDeniedTitle'), t('report.permLocDeniedBody'));
                    return;
                  }
                  const loc = await Location.getCurrentPositionAsync({});
                  const lat = loc.coords.latitude;
                  const lng = loc.coords.longitude;
                  setUserCoords({ lat, lng });
                  setLocation(`${lat}, ${lng}`);
                }}
                style={styles.locationBtn}
                accessibilityLabel="Use my current location"
              >
                <Ionicons name="locate" size={16} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.locationBtnText}>{t('report.useCurrentLocation')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationInputRow}>
              <Ionicons name="location-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput, styles.locationInput]}
                placeholder={t('report.phLocation')}
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#B6CCD3"
              />
            </View>
            <TouchableOpacity
              onPress={async () => {
                const { granted } = await Location.requestForegroundPermissionsAsync();
                if (!granted) {
                  Alert.alert(t("report.permLocDeniedTitle"), t("report.permLocDeniedBody"));
                  return;
                }
                const loc = await Location.getCurrentPositionAsync({});
                setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
              }}
              style={styles.gpsHintBtn}
            >
              <Ionicons name="navigate-outline" size={16} color="#0d9488" />
              <Text style={styles.gpsHintTxt}>{t("report.useLocationForVets")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/map")}
              style={styles.openMapRow}
              accessibilityLabel="Open provider map"
            >
              <Ionicons name="map-outline" size={20} color="#15803d" />
              <Text style={styles.openMapTxt}>{t("homeHub.browseProviders")}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t("report.sectionVet")}</Text>
          <Text style={styles.sectionHint}>{t("report.nearestVetHint")}</Text>
          {vetLoadErr ? <Text style={styles.vetErr}>{vetLoadErr}</Text> : null}
          {sortedVets.length === 0 ? (
            <Text style={styles.sectionHint}>{t("report.noVetsNearby")}</Text>
          ) : (
            sortedVets.map((v) => {
              const km = typeof v.km === "number" ? v.km : null;
              const sel = selectedVetId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vetRow, sel && styles.vetRowSelected]}
                  onPress={() => setSelectedVetId(sel ? null : v.id)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vetName}>{v.display_name}</Text>
                    <Text style={styles.vetSub} numberOfLines={1}>
                      {[v.address_line, v.city].filter(Boolean).join(" · ") || "—"}
                    </Text>
                  </View>
                  <View style={styles.vetMeta}>
                    {km != null ? (
                      <Text style={styles.vetKm}>{t("report.distanceKm", { km: km.toFixed(1) })}</Text>
                    ) : null}
                    <View style={[styles.vetBadge, v.verified ? styles.vetBadgeOk : styles.vetBadgeWait]}>
                      <Text style={styles.vetBadgeTxt}>
                        {v.verified ? t("map.verifiedBadge") : t("map.pendingBadge")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {selectedVetId != null ? (
            <Text style={styles.vetSelectedNote}>{t("report.vetSelected")}</Text>
          ) : null}

          {/* --- Contact Input --- */}
          {/* <View style={styles.inputWrapper}>
            <Text style={styles.label}>Your Contact Info</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="call-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="Email or phone number"
                value={contact}
                onChangeText={setContact}
                keyboardType="email-address"
                placeholderTextColor="#B6CCD3"
              />
            </View>
          </View> */}
          <TouchableOpacity 
            style={[styles.submitBtn, styles.glowBtn, submitting && styles.disabledBtn]} 
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>{t('report.submitReport')}</Text>
                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Fancy/Animated and colorful/fun CSS ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#e7fdf3",
  },
  // Glassy, gradient header bar!
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 46 : 22,
    paddingBottom: 16,
    backgroundColor: 'rgba(55,253,160,0.12)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#55feb2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 7,
  },
  headerBackBtn: {
    padding: 5,
    marginRight: 8,
    borderRadius: 18,
    backgroundColor: "#d8fff1",
    shadowColor: "#65eac1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.19,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#066958',
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-condensed",
    textShadowColor: "#a0ffe4",
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 65,
  },
  // --- Fancy icon header ---
  iconHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    backgroundColor: "#36e3ab",
    borderRadius: 36,
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3ffab7",
    shadowRadius: 26,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: 2,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#f3fef9",
  },
  title: {
    fontSize: 29,
    fontWeight: '900',
    color: "#183362",
    marginTop: 12,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 0.6,
    textShadowColor: "#b6f9eb",
    textShadowRadius: 5,
    textShadowOffset: {width: 0, height: 2},
  },
  subtitle: {
    fontSize: 15,
    color: "#226950",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 22,
    lineHeight: 21,
    letterSpacing: 0.15,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#183362",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 12,
    letterSpacing: 0.2,
  },
  surfaceCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#ccf7e8",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
    marginTop: 2,
  },
  sectionHint: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 10,
  },
  vetErr: { color: "#b45309", fontSize: 13, marginBottom: 8 },
  gpsHintBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  gpsHintTxt: { fontSize: 13, fontWeight: "600", color: "#0d9488" },
  openMapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  openMapTxt: { flex: 1, fontSize: 15, fontWeight: "700", color: "#14532d" },
  vetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    marginBottom: 8,
  },
  vetRowSelected: {
    borderColor: "#2dd4bf",
    backgroundColor: "#ecfdf5",
  },
  vetName: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  vetSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  vetMeta: { alignItems: "flex-end", gap: 4, marginLeft: 8 },
  vetKm: { fontSize: 12, fontWeight: "700", color: "#0f766e" },
  vetBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  vetBadgeOk: { backgroundColor: "#dcfce7" },
  vetBadgeWait: { backgroundColor: "#ffedd5" },
  vetBadgeTxt: { fontSize: 10, fontWeight: "800", color: "#14532d" },
  vetSelectedNote: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    marginTop: 4,
    marginBottom: 4,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 23,
    shadowColor: "#17e489",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 9,
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#bfffe1",
  },
  inputWrapper: {
    marginBottom: 27,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085A43',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f7ed',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d0f6e4',
    paddingHorizontal: 15,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 3,
    opacity: 0.85,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 17,
    color: '#0c5149',
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "sans-serif",
    letterSpacing: 0.12,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  // Fancy input styles (for glassy effect)
  fancyInput: {
    backgroundColor: "rgba(245,255,250,0.53)",
    borderRadius: 13,
    paddingLeft: 5,
    borderWidth: 1.1,
    borderColor: "#e8fef0",
  },
  fancyInputContainer: {
    borderWidth: 2.2,
    backgroundColor: "#edfaf0",
    borderColor: "#cdf3eb"
  },

  // --- Photo Section --- 
  photoButtonRow: {
    flexDirection: 'row',
    gap: 13,
    marginBottom: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    paddingVertical: 13,
    justifyContent: 'center',
    borderWidth: 1.1,
    borderColor: '#47e7bd',
    marginBottom: 0,
    gap: 8,
    backgroundColor: "#e8fff6",
    shadowColor: "#48bd9e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 1,
  },
  uploadBtnFancy: {
    backgroundColor: '#edfafe',
    borderColor: '#7aecdd',
    shadowColor: "#7aecdd",
    shadowOpacity: 0.16,
    shadowRadius: 9,
  },
  takeBtnFancy: {
    backgroundColor: "#dbeafe",
    borderColor: "#79aeea",
    shadowColor: "#6aa4fa",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  uploadBtnText: {
    color: '#22A48B',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Medium" : "sans-serif-medium",
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  photoPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 6,
  },
  previewContainer: {
    position: 'relative',
    marginRight: 8,
    marginTop: 8,
  },
  previewShadow: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: "#79ead3",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.17,
    shadowRadius: 25,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#d4ffe9",
    backgroundColor: "#f8fffc",
  },
  previewImage: {
    width: 125,
    height: 125,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#befae7',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 7,
    right: 10,
    backgroundColor: "#2aa694cc",
    borderRadius: 20,
    width: 33,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1.8,
    borderColor: "#fff",
    shadowColor: "#119369",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 1 },
    elevation: 7,
  },

  // --- Fancy Location Section ---
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: 0,
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085A43',
    marginTop: 11,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium",
    letterSpacing: 0.19,
  },
  locationBtn: {
    flexDirection: 'row',
    backgroundColor: "#21C996",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#18c99e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  locationBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12.2,
    letterSpacing: 0.2,
  },
  locationInputRow: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f3fcf8', 
    borderRadius: 14, 
    borderWidth: 1.7, 
    borderColor: '#e8f8f2',
    paddingHorizontal: 15,
    paddingVertical: 2,
    marginTop: 0,
    shadowColor: "#3ceadf",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  locationInput: {
    paddingVertical: 11, 
    fontSize: 16.5, 
    paddingLeft: 0,
  },
  locationMoreBtn: {
    marginLeft: 10,
    backgroundColor: "#d3eafd",
    borderRadius: 13,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
    borderWidth: 0.7,
    borderColor: "#b2e3e7"
  },

  // --- Fancy Submit Button ---
  submitBtn: {
    backgroundColor: "#FF2323", // Bright red for visibility
    borderRadius: 17,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
    shadowColor: "#A80000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  glowBtn: {
    shadowColor: "#FF8A8A",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 15,
    borderWidth: 2,
    borderColor: "#FF9292",
    backgroundColor: "#FF5959"
  },
  disabledBtn: {
    backgroundColor: "#C2BEBE",
    borderColor: "#E5E4E2",
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 0.31,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-black"
  }
});