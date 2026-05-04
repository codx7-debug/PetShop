import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type MeUser = Record<string, unknown>;

export default function ProfileAddressScreen() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [line, setLine] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ user?: MeUser }>(res);
      const u = parsed.data?.user;
      if (!u) throw new Error("—");
      setLine(String(u.address_line || ""));
      setCity(String(u.address_city || ""));
      setRegion(String(u.address_region || ""));
      setPostal(String(u.address_postal || ""));
      setCountry(String(u.address_country || ""));
    } catch {
      Alert.alert("", t("userProfile.loadFail"));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          address_line: line.trim() || null,
          address_city: city.trim() || null,
          address_region: region.trim() || null,
          address_postal: postal.trim() || null,
          address_country: country.trim() || null,
        }),
      });
      const parsed = await parseResponseJson<{ user?: MeUser }>(res);
      if (!parsed.ok || !parsed.data?.user) throw new Error("—");
      const raw = await AsyncStorage.getItem("user");
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      await AsyncStorage.setItem("user", JSON.stringify({ ...prev, ...parsed.data.user }));
      Alert.alert("", t("userProfile.saved"));
      router.back();
    } catch {
      Alert.alert("", t("userProfile.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator color="#4361ee" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#2b415c" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("userProfile.addrTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>{t("userProfile.addrHint")}</Text>
        <Text style={styles.label}>{t("userProfile.addrLine")}</Text>
        <TextInput style={[styles.input, styles.multiline]} multiline value={line} onChangeText={setLine} />
        <Text style={styles.label}>{t("userProfile.addrCity")}</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />
        <Text style={styles.label}>{t("userProfile.addrRegion")}</Text>
        <TextInput style={styles.input} value={region} onChangeText={setRegion} />
        <Text style={styles.label}>{t("userProfile.addrPostal")}</Text>
        <TextInput style={styles.input} value={postal} onChangeText={setPostal} />
        <Text style={styles.label}>{t("userProfile.addrCountry")}</Text>
        <TextInput style={styles.input} value={country} onChangeText={setCountry} />
        <TouchableOpacity style={styles.btn} onPress={() => void save()} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{t("userProfile.save")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  scroll: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 13, color: "#64748b", marginBottom: 14, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: "#0f172a",
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  btn: {
    marginTop: 24,
    backgroundColor: "#4361ee",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
