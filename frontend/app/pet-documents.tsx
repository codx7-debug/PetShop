import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type Doc = {
  id: number;
  title: string;
  file_url: string;
  notes?: string | null;
  created_at?: string;
};

export default function PetDocumentsScreen() {
  const { t, isRTL } = useLanguage();
  const { petId, petName } = useLocalSearchParams<{ petId?: string; petName?: string }>();
  const pid = Number.parseInt(String(petId || ""), 10);
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(pid)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets/${pid}/documents`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ documents?: Doc[]; error?: string }>(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      setRows(parsed.data?.documents || []);
    } catch {
      Alert.alert("", t("userProfile.saveFail"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pid, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!title.trim() || !fileUrl.trim()) {
      Alert.alert("", t("petDocuments.validation"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets/${pid}/documents`, {
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
      Alert.alert("", t("userProfile.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  if (!Number.isFinite(pid)) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.bad}>{t("petDocuments.missingPet")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {t("petDocuments.title")} · {petName || t("petDocuments.petFallback")}
        </Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#4361ee" />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{t("petDocuments.hint")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4361ee" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("petDocuments.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.docTitle}>{item.title}</Text>
              <Text style={styles.url}>{item.file_url}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("petDocuments.addDocument")}</Text>
            <TextInput placeholder={t("petDocuments.titlePh")} style={styles.inp} value={title} onChangeText={setTitle} />
            <TextInput
              placeholder={t("petDocuments.fileUrlPh")}
              style={styles.inp}
              value={fileUrl}
              onChangeText={setFileUrl}
              autoCapitalize="none"
            />
            <TextInput placeholder={t("petDocuments.notesPh")} style={styles.inp} value={notes} onChangeText={setNotes} />
            <View style={[styles.sheetRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
                <Text style={styles.cancelTxt}>{t("userProfile.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.go} disabled={saving} onPress={() => void save()}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.goTxt}>{t("userProfile.save")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  bad: { padding: 24, textAlign: "center", color: "#b91c1c" },
  header: { alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  addBn: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: "#0f172a" },
  hint: { paddingHorizontal: 18, paddingBottom: 10, fontSize: 12, color: "#64748b" },
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
  url: { marginTop: 6, fontSize: 12, color: "#4361ee" },
  notes: { marginTop: 8, fontSize: 13, color: "#475569" },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
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
  sheetRow: { marginTop: 12, gap: 12, justifyContent: "flex-end" },
  cancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelTxt: { fontWeight: "700", color: "#64748b" },
  go: {
    backgroundColor: "#4361ee",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  goTxt: { color: "#fff", fontWeight: "800" },
});
