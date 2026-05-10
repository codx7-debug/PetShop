import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Doc = {
  id: number;
  title: string;
  file_url: string;
  notes?: string | null;
  created_at?: string;
};

export default function OrgClinicCustomerDocsScreen() {
  const { t } = useLanguage();
  const { customerUserId, customerName } = useLocalSearchParams<{
    customerUserId?: string;
    customerName?: string;
  }>();
  const cid = Number.parseInt(String(customerUserId || ""), 10);
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(cid)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/customers/${cid}/documents`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ documents?: Doc[]; error?: string }>(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      setRows(parsed.data?.documents || []);
    } catch {
      Alert.alert("", t("orgClinicCustomerDocs.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [cid]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!title.trim() || !fileUrl.trim()) {
      Alert.alert("", t("orgClinicCustomerDocs.validation"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/customers/${cid}/documents`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ title: title.trim(), file_url: fileUrl.trim(), notes: notes.trim() || null }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setTitle("");
      setFileUrl("");
      setNotes("");
      void load();
    } catch {
      Alert.alert("", t("orgClinicCustomerDocs.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!Number.isFinite(cid)) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.bad}>{t("orgClinicCustomerDocs.missingCustomer")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {t("orgClinicCustomerDocs.docs")} · {customerName || `${t("orgClinicCustomerDocs.user")} ${cid}`}
        </Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgClinicCustomerDocs.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.docTitle}>{item.title}</Text>
              <Text style={styles.url}>{item.file_url}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgClinicCustomerDocs.addCustomerDocument")}</Text>
          <TextInput placeholder={t("orgClinicCustomerDocs.titlePh")} style={styles.inp} value={title} onChangeText={setTitle} />
          <TextInput
            placeholder={t("orgClinicCustomerDocs.fileUrlPh")}
            style={styles.inp}
            value={fileUrl}
            onChangeText={setFileUrl}
            autoCapitalize="none"
          />
          <TextInput placeholder={t("orgClinicCustomerDocs.notesPh")} style={styles.inp} value={notes} onChangeText={setNotes} />
          <View style={styles.sheetRow}>
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelTxt}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.go} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.goTxt}>{t("orgClinicCustomerDocs.save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  bad: { padding: 24, textAlign: "center", color: "#b91c1c" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  addBn: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: "#0f172a" },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  docTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  url: { marginTop: 6, fontSize: 12, color: "#2563eb" },
  notes: { marginTop: 8, fontSize: 13, color: "#475569" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 10,
    fontSize: 16,
  },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
  cancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelTxt: { fontWeight: "700", color: "#64748b" },
  go: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  goTxt: { color: "#fff", fontWeight: "800" },
});
