import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrgInsightsAdvancedScreen() {
  const { t } = useLanguage();
  const [days, setDays] = useState("90");
  const [loading, setLoading] = useState(false);
  const [blob, setBlob] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ days: days || "90" });
      const res = await fetch(`${API_BASE_URL}/api/org/insights/advanced?${q}`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ report?: Record<string, unknown> }>(res);
      if (p.ok) setBlob(p.data?.report || null);
      else setBlob(null);
    } catch {
      setBlob(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void run();
  }, []);

  const sim = (blob?.simple_snapshot_extensions || {}) as Record<string, number>;
  const per = (blob?.periodical_summary || {}) as Record<string, unknown>;
  const busy = (blob?.busiest || {}) as { by_day_of_week?: { dow?: number; appointment_count?: number }[] };
  const best = (blob?.bestsellers_combo || {}) as { services?: { service_title?: string; booking_count?: number }[] };
  const dist = (blob?.inactive_customers || []) as { customer_user_id?: number; full_name?: string }[];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInsightsAdvanced.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void run()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.lab}>{t("orgInsightsAdvanced.idleDays")}</Text>
        <TextInput style={styles.inp} value={days} onChangeText={setDays} keyboardType="number-pad" />
        <TouchableOpacity style={styles.btn} disabled={loading} onPress={() => void run()}>
          <Text style={styles.btnTxt}>{loading ? t("orgInsightsAdvanced.loading") : t("orgInsightsAdvanced.reload")}</Text>
        </TouchableOpacity>

        <Text style={styles.blockTit}>{t("orgInsightsAdvanced.simpleSnapshot")}</Text>
        <Text style={styles.mono}>
          {t("orgInsightsAdvanced.bookings7d")}: {sim.bookings_last_7_days ?? 0} · 30d: {sim.bookings_last_30_days ?? 0}
        </Text>
        <Text style={styles.mono}>{t("orgInsightsAdvanced.retail7d")}: {formatCents(sim.retail_sales_cents_last_7_days)}</Text>
        <Text style={styles.mono}>{t("orgInsightsAdvanced.arOpen")}: {formatCents(sim.open_receivable_cents)}</Text>

        <Text style={styles.blockTit}>{t("orgInsightsAdvanced.periodical")}</Text>
        <Text style={styles.mono}>{t("orgInsightsAdvanced.appts")}: {String(per.appointments_count ?? "—")}</Text>
        <Text style={styles.mono}>{t("orgInsightsAdvanced.retail")}: {formatCents(Number(per.retail_sales_cents ?? 0))}</Text>

        <Text style={styles.blockTit}>{t("orgInsightsAdvanced.topWeekdays")}</Text>
        {(busy.by_day_of_week || []).slice(0, 5).map((x, i) => (
          <Text key={`b${i}`} style={styles.mono}>
            DOW {String(x.dow)}: {x.appointment_count} {t("orgInsightsAdvanced.visits")}
          </Text>
        ))}

        <Text style={styles.blockTit}>{t("orgInsightsAdvanced.topServices")}</Text>
        {(best.services || []).slice(0, 5).map((s, i) => (
          <Text key={`s${i}`} style={styles.mono}>
            {(s.service_title || "").slice(0, 40)} … {s.booking_count} {t("orgInsightsAdvanced.bookings")}
          </Text>
        ))}

        <Text style={styles.blockTit}>{t("orgInsightsAdvanced.sampleIdle")} ({dist?.length ?? 0})</Text>
        {(dist || []).slice(0, 6).map((c) => (
          <Text key={c.customer_user_id} style={styles.mono}>
            {c.full_name || `#${c.customer_user_id}`}
          </Text>
        ))}

        <Text style={styles.foot}>{t("orgInsightsAdvanced.foot")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 16, color: "#1e40af" },
  pad: { padding: 18, paddingBottom: 48 },
  lab: { fontWeight: "700", color: "#475569", marginBottom: 4 },
  inp: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#1e40af",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  blockTit: { marginTop: 16, marginBottom: 8, fontWeight: "900", color: "#0f172a" },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace", default: undefined }), fontSize: 12, color: "#334155", marginBottom: 4 },
  foot: { marginTop: 24, fontSize: 11, color: "#94a3b8", lineHeight: 17 },
});
