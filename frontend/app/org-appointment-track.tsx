import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

type Appt = {
  id: number;
  starts_at: string;
  ends_at: string;
  display_timezone?: string;
  pet_name?: string | null;
  service_title?: string | null;
  status?: string;
};

export default function OrgAppointmentTrackScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<"all" | "scheduled" | "cancelled">("all");

  const range = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 3);
    const to = new Date();
    to.setDate(to.getDate() + 21);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ from: range.from, to: range.to });
      if (chip !== "all") q.set("status", chip);
      const res = await fetch(`${API_BASE_URL}/api/org/appointments?${q}`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<Appt[]>(res);
      if (!parsed.ok || !Array.isArray(parsed.data)) throw new Error(t("orgAppointmentTrack.loadError"));
      setRows(parsed.data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, chip, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgAppointmentTrack.title")}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={styles.hint}>{t("orgAppointmentTrack.hint")}</Text>

      <View style={styles.chips}>
        {(["all", "scheduled", "cancelled"] as const).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, chip === c && styles.chipOn]}
            onPress={() => setChip(c)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipTx, chip === c && styles.chipTxOn]}>{t(`orgAppointmentTrack.status${c.charAt(0).toUpperCase()}${c.slice(1)}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 28 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgAppointmentTrack.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.when}>
                {new Date(item.starts_at).toLocaleString(undefined, {
                  timeZone: item.display_timezone || undefined,
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.svc}>{item.service_title || t("orgAppointmentTrack.serviceFallback")}</Text>
              <Text style={styles.pet}>{item.pet_name || "—"}</Text>
              <Text style={styles.st}>{t("orgAppointmentTrack.statusLabel")}: {item.status || "—"}</Text>
            </View>
          )}
        />
      )}
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
  title: { fontSize: 18, fontWeight: "900", color: "#0f172a", flexShrink: 1 },
  hint: { fontSize: 12, color: "#64748b", paddingHorizontal: 16, paddingTop: 8 },
  chips: { flexDirection: "row", gap: 8, padding: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  chipOn: { backgroundColor: "#059669" },
  chipTx: { fontWeight: "800", color: "#475569", textTransform: "capitalize", fontSize: 13 },
  chipTxOn: { color: "#fff" },
  list: { padding: 14, paddingBottom: 44 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 32 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 11,
  },
  when: { fontSize: 13, fontWeight: "900", color: "#047857" },
  svc: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginTop: 6 },
  pet: { fontSize: 14, color: "#64748b", marginTop: 4 },
  st: { fontSize: 12, color: "#94a3b8", marginTop: 10, textTransform: "capitalize" },
});
