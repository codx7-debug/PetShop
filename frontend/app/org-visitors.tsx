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
  visitor_name?: string;
  checked_in_at?: string;
  purpose?: string | null;
  phone?: string | null;
};

export default function OrgVisitorsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/visitors`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ visitors?: Row[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.visitors || []);
    } catch {
      Alert.alert("", t("orgVisitors.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("", t("orgVisitors.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/visitors`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ visitor_name: name.trim(), phone: phone.trim(), purpose: purpose.trim() }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setName("");
      setPhone("");
      setPurpose("");
      void load();
    } catch {
      Alert.alert("", t("orgVisitors.saveError"));
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
        <Text style={styles.title}>{t("orgVisitors.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#0d9488" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgVisitors.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{String(item.visitor_name || "")}</Text>
              <Text style={styles.cardMeta}>
                {item.checked_in_at ? new Date(String(item.checked_in_at)).toLocaleString() : ""}
              </Text>
              {item.purpose ? <Text style={styles.cardPur}>{String(item.purpose)}</Text> : null}
              {item.phone ? <Text style={styles.cardPur}>{String(item.phone)}</Text> : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgVisitors.checkInVisitor")}</Text>
          <TextInput placeholder={t("orgVisitors.fullNamePh")} style={styles.inp} value={name} onChangeText={setName} />
          <TextInput placeholder={t("orgVisitors.phonePh")} style={styles.inp} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput placeholder={t("orgVisitors.purposePh")} style={styles.inp} value={purpose} onChangeText={setPurpose} />
          <View style={[styles.sheetRow, { marginTop: 16 }]}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setOpen(false)}>
              <Text style={{ fontWeight: "800", color: "#64748b" }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOk} onPress={() => void save()} disabled={saving}>
              {saving ? <ActivityIndicator /> : <Text style={{ color: "#fff", fontWeight: "900" }}>{t("orgVisitors.save")}</Text>}
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
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { padding: 4 },
  addBn: { marginLeft: "auto", padding: 4 },
  title: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 36 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  cardName: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  cardMeta: { fontSize: 12, color: "#64748b", marginTop: 4 },
  cardPur: { fontSize: 14, color: "#334155", marginTop: 8 },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 14, color: "#0f172a" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 14 },
  btnOk: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#0d9488",
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
});
