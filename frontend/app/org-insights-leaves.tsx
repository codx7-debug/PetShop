import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Leave = {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string | null;
  user_full_name?: string | null;
  review_notes?: string | null;
};

export default function OrgInsightsLeavesScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [modal, setModal] = useState(false);
  const [sd, setSd] = useState("");
  const [ed, setEd] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const detectRole = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return setIsOwner(false);
      const u = JSON.parse(raw) as { role?: string };
      setIsOwner(String(u.role || "").toLowerCase() === "org");
    } catch {
      setIsOwner(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/staff-leaves`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ leave_requests?: Leave[] }>(res);
      if (p.ok) setRows(p.data?.leave_requests || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void detectRole();
  }, [detectRole]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!sd.trim() || !ed.trim()) {
      Alert.alert("", t("orgInsightsLeaves.invalidDates"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/staff-leaves`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          start_date: sd.trim(),
          end_date: ed.trim(),
          reason: reason.trim() || null,
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setModal(false);
      setSd("");
      setEd("");
      setReason("");
      void load();
    } catch {
      Alert.alert("", t("orgInsightsLeaves.submitError"));
    } finally {
      setSaving(false);
    }
  };

  const review = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/staff-leaves/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      void load();
    } catch {
      Alert.alert("", t("orgInsightsLeaves.updateError"));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInsightsLeaves.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setModal(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgInsightsLeaves.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.who}>{item.user_full_name || `#${item.user_id}`}</Text>
              <Text style={styles.meta}>
                {item.start_date} → {item.end_date}
              </Text>
              <Text style={[styles.st, item.status === "approved" ? styles.ok : item.status === "rejected" ? styles.bad : {}]}>
                {item.status}
              </Text>
              {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
              {item.status === "pending" && isOwner ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity style={styles.approve} onPress={() => void review(item.id, "approved")}>
                    <Text style={styles.approveTxt}>{t("orgInsightsLeaves.approve")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reject} onPress={() => void review(item.id, "rejected")}>
                    <Text style={styles.rejectTxt}>{t("orgInsightsLeaves.reject")}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={modal} onRequestClose={() => setModal(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgInsightsLeaves.requestLeave")}</Text>
          <TextInput placeholder={t("orgInsightsLeaves.startPh")} style={styles.inp} value={sd} onChangeText={setSd} />
          <TextInput placeholder={t("orgInsightsLeaves.endPh")} style={styles.inp} value={ed} onChangeText={setEd} />
          <TextInput placeholder={t("orgInsightsLeaves.reasonPh")} style={styles.inp} value={reason} onChangeText={setReason} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16 }}>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cx}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okb} disabled={saving} onPress={() => void submit()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okbTxt}>{t("orgInsightsLeaves.send")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 17, color: "#1e40af" },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 32 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  who: { fontWeight: "900", fontSize: 15, color: "#0f172a" },
  meta: { marginTop: 4, fontWeight: "600", color: "#475569" },
  st: { marginTop: 8, fontWeight: "800", color: "#b45309", textTransform: "capitalize" },
  ok: { color: "#15803d" },
  bad: { color: "#b91c1c" },
  reason: { marginTop: 8, fontSize: 13, color: "#334155" },
  approve: { backgroundColor: "#15803d", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  approveTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reject: { backgroundColor: "#fee2e2", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  rejectTxt: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  sheetTit: { fontWeight: "900", fontSize: 18, marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cx: { fontWeight: "700", color: "#64748b", paddingVertical: 12 },
  okb: { backgroundColor: "#2563eb", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  okbTxt: { color: "#fff", fontWeight: "900" },
});
