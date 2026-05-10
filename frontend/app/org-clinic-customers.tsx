import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

type Row = {
  customer_user_id: number;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  appointment_count?: number;
  last_booking_at?: string | null;
};

export default function OrgClinicCustomersScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/customers`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ customers?: Row[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.customers || []);
    } catch {
      Alert.alert("", t("orgClinicCustomers.loadError"));
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
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgClinicCustomers.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void load()} style={styles.reload}>
          <Ionicons name="refresh-outline" size={26} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.customer_user_id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgClinicCustomers.empty")}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: "/org-clinic-customer-docs",
                  params: {
                    customerUserId: String(item.customer_user_id),
                    customerName: String(item.full_name || item.email || t("orgClinicCustomers.customerFallback")),
                  },
                })
              }
            >
              <Text style={styles.name}>
                {item.full_name || item.email || `#${item.customer_user_id}`}{" "}
                <Text style={styles.idTag}>({t("orgClinicCustomers.user")} #{item.customer_user_id})</Text>
              </Text>
              {item.email ? <Text style={styles.sub}>{item.email}</Text> : null}
              {item.phone ? <Text style={styles.sub}>{item.phone}</Text> : null}
              <Text style={styles.meta}>
                {item.appointment_count != null ? `${item.appointment_count} ${t("orgClinicCustomers.bookings")}` : ""}
                {item.last_booking_at ? ` · ${t("orgClinicCustomers.last")} ${new Date(item.last_booking_at).toLocaleDateString()}` : ""}
              </Text>
              <Text style={styles.cta}>{t("orgClinicCustomers.documents")}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  reload: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  name: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  idTag: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  sub: { marginTop: 4, fontSize: 13, color: "#64748b" },
  meta: { marginTop: 8, fontSize: 12, color: "#94a3b8" },
  cta: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#2563eb" },
});
