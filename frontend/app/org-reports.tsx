import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type ReportRow = {
  id: number;
  title?: string | null;
  description: string;
  status: string;
  assigned_organization_id?: number | null;
};

export default function OrgReportsScreen() {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [access, setAccess] = useState<"pending" | "allowed" | "blocked">("pending");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [resolveOpen, setResolveOpen] = useState<{ id: number } | null>(null);
  const [summaryDraft, setSummaryDraft] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/reports?limit=200`, {
        headers: await getAuthHeaders(false),
      });
      const data = (await res.json()) as { reports?: ReportRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setRows(data.reports || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (access === "allowed") void load();
  }, [access, load]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        router.replace("/login");
        return;
      }
      let u: { role?: string };
      try {
        u = JSON.parse(raw) as { role?: string };
      } catch {
        router.replace("/login");
        return;
      }
      if (String(u.role || "").toLowerCase() !== "org") {
        router.replace("/home");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/org/me`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{
        organization?: { org_type?: string | null };
        error?: string;
      }>(res);
      if (cancelled) return;
      if (!parsed.ok || !parsed.data?.organization) {
        if (res.status === 401) router.replace("/login");
        else router.replace("/org-dashboard");
        return;
      }
      const ot = String(parsed.data.organization.org_type || "")
        .trim()
        .toLowerCase();
      if (ot !== "vet") {
        setAccess("blocked");
        Alert.alert("", t("orgReports.vetOnly"), [
          { text: t("common.ok"), onPress: () => router.replace("/org-dashboard") },
        ]);
        return;
      }
      setAccess("allowed");
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const patchStatus = async (
    id: number,
    status: string,
    assign: boolean,
    public_summary?: string
  ) => {
    try {
      const body: Record<string, unknown> = { status, assign_to_my_org: assign };
      if (status === "resolved" && public_summary?.trim()) {
        body.public_summary = public_summary.trim();
      }
      const res = await fetch(`${API_BASE_URL}/api/org/reports/${id}/status`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      Alert.alert("", t("orgReports.saved"));
      await load();
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : "—");
    }
  };

  if (access === "pending" || access === "blocked") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f3d3a" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2B9B7A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f3d3a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("orgReports.title")}</Text>
          <Text style={styles.sub}>{t("orgReports.subtitle")}</Text>
        </View>
      </View>
      <Text style={styles.hint}>{t("orgReports.claimHint")}</Text>

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {loading && rows.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2B9B7A" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || `#${item.id}`}</Text>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.desc} numberOfLines={3}>
                {item.description}
              </Text>
              <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => void patchStatus(item.id, "open", !item.assigned_organization_id)}
                >
                  <Text style={styles.btnTxt}>{t("orgReports.statusOpen")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => void patchStatus(item.id, "in_progress", true)}
                >
                  <Text style={styles.btnTxt}>{t("orgReports.statusProgress")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => {
                    setSummaryDraft("");
                    setResolveOpen({ id: item.id });
                  }}
                >
                  <Text style={styles.btnTxt}>{t("orgReports.statusResolved")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{t("reportsFeed.empty")}</Text> : null}
        />
      )}

      <Modal transparent visible={!!resolveOpen} animationType="fade" onRequestClose={() => setResolveOpen(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(insets.top, 8) : 0}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)" }}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                Keyboard.dismiss();
                setResolveOpen(null);
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              keyboardDismissMode="interactive"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 20,
                paddingVertical: Math.max(insets.bottom, 16),
              }}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{t("orgReports.summaryPromptTitle")}</Text>
                <Text style={styles.modalHint}>{t("orgReports.summaryPromptHint")}</Text>
                <TextInput
                  style={styles.modalInput}
                  multiline
                  value={summaryDraft}
                  onChangeText={setSummaryDraft}
                  placeholder={t("orgReports.summaryPlaceholder")}
                  placeholderTextColor="#94a3b8"
                />
                <View style={[styles.modalRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setResolveOpen(null)}>
                    <Text style={styles.modalCancelTxt}>{t("orgReports.modalCancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSubmit}
                    onPress={() => {
                      const id = resolveOpen?.id;
                      if (!id) return;
                      if (!summaryDraft.trim()) {
                        Alert.alert("", t("orgReports.summaryPromptHint"));
                        return;
                      }
                      const s = summaryDraft.trim();
                      setResolveOpen(null);
                      void patchStatus(id, "resolved", false, s);
                      setSummaryDraft("");
                    }}
                  >
                    <Text style={styles.modalSubmitTxt}>{t("orgReports.resolveSave")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F5F9" },
  header: { paddingHorizontal: 12, paddingVertical: 8, alignItems: "flex-start" },
  back: { padding: 8, marginTop: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#0a2540" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  hint: { fontSize: 12, color: "#475569", paddingHorizontal: 16, marginBottom: 8 },
  err: { color: "#b91c1c", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  status: { fontSize: 12, color: "#64748b", marginTop: 4 },
  desc: { fontSize: 14, color: "#334155", marginTop: 8, lineHeight: 20 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  btnTxt: { fontSize: 12, fontWeight: "700", color: "#166534" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 40 },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  modalHint: { fontSize: 13, color: "#64748b", marginTop: 6, marginBottom: 12, lineHeight: 18 },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
    color: "#0f172a",
  },
  modalRow: { gap: 10, marginTop: 14, justifyContent: "flex-end" },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  modalCancelTxt: { fontWeight: "700", color: "#475569", fontSize: 15 },
  modalSubmit: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#059669",
  },
  modalSubmitTxt: { fontWeight: "800", color: "#fff", fontSize: 15 },
});
