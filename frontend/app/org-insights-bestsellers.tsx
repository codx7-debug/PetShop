import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrgInsightsBestsellersScreen() {
  const { t } = useLanguage();
  const def = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 90);
    return { fromStr: from.toISOString().slice(0, 16), toStr: to.toISOString().slice(0, 16) };
  }, []);
  const [fromStr, setFromStr] = useState(def.fromStr);
  const [toStr, setToStr] = useState(def.toStr);
  const [loading, setLoading] = useState(false);
  const [rep, setRep] = useState<{
    services?: { service_title?: string; booking_count?: number; avg_price_cents?: number }[];
    retail_by_inventory_line?: { product_name?: string; qty_sold?: string | number; revenue_cents?: number }[];
    retail_manual_lines_aggregate?: { revenue_cents?: number; qty_sold?: string | number };
  } | null>(null);

  const fetchRep = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        from: new Date(fromStr).toISOString(),
        to: new Date(toStr).toISOString(),
      });
      const res = await fetch(`${API_BASE_URL}/api/org/insights/bestsellers?${q}`, { headers: await getAuthHeaders(false) });
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
        <Text style={styles.title}>{t("orgInsightsBestsellers.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void fetchRep()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <TextInput style={styles.inp} value={fromStr} onChangeText={setFromStr} />
        <TextInput style={styles.inp} value={toStr} onChangeText={setToStr} />
        <TouchableOpacity style={styles.btn} disabled={loading} onPress={() => void fetchRep()}>
          <Text style={styles.btnTxt}>{loading ? "…" : t("orgInsightsBestsellers.refresh")}</Text>
        </TouchableOpacity>

        <Text style={styles.sec}>{t("orgInsightsBestsellers.servicesByBookings")}</Text>
        {(rep?.services || []).map((s, i) => (
          <View key={`s${i}`} style={styles.row}>
            <Text style={styles.rowL}>{s.service_title}</Text>
            <Text style={styles.rowV}>{s.booking_count} · {t("orgInsightsBestsellers.avg")} {formatCents(Number(s.avg_price_cents))}</Text>
          </View>
        ))}

        <Text style={[styles.sec, { marginTop: 22 }]}>{t("orgInsightsBestsellers.retailTracked")}</Text>
        {(rep?.retail_by_inventory_line || []).map((r, i) => (
          <View key={`r${i}`} style={styles.row}>
            <Text style={styles.rowL}>{r.product_name}</Text>
            <Text style={styles.rowV}>
              {t("orgInsightsBestsellers.qty")} {String(r.qty_sold)} · {formatCents(Number(r.revenue_cents))}
            </Text>
          </View>
        ))}

        {rep?.retail_manual_lines_aggregate ? (
          <Text style={styles.meta}>
            {t("orgInsightsBestsellers.adHoc")}: {formatCents(Number(rep.retail_manual_lines_aggregate.revenue_cents))} · {t("orgInsightsBestsellers.qty")}{" "}
            {String(rep.retail_manual_lines_aggregate.qty_sold)}
          </Text>
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
  sec: { fontWeight: "900", color: "#475569", marginBottom: 8 },
  row: { flexDirection: "column", gap: 4, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowL: { fontWeight: "700", color: "#0f172a", flexShrink: 1 },
  rowV: { fontWeight: "600", color: "#334155", fontSize: 13 },
  meta: { marginTop: 16, fontSize: 12, color: "#64748b" },
});
