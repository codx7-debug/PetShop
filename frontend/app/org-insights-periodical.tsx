import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrgInsightsPeriodicalScreen() {
  const { t } = useLanguage();
  const def = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 30);
    return { fromStr: from.toISOString(), toStr: to.toISOString() };
  }, []);
  const [fromStr, setFromStr] = useState(def.fromStr.slice(0, 16));
  const [toStr, setToStr] = useState(def.toStr.slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [rep, setRep] = useState<Record<string, unknown> | null>(null);

  const fetchRep = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ from: new Date(fromStr).toISOString(), to: new Date(toStr).toISOString() });
      const res = await fetch(`${API_BASE_URL}/api/org/insights/periodical?${q}`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ report?: Record<string, unknown> }>(res);
      if (p.ok) setRep(p.data?.report || null);
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
        <Text style={styles.title}>{t("orgInsightsPeriodical.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void fetchRep()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.lab}>{t("orgInsightsPeriodical.from")}</Text>
        <TextInput style={styles.inp} value={fromStr} onChangeText={setFromStr} />
        <Text style={styles.lab}>{t("orgInsightsPeriodical.to")}</Text>
        <TextInput style={styles.inp} value={toStr} onChangeText={setToStr} />
        <TouchableOpacity style={styles.btn} disabled={loading} onPress={() => void fetchRep()}>
          <Text style={styles.btnTxt}>{loading ? "…" : t("orgInsightsPeriodical.run")}</Text>
        </TouchableOpacity>

        {rep ? (
          <View style={styles.box}>
            <Text style={styles.line}>{t("orgInsightsPeriodical.appointments")}: {String(rep.appointments_count ?? 0)}</Text>
            <Text style={styles.line}>{t("orgInsightsPeriodical.distinctCustomers")}: {String(rep.distinct_booking_customers ?? 0)}</Text>
            <Text style={styles.line}>{t("orgInsightsPeriodical.bookedValue")}: {formatCents(Number(rep.estimated_booked_service_value_cents))}</Text>
            <Text style={styles.line}>{t("orgInsightsPeriodical.retailSales")}: {formatCents(Number(rep.retail_sales_cents))}</Text>
            <Text style={styles.line}>{t("orgInsightsPeriodical.retailReceipts")}: {String(rep.retail_sale_count ?? 0)}</Text>
            <Text style={styles.line}>{t("orgInsightsPeriodical.purchaseSpend")}: {formatCents(Number(rep.purchase_spend_cents))}</Text>
          </View>
        ) : null}
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
  lab: { fontWeight: "700", color: "#475569", marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  btnTxt: { color: "#fff", fontWeight: "800" },
  box: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  line: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
});
