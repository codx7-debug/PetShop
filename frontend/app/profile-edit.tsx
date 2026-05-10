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

type MeUser = {
  id: number;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  role?: string;
};

export default function ProfileEditScreen() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ user?: MeUser; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.user) throw new Error(parsed.data?.error || "—");
      const u = parsed.data.user;
      setFullName(u.full_name || "");
      setPhone(u.phone || "");
      setDob(u.date_of_birth ? String(u.date_of_birth).slice(0, 10) : "");
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
    if (!fullName.trim()) {
      Alert.alert("", t("userProfile.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          date_of_birth: dob.trim() || null,
        }),
      });
      const parsed = await parseResponseJson<{ user?: MeUser; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.user) throw new Error((parsed.data as { error?: string })?.error || "—");
      const u = parsed.data.user;
      const raw = await AsyncStorage.getItem("user");
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      await AsyncStorage.setItem("user", JSON.stringify({ ...prev, ...u }));
      Alert.alert("", t("userProfile.saved"));
      router.back();
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("userProfile.saveFail"));
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
        <Text style={styles.title}>{t("userProfile.editTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t("userProfile.fullName")}</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t("userProfile.fullName")}
        />
        <Text style={styles.label}>{t("userProfile.phone")}</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>{t("userProfile.dob")}</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder={t("userProfile.dobPlaceholder")}
          placeholderTextColor="#94a3b8"
        />
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
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    color: "#0f172a",
  },
  btn: {
    marginTop: 28,
    backgroundColor: "#4361ee",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
