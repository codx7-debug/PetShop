import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

export default function ProfilePasswordScreen() {
  const { t, isRTL } = useLanguage();
  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");
  const [newP2, setNewP2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!oldP || !newP) {
      Alert.alert("", t("userProfile.pwFillAll"));
      return;
    }
    if (newP.length < 6) {
      Alert.alert("", t("userProfile.pwMin"));
      return;
    }
    if (newP !== newP2) {
      Alert.alert("", t("userProfile.pwMismatch"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ old_password: oldP, new_password: newP }),
      });
      const parsed = await parseResponseJson<{ message?: string; ok?: boolean }>(res);
      if (!parsed.ok) {
        const msg = (parsed.data as { message?: string } | null)?.message || res.statusText;
        throw new Error(msg);
      }
      Alert.alert("", t("userProfile.pwSuccess"), [{ text: "OK", onPress: () => router.back() }]);
      setOldP("");
      setNewP("");
      setNewP2("");
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("userProfile.pwFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#2b415c" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("userProfile.pwTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{t("userProfile.pwOld")}</Text>
        <TextInput style={styles.input} secureTextEntry value={oldP} onChangeText={setOldP} />
        <Text style={styles.label}>{t("userProfile.pwNew")}</Text>
        <TextInput style={styles.input} secureTextEntry value={newP} onChangeText={setNewP} />
        <Text style={styles.label}>{t("userProfile.pwNewAgain")}</Text>
        <TextInput style={styles.input} secureTextEntry value={newP2} onChangeText={setNewP2} />
        <TouchableOpacity style={styles.btn} onPress={() => void submit()} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{t("userProfile.pwSave")}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  header: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  body: { padding: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
  },
  btn: {
    marginTop: 28,
    backgroundColor: "#0d9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
