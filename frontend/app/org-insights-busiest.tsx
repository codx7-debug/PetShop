import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OrgInsightsBusiestScreen() {
  const { t } = useLanguage();
  const def = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 30);
    return { fromStr: from.toISOString().slice(0, 16), toStr: to.toISOString().slice(0, 16) };
  }, []);
  const [fromStr, setFromStr] = useState(def.fromStr);
  const [toStr, setToStr] = useState(def.toStr);
  const [loading, setLoading] = useState(false);
  const [rep, setRep] = useState<{
    by_day_of_week?: { dow?: number; appointment_count?: number }[];
    by_hour_local?: { hour_local?: number; appointment_count?: number }[];
  } | null>(null);

  const fetchRep = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        from: new Date(fromStr).toISOString(),
        to: new Date(toStr).toISOString(),
      });
      const res = await fetch(`${API_BASE_URL}/api/org/insights/busiest?${q}`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ report?: typeof rep }>(res);
      if (p.ok) setRep(p.data?.report || null);
      else setRep(null);
    } catch {
      setRep(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchRep();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInsightsBusiest.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void fetchRep()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <TextInput style={styles.inp} value={fromStr} onChangeText={setFromStr} />
        <TextInput style={styles.inp} value={toStr} onChangeText={setToStr} />
        <TouchableOpacity style={styles.btn} disabled={loading} onPress={() => void fetchRep()}>
          <Text style={styles.btnTxt}>{loading ? "…" : t("orgInsightsBusiest.analyze")}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>{t("orgInsightsBusiest.byWeekday")}</Text>
        {(rep?.by_day_of_week || []).map((r, i) => (
          <View key={`d${i}`} style={styles.row}>
            <Text style={styles.rowL}>{r.dow != null ? DOW[r.dow] || `${t("orgInsightsBusiest.day")} ${r.dow}` : "—"}</Text>
            <Text style={styles.rowV}>{String(r.appointment_count ?? 0)}</Text>
          </View>
        ))}

        <Text style={[styles.section, { marginTop: 20 }]}>{t("orgInsightsBusiest.byHour")}</Text>
        {(rep?.by_hour_local || []).map((r, i) => (
          <View key={`h${i}`} style={styles.row}>
            <Text style={styles.rowL}>{r.hour_local != null ? `${r.hour_local}:00` : "—"}</Text>
            <Text style={styles.rowV}>{String(r.appointment_count ?? 0)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 17, color: "#1e40af" },
  pad: { padding: 18, paddingBottom: 44 },
  inp: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  section: { fontWeight: "900", color: "#475569", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowL: { color: "#334155", fontWeight: "600" },
  rowV: { fontWeight: "800", color: "#0f172a" },
});
