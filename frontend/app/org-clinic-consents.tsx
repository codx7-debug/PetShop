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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Ledger = {
  id: number;
  user_id: number;
  channel?: string;
  opted_in: boolean;
  source?: string;
  recorded_at?: string;
  notes?: string | null;
  user_email?: string | null;
  user_full_name?: string | null;
};

export default function OrgClinicConsentsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [custId, setCustId] = useState("");
  const [notes, setNotes] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/consents`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ consents?: Ledger[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.consents || []);
    } catch {
      Alert.alert("", t("orgClinicConsents.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const idNum = Number.parseInt(custId.trim(), 10);
    if (!Number.isFinite(idNum)) {
      Alert.alert("", t("orgClinicConsents.customerRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/consents`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          customer_user_id: idNum,
          opted_in: optIn,
          channel: "commercial",
          source: "clinic_desk",
          notes: notes.trim() || null,
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setCustId("");
      setNotes("");
      setOptIn(true);
      void load();
    } catch {
      Alert.alert("", t("orgClinicConsents.saveError"));
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
        <Text style={styles.title}>{t("orgClinicConsents.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#7c3aed" />
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>
        {t("orgClinicConsents.disclaimer")}
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgClinicConsents.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.line}>
                {item.user_full_name || item.user_email || `User #${item.user_id}`}
              </Text>
              <Text style={styles.meta}>
                {item.opted_in ? t("orgClinicConsents.optedIn") : t("orgClinicConsents.optedOut")} · {item.channel || t("orgClinicConsents.commercial")}
              </Text>
              {item.source ? <Text style={styles.meta}>{item.source}</Text> : null}
              {item.recorded_at ? (
                <Text style={styles.meta}>{new Date(item.recorded_at).toLocaleString()}</Text>
              ) : null}
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgClinicConsents.recordConsent")}</Text>
          <Text style={styles.help}>{t("orgClinicConsents.help")}</Text>
          <TextInput
            placeholder={t("orgClinicConsents.customerIdPh")}
            style={styles.inp}
            value={custId}
            onChangeText={setCustId}
            keyboardType="number-pad"
          />
          <TextInput placeholder={t("orgClinicConsents.notesPh")} style={styles.inp} value={notes} onChangeText={setNotes} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLab}>{t("orgClinicConsents.commercialMessages")}</Text>
            <TouchableOpacity
              style={[styles.pill, optIn ? styles.pillOn : styles.pillOff]}
              onPress={() => setOptIn((v) => !v)}
            >
              <Text style={styles.pillTxt}>{optIn ? t("orgClinicConsents.allowed") : t("orgClinicConsents.declined")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetRow}>
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelTxt}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.go} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.goTxt}>{t("orgClinicConsents.save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  addBn: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  disclaimer: { paddingHorizontal: 18, paddingBottom: 10, fontSize: 12, color: "#64748b", lineHeight: 17 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  line: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 12, color: "#64748b" },
  notes: { marginTop: 8, fontSize: 13, color: "#475569" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  help: { fontSize: 12, color: "#64748b", marginBottom: 10 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 10,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toggleLab: { fontWeight: "700", color: "#334155" },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  pillOn: { backgroundColor: "#d1fae5" },
  pillOff: { backgroundColor: "#fee2e2" },
  pillTxt: { fontWeight: "800", color: "#0f172a" },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
  cancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelTxt: { fontWeight: "700", color: "#64748b" },
  go: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  goTxt: { color: "#fff", fontWeight: "800" },
});
