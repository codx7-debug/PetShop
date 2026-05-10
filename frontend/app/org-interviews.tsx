import React, { useCallback, useState } from "react";
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
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Row = Record<string, unknown> & {
  id: number;
  subject_name?: string;
  summary?: string;
  recording_uri?: string | null;
  interviewed_at?: string;
};

export default function OrgInterviewsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [uri, setUri] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/interviews`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ interviews?: Row[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.interviews || []);
    } catch {
      Alert.alert("", t("orgInterviews.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!subject.trim()) {
      Alert.alert("", t("orgInterviews.subjectRequired"));
      return;
    }
    if (!summary.trim() && !uri.trim()) {
      Alert.alert("", t("orgInterviews.summaryOrLink"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/interviews`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          subject_name: subject.trim(),
          summary: summary.trim(),
          recording_uri: uri.trim() || null,
          category: "interview",
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setSubject("");
      setSummary("");
      setUri("");
      void load();
    } catch {
      Alert.alert("", t("orgInterviews.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInterviews.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#7c3aed" />
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>
        {t("orgInterviews.subtitle")}
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgInterviews.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{String(item.subject_name || "")}</Text>
              <Text style={styles.cardMeta}>
                {item.interviewed_at ? new Date(String(item.interviewed_at)).toLocaleString() : ""}
              </Text>
              <Text style={styles.body}>{String(item.summary || "")}</Text>
              {item.recording_uri ? <Text style={styles.link}>{String(item.recording_uri)}</Text> : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgInterviews.newLog")}</Text>
          <TextInput placeholder={t("orgInterviews.subjectPh")} style={styles.inp} value={subject} onChangeText={setSubject} />
          <TextInput
            placeholder={t("orgInterviews.summaryPh")}
            style={[styles.inp, styles.tall]}
            value={summary}
            onChangeText={setSummary}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            placeholder={t("orgInterviews.recordingPh")}
            style={styles.inp}
            value={uri}
            onChangeText={setUri}
            autoCapitalize="none"
          />
          <View style={[styles.sheetRow, { marginTop: 16 }]}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setOpen(false)}>
              <Text style={{ fontWeight: "800", color: "#64748b" }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOk} onPress={() => void save()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "900" }}>{t("orgInterviews.save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "android" ? 8 : 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { padding: 4 },
  addBn: { marginLeft: "auto", padding: 4 },
  title: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  sub: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 36 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0ff",
    marginBottom: 12,
  },
  cardName: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  cardMeta: { fontSize: 12, color: "#64748b", marginTop: 4 },
  body: { fontSize: 14, color: "#334155", marginTop: 10 },
  link: { fontSize: 12, color: "#7c3aed", marginTop: 10 },
  sheet: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 14, color: "#0f172a" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#faf5ff",
  },
  tall: { minHeight: 110 },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 14 },
  btnOk: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
});
