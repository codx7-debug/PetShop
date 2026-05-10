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

type StaffRow = {
  user_id?: number;
  full_name?: string | null;
  bookings_attributed?: number;
  attributed_service_value_cents?: number;
  commission_rate_bp?: number;
  commission_cents_estimate?: number;
  booking_flat_bonus_cents?: number;
  total_bonus_estimate_cents?: number;
};

export default function OrgInsightsBonusScreen() {
  const { t } = useLanguage();
  const def = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 30);
    return { fromStr: from.toISOString().slice(0, 16), toStr: to.toISOString().slice(0, 16) };
  }, []);
  const [fromStr, setFromStr] = useState(def.fromStr);
  const [toStr, setToStr] = useState(def.toStr);
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [perBookingTRY, setPerBookingTRY] = useState("0");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [disc, setDisc] = useState("");

  const fetchRep = async () => {
    setLoading(true);
    try {
      const cp = Number.parseFloat(commissionPercent.replace(",", "."));
      const flatCents = Math.round(Number.parseFloat(perBookingTRY.replace(",", ".")) * 100);

      const q = new URLSearchParams({
        from: new Date(fromStr).toISOString(),
        to: new Date(toStr).toISOString(),
      });
      if (Number.isFinite(cp)) q.set("commission_percent", String(cp));
      if (Number.isFinite(flatCents) && flatCents > 0) q.set("bonus_per_booking_cents", String(flatCents));

      const res = await fetch(`${API_BASE_URL}/api/org/insights/bonus-preview?${q}`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ report?: { staff?: StaffRow[]; disclaimer?: string } }>(res);
      if (p.ok) {
        setStaff(p.data?.report?.staff || []);
        setDisc(String(p.data?.report?.disclaimer || ""));
      } else setStaff([]);
    } catch {
      setStaff([]);
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
        <Text style={styles.title}>{t("orgInsightsBonus.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void fetchRep()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <TextInput style={styles.inp} value={fromStr} onChangeText={setFromStr} />
        <TextInput style={styles.inp} value={toStr} onChangeText={setToStr} />
        <Text style={styles.lab}>{t("orgInsightsBonus.commission")}</Text>
        <TextInput style={styles.inp} value={commissionPercent} onChangeText={setCommissionPercent} keyboardType="decimal-pad" />
        <Text style={styles.lab}>{t("orgInsightsBonus.flatBonus")}</Text>
        <TextInput style={styles.inp} value={perBookingTRY} onChangeText={setPerBookingTRY} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.btn} disabled={loading} onPress={() => void fetchRep()}>
          <Text style={styles.btnTxt}>{loading ? "…" : t("orgInsightsBonus.recalculate")}</Text>
        </TouchableOpacity>
        <Text style={styles.dis}>{disc}</Text>

        {staff.map((s) => (
          <View key={s.user_id} style={styles.card}>
            <Text style={styles.nm}>{s.full_name || `${t("orgInsightsBonus.user")} #${s.user_id}`}</Text>
            <Text style={styles.li}>{t("orgInsightsBonus.attributedBookings")}: {s.bookings_attributed}</Text>
            <Text style={styles.li}>{t("orgInsightsBonus.serviceValue")}: {formatCents(Number(s.attributed_service_value_cents))}</Text>
            <Text style={styles.li}>{t("orgInsightsBonus.commissionPart")}: {formatCents(Number(s.commission_cents_estimate))}</Text>
            <Text style={styles.li}>{t("orgInsightsBonus.bookingFlat")}: {formatCents(Number(s.booking_flat_bonus_cents))}</Text>
            <Text style={styles.tot}>{t("orgInsightsBonus.totalEst")} {formatCents(Number(s.total_bonus_estimate_cents))}</Text>
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
  title: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 16, color: "#1e40af" },
  pad: { padding: 18, paddingBottom: 48 },
  inp: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  lab: { fontWeight: "700", color: "#475569", marginBottom: 4, fontSize: 12 },
  btn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  dis: { fontSize: 11, color: "#64748b", marginBottom: 12, lineHeight: 16 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  nm: { fontWeight: "900", fontSize: 16, color: "#0f172a" },
  li: { marginTop: 6, color: "#334155", fontWeight: "600", fontSize: 13 },
  tot: { marginTop: 10, fontWeight: "900", color: "#15803d", fontSize: 15 },
});
