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
  pet_id?: number;
  pet_name?: string;
  vaccine_name?: string;
  administered_on?: string;
  next_due_on?: string | null;
};

export default function OrgVaccinationsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [petId, setPetId] = useState("");
  const [vname, setVname] = useState("");
  const [admin, setAdmin] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/vaccinations`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ vaccinations?: Row[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.vaccinations || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const pid = parseInt(petId, 10);
    if (!Number.isFinite(pid)) {
      Alert.alert("", t("orgVaccinations.validPetId"));
      return;
    }
    if (!vname.trim() || !admin.trim()) {
      Alert.alert("", t("orgVaccinations.nameDateRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/pets/${pid}/vaccinations`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          vaccine_name: vname.trim(),
          administered_on: admin.trim(),
          next_due_on: nextDue.trim() || null,
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setPetId("");
      setVname("");
      setNextDue("");
      void load();
    } catch {
      Alert.alert("", t("orgVaccinations.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgVaccinations.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={{ padding: 4 }}>
          <Ionicons name="add-circle" size={30} color="#dc2626" />
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>{t("orgVaccinations.subtitle")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgVaccinations.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{String(item.vaccine_name || "")}</Text>
              <Text style={styles.cardMeta}>
                {item.pet_name ? String(item.pet_name) : `${t("orgVaccinations.pet")} #${item.pet_id}`} · {t("orgVaccinations.given")} {String(item.administered_on || "")}
              </Text>
              {item.next_due_on ? <Text style={styles.due}>{t("orgVaccinations.nextDue")}: {String(item.next_due_on)}</Text> : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgVaccinations.recordVaccination")}</Text>
          <TextInput placeholder={t("orgVaccinations.petIdPh")} style={styles.inp} value={petId} onChangeText={setPetId} keyboardType="number-pad" />
          <TextInput placeholder={t("orgVaccinations.vaccineNamePh")} style={styles.inp} value={vname} onChangeText={setVname} />
          <TextInput placeholder={t("orgVaccinations.givenDatePh")} style={styles.inp} value={admin} onChangeText={setAdmin} />
          <TextInput placeholder={t("orgVaccinations.nextDuePh")} style={styles.inp} value={nextDue} onChangeText={setNextDue} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.ghost} onPress={() => setOpen(false)}>
              <Text style={{ fontWeight: "800", color: "#64748b" }}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} onPress={() => void save()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "900" }}>{t("orgVaccinations.save")}</Text>}
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
    gap: 8,
  },
  title: { flex: 1, fontSize: 17, fontWeight: "900", color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b", padding: 14, lineHeight: 17 },
  list: { paddingHorizontal: 14, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 32 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 10,
  },
  cardName: { fontSize: 16, fontWeight: "800", color: "#991b1b" },
  cardMeta: { fontSize: 13, color: "#64748b", marginTop: 6 },
  due: { fontSize: 13, fontWeight: "700", color: "#0f172a", marginTop: 8 },
  sheet: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff7ed",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
  ghost: { paddingVertical: 12, paddingHorizontal: 14 },
  ok: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    minWidth: 96,
    alignItems: "center",
  },
});
