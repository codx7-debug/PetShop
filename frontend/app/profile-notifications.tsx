import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type MeUser = {
  notify_email?: boolean;
  notify_push?: boolean;
  notify_marketing?: boolean;
};

export default function ProfileNotificationsScreen() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);
  const [mktOn, setMktOn] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ user?: MeUser }>(res);
      const u = parsed.data?.user;
      if (!u) throw new Error("—");
      setEmailOn(u.notify_email !== false);
      setPushOn(u.notify_push !== false);
      setMktOn(Boolean(u.notify_marketing));
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

  const persistAll = async (body: { notify_email: boolean; notify_push: boolean; notify_marketing: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const parsed = await parseResponseJson<{ user?: MeUser & Record<string, unknown> }>(res);
      if (!parsed.ok || !parsed.data?.user) throw new Error("—");
      const raw = await AsyncStorage.getItem("user");
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      await AsyncStorage.setItem("user", JSON.stringify({ ...prev, ...parsed.data.user }));
      setEmailOn(Boolean(parsed.data.user.notify_email));
      setPushOn(Boolean(parsed.data.user.notify_push));
      setMktOn(Boolean(parsed.data.user.notify_marketing));
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
        <Text style={styles.title}>{t("userProfile.notifTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>{t("userProfile.notifHint")}</Text>
        {saving ? <ActivityIndicator style={{ marginBottom: 8 }} /> : null}
        <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={styles.rowTxt}>{t("userProfile.notifEmail")}</Text>
          <Switch
            value={emailOn}
            onValueChange={(v) => void persistAll({ notify_email: v, notify_push: pushOn, notify_marketing: mktOn })}
          />
        </View>
        <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={styles.rowTxt}>{t("userProfile.notifPush")}</Text>
          <Switch
            value={pushOn}
            onValueChange={(v) => void persistAll({ notify_email: emailOn, notify_push: v, notify_marketing: mktOn })}
          />
        </View>
        <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={styles.rowTxt}>{t("userProfile.notifMkt")}</Text>
          <Switch
            value={mktOn}
            onValueChange={(v) => void persistAll({ notify_email: emailOn, notify_push: pushOn, notify_marketing: v })}
          />
        </View>
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
  scroll: { padding: 20 },
  hint: { fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 18 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTxt: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0f172a" },
});
