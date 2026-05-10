import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

type Row = {
  customer_user_id: number;
  full_name?: string | null;
  email?: string | null;
  last_at?: string;
  days_since_visit?: number | string;
};

export default function OrgInsightsDistancingScreen() {
  const { t } = useLanguage();
  const [days, setDays] = useState("90");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = Math.max(7, Number.parseInt(days, 10) || 90);
      const res = await fetch(`${API_BASE_URL}/api/org/insights/distancing?days=${d}`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ customers?: Row[] }>(res);
      if (p.ok) setRows(p.data?.customers || []);
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgInsightsDistancing.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void load()} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <View style={styles.filter}>
        <Text style={styles.fLab}>{t("orgInsightsDistancing.quietLongerThan")}</Text>
        <TextInput style={styles.fIn} value={days} onChangeText={setDays} keyboardType="number-pad" onSubmitEditing={() => void load()} />
        <Text style={styles.fSuf}>{t("orgInsightsDistancing.daysSinceVisit")}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(it) => String(it.customer_user_id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgInsightsDistancing.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.full_name || item.email || `#${item.customer_user_id}`}</Text>
              <Text style={styles.sub}>
                {t("orgInsightsDistancing.lastVisit")}: {item.last_at ? new Date(item.last_at).toLocaleDateString() : "—"} · ~
                {item.days_since_visit != null ? Math.floor(Number(item.days_since_visit)) : "?"} {t("orgInsightsDistancing.daysAgo")}
              </Text>
              <TouchableOpacity
                style={styles.stmt}
                onPress={() =>
                  router.push({
                    pathname: "/org-accounting-statement",
                    params: { customerUserId: String(item.customer_user_id) },
                  })
                }
              >
                <Text style={styles.stmtTxt}>{t("orgInsightsDistancing.openStatement")}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontWeight: "800", fontSize: 16, color: "#1e40af" },
  filter: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  fLab: { fontWeight: "700", color: "#475569" },
  fIn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    width: 64,
    textAlign: "center",
    borderRadius: 10,
    paddingVertical: 6,
    fontWeight: "800",
    backgroundColor: "#fff",
  },
  fSuf: { color: "#64748b", fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 28 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  name: { fontWeight: "800", color: "#0f172a", fontSize: 16 },
  sub: { marginTop: 6, color: "#475569", fontSize: 13 },
  stmt: { marginTop: 10 },
  stmtTxt: { fontWeight: "800", color: "#2563eb" },
});
