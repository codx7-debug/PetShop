import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL } from "../lib/api";

type ReportRow = {
  id: number;
  title?: string | null;
  summary: string;
  resolved_at?: string;
  address_text?: string | null;
};

export default function ReportsFeedScreen() {
  const { t, isRTL } = useLanguage();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports?limit=80`);
      const data = (await res.json()) as { reports?: ReportRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setRows(data.reports || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f3d3a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("reportsFeed.title")}</Text>
          <Text style={styles.sub}>{t("reportsFeed.subtitle")}</Text>
        </View>
      </View>
      <Text style={styles.hint}>{t("reportsFeed.resolvedHint")}</Text>

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {loading && rows.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2B9B7A" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || `#${item.id}`}</Text>
              <Text style={styles.badge}>{t("reportsFeed.summaryLabel")}</Text>
              <Text style={styles.desc} numberOfLines={8}>
                {item.summary}
              </Text>
              {item.address_text ? <Text style={styles.meta}>{item.address_text}</Text> : null}
              {item.resolved_at ? (
                <Text style={styles.metaFine}>
                  {new Date(item.resolved_at).toLocaleString()}
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{t("reportsFeed.empty")}</Text> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F5F9" },
  header: { paddingHorizontal: 12, paddingVertical: 8, alignItems: "flex-start" },
  back: { padding: 8, marginTop: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#0a2540" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  hint: { fontSize: 12, color: "#475569", paddingHorizontal: 16, marginBottom: 6, lineHeight: 17 },
  err: { color: "#b91c1c", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  desc: { fontSize: 14, color: "#334155", marginTop: 10, lineHeight: 20 },
  meta: { fontSize: 12, color: "#64748b", marginTop: 8 },
  metaFine: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 40 },
});
