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
  pet_id: number;
  pet_name: string | null;
  species?: string | null;
  breed?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  last_appointment_at?: string | null;
};

export default function OrgClinicPatientsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/patients`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ patients?: Row[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.patients || []);
    } catch {
      Alert.alert("", t("orgClinicPatients.loadError"));
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
        <Text style={styles.title}>{t("orgClinicPatients.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void load()} style={styles.reload}>
          <Ionicons name="refresh-outline" size={26} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{t("orgClinicPatients.hint")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.pet_id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgClinicPatients.empty")}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: "/org-clinic-pet-docs",
                  params: {
                    petId: String(item.pet_id),
                    petName: String(item.pet_name || t("orgClinicPatients.petFallback")),
                  },
                })
              }
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.pet_name || "—"}</Text>
                  <Text style={styles.sub}>
                    {[item.species, item.breed].filter(Boolean).join(" · ") || "—"}
                  </Text>
                  {item.owner_name ? (
                    <Text style={styles.owner}>{t("orgClinicPatients.parent")}: {item.owner_name}</Text>
                  ) : null}
                  {item.last_appointment_at ? (
                    <Text style={styles.date}>
                      {t("orgClinicPatients.lastVisit")}: {new Date(item.last_appointment_at).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="document-text-outline" size={22} color="#2563eb" />
              </View>
              <Text style={styles.cta}>{t("orgClinicPatients.openDocuments")}</Text>
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
  hint: { paddingHorizontal: 18, paddingBottom: 12, color: "#64748b", fontSize: 13 },
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
  sub: { marginTop: 4, fontSize: 13, color: "#64748b" },
  owner: { marginTop: 8, fontSize: 13, fontWeight: "600", color: "#334155" },
  date: { marginTop: 4, fontSize: 12, color: "#94a3b8" },
  cta: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#2563eb" },
});
