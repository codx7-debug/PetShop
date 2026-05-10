import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

type Row = {
  id: number;
  vaccine_name?: string;
  administered_on?: string;
  next_due_on?: string | null;
};

export default function PetVaccinationsScreen() {
  const { t } = useLanguage();
  const { petId, petName } = useLocalSearchParams<{ petId?: string; petName?: string }>();
  const pid = String(petId || "");
  const pname = String(petName || t("petVaccinations.petFallback"));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [vname, setVname] = useState("");
  const [admin, setAdmin] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets/${pid}/vaccinations`, {
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
  }, [pid]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!vname.trim() || !admin.trim()) return Alert.alert("", t("petVaccinations.fillNameDate"));
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets/${pid}/vaccinations`, {
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
      setVname("");
      setNextDue("");
      void load();
    } catch {
      Alert.alert("", t("petVaccinations.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pet-vaccinations/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      void load();
    } catch {
      Alert.alert("", t("petVaccinations.removeError"));
    }
  };

  if (!pid) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20 }}>{t("petVaccinations.missingPet")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {t("petVaccinations.title")} · {pname}
        </Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={{ padding: 4 }}>
          <Ionicons name="add-circle" size={30} color="#0d9488" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("petVaccinations.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.nm}>{String(item.vaccine_name || "")}</Text>
                <TouchableOpacity hitSlop={10} onPress={() => void del(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dt}>{t("petVaccinations.given")} {String(item.administered_on || "")}</Text>
              {item.next_due_on ? <Text style={styles.due}>{t("petVaccinations.due")} {String(item.next_due_on)}</Text> : null}
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.wizBtn} onPress={() => router.push("/vaccine-wizard")} activeOpacity={0.88}>
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.wizTx}>{t("petVaccinations.wizard")}</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("petVaccinations.addVaccination")}</Text>
            <TextInput placeholder={t("petVaccinations.vaccineNamePh")} style={styles.inp} value={vname} onChangeText={setVname} />
            <TextInput placeholder={t("petVaccinations.givenDatePh")} style={styles.inp} value={admin} onChangeText={setAdmin} />
            <TextInput placeholder={t("petVaccinations.nextDuePh")} style={styles.inp} value={nextDue} onChangeText={setNextDue} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.ghost} onPress={() => setOpen(false)}>
                <Text style={{ fontWeight: "800", color: "#64748b" }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ok} onPress={() => void save()} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "900" }}>{t("petVaccinations.save")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "android" ? 8 : 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { flex: 1, fontSize: 17, fontWeight: "900", color: "#0f172a" },
  list: { padding: 14, paddingBottom: 100 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 36 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccfbf1",
    marginBottom: 10,
  },
  nm: { fontSize: 16, fontWeight: "800", color: "#0f766e", flex: 1, paddingRight: 8 },
  dt: { fontSize: 13, color: "#64748b", marginTop: 6 },
  due: { fontSize: 13, fontWeight: "700", marginTop: 6 },
  wizBtn: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    borderRadius: 16,
    ...Platform.select({ ios: { shadowOpacity: 0.12, shadowRadius: 10 }, android: { elevation: 6 } }),
  },
  wizTx: { color: "#fff", fontWeight: "900", fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
    padding: 14,
    paddingBottom: 28,
  },
  sheet: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f0fdfa",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  ghost: { paddingVertical: 12, paddingHorizontal: 14 },
  ok: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#0d9488",
    borderRadius: 12,
    minWidth: 96,
    alignItems: "center",
  },
});
