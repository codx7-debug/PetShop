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

type Insp = {
  id: number;
  title?: string;
  findings: string;
  status?: string;
  pet_id?: number | null;
  appointment_id?: number | null;
  inspected_at?: string;
};

export default function OrgClinicInspectionsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Insp[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [findings, setFindings] = useState("");
  const [petId, setPetId] = useState("");
  const [apptId, setApptId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/inspections`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ inspections?: Insp[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.inspections || []);
    } catch {
      Alert.alert("", t("orgClinicInspections.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const f = findings.trim();
    const pRaw = petId.trim();
    const aRaw = apptId.trim();
    const pParsed = pRaw ? Number.parseInt(pRaw, 10) : NaN;
    const aParsed = aRaw ? Number.parseInt(aRaw, 10) : NaN;
    const hasP = Number.isFinite(pParsed);
    const hasA = Number.isFinite(aParsed);
    if (!f && !hasP && !hasA) {
      Alert.alert("", t("orgClinicInspections.validation"));
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        findings: f,
        title: title.trim() || undefined,
      };
      if (hasP) body.pet_id = pParsed;
      if (hasA) body.appointment_id = aParsed;
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/inspections`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setOpen(false);
      setTitle("");
      setFindings("");
      setPetId("");
      setApptId("");
      void load();
    } catch {
      Alert.alert("", t("orgClinicInspections.saveError"));
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
        <Text style={styles.title}>{t("orgClinicInspections.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#0f766e" />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{t("orgClinicInspections.hint")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgClinicInspections.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || t("orgClinicInspections.inspectionFallback")}</Text>
              <Text style={styles.meta}>
                {[item.status, item.inspected_at ? new Date(item.inspected_at).toLocaleString() : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {item.pet_id ? <Text style={styles.meta}>{t("orgClinicInspections.pet")} #{item.pet_id}</Text> : null}
              {item.appointment_id ? <Text style={styles.meta}>{t("orgClinicInspections.appointment")} #{item.appointment_id}</Text> : null}
              <Text style={styles.body}>{item.findings || "—"}</Text>
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgClinicInspections.logInspection")}</Text>
          <TextInput placeholder={t("orgClinicInspections.titlePh")} style={styles.inp} value={title} onChangeText={setTitle} />
          <TextInput
            placeholder={t("orgClinicInspections.findingsPh")}
            style={[styles.inp, styles.tall]}
            value={findings}
            onChangeText={setFindings}
            multiline
          />
          <TextInput placeholder={t("orgClinicInspections.petIdPh")} style={styles.inp} value={petId} onChangeText={setPetId} keyboardType="number-pad" />
          <TextInput
            placeholder={t("orgClinicInspections.appointmentIdPh")}
            style={styles.inp}
            value={apptId}
            onChangeText={setApptId}
            keyboardType="number-pad"
          />
          <View style={styles.sheetRow}>
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelTxt}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.go} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.goTxt}>{t("orgClinicInspections.save")}</Text>}
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
  hint: { paddingHorizontal: 18, paddingBottom: 10, fontSize: 12, color: "#64748b" },
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
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 12, color: "#64748b" },
  body: { marginTop: 10, fontSize: 14, color: "#334155", lineHeight: 20 },
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
  tall: { minHeight: 100, textAlignVertical: "top" },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
  cancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelTxt: { fontWeight: "700", color: "#64748b" },
  go: {
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  goTxt: { color: "#fff", fontWeight: "800" },
});
