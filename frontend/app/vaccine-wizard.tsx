import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

type Pet = { id: number; name?: string; species?: string | null };
type Sug = { vaccine_name: string; rationale?: string; hint_next_visit_months?: number };

export default function VaccineWizardScreen() {
  const { t } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petIdx, setPetIdx] = useState(0);
  const [ageMonths, setAgeMonths] = useState("12");
  const [suggestions, setSuggestions] = useState<Sug[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`${API_BASE_URL}/api/me/pets`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ pets?: Pet[] }>(res);
      if (parsed.ok && parsed.data?.pets?.length) setPets(parsed.data.pets);
    })();
  }, []);

  const run = async () => {
    const p = pets[petIdx];
    const species = p?.species || "dog";
    setLoading(true);
    try {
      const q = new URLSearchParams({ species, age_months: ageMonths.trim() || "12" });
      const res = await fetch(`${API_BASE_URL}/api/me/vaccine-wizard?${q}`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ suggestions?: Sug[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setSuggestions(parsed.data?.suggestions || []);
    } catch {
      Alert.alert("", t("vaccineWizard.loadSuggestionsError"));
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const addShot = async (s: Sug) => {
    const p = pets[petIdx];
    if (!p?.id) {
      Alert.alert("", t("vaccineWizard.addPetFirst"));
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets/${p.id}/vaccinations`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          vaccine_name: s.vaccine_name,
          administered_on: new Date().toISOString().slice(0, 10),
          notes: String(s.rationale || "").slice(0, 500),
          next_due_on: s.hint_next_visit_months
            ? (() => {
                const d = new Date();
                d.setMonth(d.getMonth() + Number(s.hint_next_visit_months));
                return d.toISOString().slice(0, 10);
              })()
            : null,
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      Alert.alert("", t("vaccineWizard.savedToLog"));
      router.push({ pathname: "/pet-vaccinations", params: { petId: String(p.id), petName: p.name || "" } });
    } catch {
      Alert.alert("", t("vaccineWizard.saveError"));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("vaccineWizard.title")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.disclaimer}>
          {t("vaccineWizard.disclaimer")}
        </Text>

        {pets.length === 0 ? (
          <Text style={styles.warn}>{t("vaccineWizard.noPets")}</Text>
        ) : (
          <>
            <Text style={styles.label}>{t("vaccineWizard.pet")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {pets.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, petIdx === i && styles.chipOn]}
                  onPress={() => setPetIdx(i)}
                >
                  <Text style={[styles.chipTx, petIdx === i && styles.chipTxOn]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t("vaccineWizard.ageMonths")}</Text>
            <TextInput style={styles.inp} value={ageMonths} onChangeText={setAgeMonths} keyboardType="number-pad" />

            <TouchableOpacity style={styles.btn} onPress={() => void run()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTx}>{t("vaccineWizard.getSuggestions")}</Text>}
            </TouchableOpacity>

            {suggestions.map((s, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.sn}>{s.vaccine_name}</Text>
                {s.rationale ? <Text style={styles.rt}>{s.rationale}</Text> : null}
                <TouchableOpacity style={styles.addOne} onPress={() => void addShot(s)}>
                  <Text style={styles.addOneTx}>{t("vaccineWizard.addToLog")}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "android" ? 8 : 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  pad: { padding: 16, paddingBottom: 40 },
  disclaimer: { fontSize: 12, color: "#92400e", backgroundColor: "#fffbeb", padding: 12, borderRadius: 12, marginBottom: 16 },
  warn: { color: "#64748b" },
  label: { fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  chips: { marginBottom: 16, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  chipOn: { backgroundColor: "#b45309" },
  chipTx: { fontWeight: "800", color: "#475569" },
  chipTxOn: { color: "#fff" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#b45309",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  btnTx: { color: "#fff", fontWeight: "900" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 12,
  },
  sn: { fontSize: 16, fontWeight: "900", color: "#92400e" },
  rt: { fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 18 },
  addOne: { marginTop: 12, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#fef3c7", borderRadius: 10 },
  addOneTx: { fontWeight: "900", color: "#92400e", fontSize: 13 },
});
