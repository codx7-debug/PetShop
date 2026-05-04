import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";

type OrgRow = {
  display_name?: string | null;
  org_type?: string | null;
  description?: string | null;
  address_line?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function OrgProfileSettingsScreen() {
  const { t, isRTL } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row";
  const align = isRTL ? "right" : "left";

  const [orgType, setOrgType] = useState("vet");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        router.replace({ pathname: "/login" });
        return;
      }
      const u = JSON.parse(raw) as { role?: string; org_type?: string | null };
      if (String(u.role || "").toLowerCase() !== "org") {
        router.replace({ pathname: "/home" });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/org/me`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ organization?: OrgRow }>(res);
      const o = parsed.data?.organization;
      if (!parsed.ok || !o) {
        Alert.alert("", t("orgProfileSettings.loadError"));
        return;
      }
      setOrgType(String(o.org_type || "vet").toLowerCase());
      setDisplayName((o.display_name || "").trim());
      setDescription((o.description || "").trim());
      setAddressLine((o.address_line || "").trim());
      setCity((o.city || "").trim());
      setCountry((o.country || "").trim());
      setLatStr(o.latitude != null && Number.isFinite(Number(o.latitude)) ? String(o.latitude) : "");
      setLngStr(o.longitude != null && Number.isFinite(Number(o.longitude)) ? String(o.longitude) : "");
    } catch {
      Alert.alert("", t("orgProfileSettings.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate])
  );

  const parseCoord = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const onUseGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("", t("orgProfileSettings.locationDenied"));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatStr(loc.coords.latitude.toFixed(6));
      setLngStr(loc.coords.longitude.toFixed(6));
    } catch {
      Alert.alert("", t("orgProfileSettings.locationFail"));
    }
  };

  const onSave = async () => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert("", t("orgProfileSettings.needName"));
      return;
    }
    const lat = parseCoord(latStr);
    const lng = parseCoord(lngStr);
    if ((lat == null) !== (lng == null)) {
      Alert.alert("", t("orgProfileSettings.bothCoords"));
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string | number | null> = {
        display_name: name,
        description: description.trim() || null,
        address_line: addressLine.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        latitude: lat,
        longitude: lng,
      };
      const res = await fetch(`${API_BASE_URL}/api/org/me`, {
        method: "PUT",
        headers: await getAuthHeaders(true),
        body: JSON.stringify(body),
      });
      const parsed = await parseResponseJson<{ organization?: OrgRow; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.organization) {
        throw new Error(parsed.data?.error || t("orgProfileSettings.saveError"));
      }
      Alert.alert("", t("orgProfileSettings.saved"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("orgProfileSettings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.shell}>
      <LinearGradient colors={theme.gradient} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={14}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t("orgProfileSettings.title")}</Text>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.sub}>{t("orgProfileSettings.subtitle")}</Text>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.sheet, { borderLeftColor: theme.accent }]}>
            {loading ? (
              <ActivityIndicator color={theme.accent} style={{ marginVertical: 24 }} />
            ) : (
              <>
                <Text style={[styles.label, { textAlign: align }]}>{t("orgProfileSettings.nameLabel")}</Text>
                <TextInput
                  style={[styles.input, { textAlign: align }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t("orgProfileSettings.namePh")}
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.label, { textAlign: align, marginTop: 16 }]}>
                  {t("orgProfileSettings.descriptionLabel")}
                </Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline, { textAlign: align }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t("orgProfileSettings.descriptionPh")}
                  placeholderTextColor="#94a3b8"
                  multiline
                />

                <Text style={[styles.section, { textAlign: align }]}>{t("orgProfileSettings.locationSection")}</Text>

                <Text style={[styles.label, { textAlign: align }]}>{t("orgProfileSettings.addressLabel")}</Text>
                <TextInput
                  style={[styles.input, { textAlign: align }]}
                  value={addressLine}
                  onChangeText={setAddressLine}
                  placeholder={t("orgProfileSettings.addressPh")}
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.label, { textAlign: align, marginTop: 14 }]}>{t("orgProfileSettings.cityLabel")}</Text>
                <TextInput
                  style={[styles.input, { textAlign: align }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder={t("orgProfileSettings.cityPh")}
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.label, { textAlign: align, marginTop: 14 }]}>
                  {t("orgProfileSettings.countryLabel")}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: align }]}
                  value={country}
                  onChangeText={setCountry}
                  placeholder={t("orgProfileSettings.countryPh")}
                  placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity style={[styles.gpsBtn, { flexDirection: rowDir }]} onPress={() => void onUseGps()}>
                  <Ionicons name="navigate-outline" size={18} color={theme.accent} />
                  <Text style={[styles.gpsTxt, { color: theme.accent }]}>{t("orgProfileSettings.useGps")}</Text>
                </TouchableOpacity>

                <Text style={[styles.hint, { textAlign: align }]}>{t("orgProfileSettings.coordsHint")}</Text>
                <View style={[styles.coordRow, { flexDirection: rowDir }]}>
                  <TextInput
                    style={[styles.input, styles.coordInput, { textAlign: align }]}
                    value={latStr}
                    onChangeText={setLatStr}
                    placeholder={t("orgProfileSettings.latPh")}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numbers-and-punctuation"
                  />
                  <TextInput
                    style={[styles.input, styles.coordInput, { textAlign: align }]}
                    value={lngStr}
                    onChangeText={setLngStr}
                    placeholder={t("orgProfileSettings.lngPh")}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.75 }]}
                  onPress={() => void onSave()}
                  disabled={saving}
                  activeOpacity={0.92}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveTxt}>{t("orgProfileSettings.save")}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f1f5f9" },
  hero: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: Platform.OS === "android" ? 168 : 150,
  },
  safe: { paddingBottom: 8 },
  topBar: { alignItems: "center", paddingHorizontal: 12, gap: 8 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  screenTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  sub: {
    marginHorizontal: 22,
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 19,
    fontWeight: "500",
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 12 },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: { fontSize: 12, fontWeight: "800", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  section: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    minHeight: 48,
  },
  inputMultiline: { minHeight: 112, paddingTop: 12, textAlignVertical: "top" },
  coordRow: { gap: 10, marginTop: 8 },
  coordInput: { flex: 1, minHeight: 48 },
  gpsBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gpsTxt: { fontSize: 14, fontWeight: "800" },
  hint: { fontSize: 12, color: "#94a3b8", marginTop: 10, lineHeight: 17 },
  saveBtn: {
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveTxt: { fontSize: 17, fontWeight: "900", color: "#fff" },
});
