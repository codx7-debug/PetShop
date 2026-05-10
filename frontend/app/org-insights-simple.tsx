import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

type Rep = Record<string, number>;

export default function OrgInsightsSimpleScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<Rep | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/insights/simple`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ report?: Rep }>(res);
      if (p.ok) setData((p.data?.report || {}) as Rep);
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInsightsSimple.title")}</Text>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
        contentContainerStyle={styles.pad}
      >
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : data ? (
          <>
            <Text style={styles.kicker}>{t("orgInsightsSimple.kicker")}</Text>
            <Row label={t("orgInsightsSimple.bookings7d")} value={String(data.bookings_last_7_days ?? 0)} />
            <Row label={t("orgInsightsSimple.bookings30d")} value={String(data.bookings_last_30_days ?? 0)} />
            <Row label={t("orgInsightsSimple.retail7d")} value={formatCents(data.retail_sales_cents_last_7_days)} accent />
            <Row label={t("orgInsightsSimple.retail30d")} value={formatCents(data.retail_sales_cents_last_30_days)} accent />
            <Row label={t("orgInsightsSimple.openReceivables")} value={formatCents(data.open_receivable_cents)} warn />
            <Row label={t("orgInsightsSimple.lowStock")} value={String(data.low_stock_item_count ?? 0)} />
            <Text style={styles.foot}>{t("orgInsightsSimple.updated")} {data.generated_at ? new Date(String(data.generated_at)).toLocaleString() : ""}</Text>
          </>
        ) : (
          <Text style={styles.empty}>{t("orgInsightsSimple.loadError")}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLab}>{label}</Text>
      <Text style={[styles.rowVal, accent && styles.rowAcc, warn && styles.rowWarn]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#1e40af" },
  pad: { padding: 18, paddingBottom: 48 },
  kicker: { fontWeight: "800", color: "#475569", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowLab: { flex: 1, color: "#334155", fontWeight: "600" },
  rowVal: { fontWeight: "800", color: "#0f172a" },
  rowAcc: { color: "#15803d" },
  rowWarn: { color: "#b45309" },
  foot: { marginTop: 18, fontSize: 11, color: "#94a3b8" },
  empty: { textAlign: "center", marginTop: 40, color: "#64748b" },
});
