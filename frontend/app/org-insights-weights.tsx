import React, { useCallback, useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Patient = {
  pet_id: number;
  pet_name: string | null;
  owner_name?: string | null;
};

type W = { id: number; weight_kg: string | number; recorded_at?: string; notes?: string | null };

export default function OrgInsightsWeightsScreen() {
  const { t } = useLanguage();
  const { petId: qPet } = useLocalSearchParams<{ petId?: string }>();
  const initialPet = useMemo(() => Number.parseInt(String(qPet || ""), 10), [qPet]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [sel, setSel] = useState<Patient | null>(null);
  const [weights, setWeights] = useState<W[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingW, setLoadingW] = useState(false);
  const [modal, setModal] = useState(false);
  const [kg, setKg] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/patients`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ patients?: Patient[] }>(res);
      if (p.ok) {
        const list = p.data?.patients || [];
        setPatients(list);
        if (Number.isFinite(initialPet)) {
          const pick = list.find((x) => x.pet_id === initialPet);
          if (pick) setSel(pick);
        }
      }
    } catch {
      setPatients([]);
    } finally {
      setLoadingP(false);
    }
  }, [initialPet]);

  const loadWeights = useCallback(async (petId: number) => {
    setLoadingW(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/pets/${petId}/weights`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ weights?: W[] }>(res);
      if (p.ok) setWeights(p.data?.weights || []);
      else setWeights([]);
    } catch {
      setWeights([]);
    } finally {
      setLoadingW(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  React.useEffect(() => {
    if (sel) void loadWeights(sel.pet_id);
    else setWeights([]);
  }, [sel, loadWeights]);

  const save = async () => {
    if (!sel) return;
    const w = Number.parseFloat(kg.replace(",", "."));
    if (!(w > 0)) {
      Alert.alert("", t("orgInsightsWeights.enterWeight"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/pets/${sel.pet_id}/weights`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ weight_kg: w, notes: notes.trim() || null }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setModal(false);
      setKg("");
      setNotes("");
      void loadWeights(sel.pet_id);
    } catch {
      Alert.alert("", t("orgInsightsWeights.saveError"));
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
        <Text style={styles.title}>{t("orgInsightsWeights.title")}</Text>
        <TouchableOpacity hitSlop={12} disabled={!sel} onPress={() => setModal(true)} style={{ padding: 8, opacity: sel ? 1 : 0.3 }}>
          <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sub}>{t("orgInsightsWeights.subtitle")}</Text>

      {loadingP ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          horizontal
          data={patients}
          keyExtractor={(p) => String(p.pet_id)}
          contentContainerStyle={styles.chips}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, sel?.pet_id === item.pet_id && styles.chipOn]}
              onPress={() => setSel(item)}
            >
              <Text style={[styles.chipTxt, sel?.pet_id === item.pet_id && styles.chipTxtOn]}>
                {item.pet_name || `Pet ${item.pet_id}`}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {sel ? (
        loadingW ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={weights}
            keyExtractor={(w) => String(w.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t("orgInsightsWeights.empty")}</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.kg}>{Number(item.weight_kg).toFixed(2)} kg</Text>
                <Text style={styles.dt}>{item.recorded_at ? new Date(item.recorded_at).toLocaleString() : ""}</Text>
                {item.notes ? <Text style={styles.nt}>{item.notes}</Text> : null}
              </View>
            )}
          />
        )
      ) : (
        <Text style={styles.empty}>{t("orgInsightsWeights.choosePet")}</Text>
      )}

      <OrgKeyboardModalSheet visible={modal} onRequestClose={() => setModal(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgInsightsWeights.logWeight")} · {sel?.pet_name}</Text>
          <TextInput placeholder={t("orgInsightsWeights.weightPh")} keyboardType="decimal-pad" style={styles.inp} value={kg} onChangeText={setKg} />
          <TextInput placeholder={t("orgInsightsWeights.notesPh")} style={styles.inp} value={notes} onChangeText={setNotes} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16 }}>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cx}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okb} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okbTxt}>{t("orgInsightsWeights.save")}</Text>}
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
  sub: { paddingHorizontal: 16, color: "#64748b", marginBottom: 8, fontSize: 13 },
  chips: { paddingHorizontal: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
    marginVertical: 4,
  },
  chipOn: { backgroundColor: "#1e40af" },
  chipTxt: { fontWeight: "800", color: "#334155" },
  chipTxtOn: { color: "#fff" },
  list: { padding: 16, paddingBottom: 48 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 28 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kg: { fontWeight: "900", fontSize: 18, color: "#0f172a" },
  dt: { marginTop: 4, fontSize: 12, color: "#64748b" },
  nt: { marginTop: 8, fontSize: 13, color: "#475569" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  sheetTit: { fontWeight: "900", marginBottom: 12 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  cx: { fontWeight: "700", color: "#64748b", paddingVertical: 12 },
  okb: { backgroundColor: "#2563eb", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  okbTxt: { color: "#fff", fontWeight: "900" },
});
