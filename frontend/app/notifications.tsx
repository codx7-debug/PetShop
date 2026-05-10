import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavBar from "./bottomNavBar";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type InboxRow = {
  id: number;
  title: string;
  body?: string | null;
  kind?: string;
  read_at?: string | null;
  created_at?: string;
};

export default function NotificationsScreen() {
  const { t, isRTL } = useLanguage();
  const ta = {
    writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    textAlign: (isRTL ? "right" : "left") as "left" | "right",
  };

  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (fromPull?: boolean) => {
      if (fromPull) setRefreshing(true);
      else setLoading(true);
      try {
        const tok = await AsyncStorage.getItem("token");
        if (!tok) {
          setRows([]);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/me/notifications`, { headers: await getAuthHeaders(false) });
        const parsed = await parseResponseJson<{ notifications?: InboxRow[] }>(res);
        setRows(parsed.ok && parsed.data?.notifications ? parsed.data.notifications : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const markRead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/notifications/${id}/read`, {
        method: "PATCH",
        headers: await getAuthHeaders(false),
      });
      if (res.ok) await load(true);
    } catch {
      /* */
    }
  };

  const backBtnBg = "#e0f2f1";
  const backBtnColor = "#279b8f";
  const backLabelColor = "#028383";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingTop: 8,
        }}
      >
        <Text
          onPress={() => router.back()}
          style={{
            backgroundColor: backBtnBg,
            borderRadius: 99,
            padding: 9,
            paddingRight: 13,
            paddingLeft: 8,
            fontSize: 19,
            color: backBtnColor,
          }}
          suppressHighlighting
        >
          {isRTL ? "›" : "‹"}
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "500",
            marginHorizontal: 4,
            color: backLabelColor,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("common.back")}
        </Text>
      </View>

      <Text style={[styles.pageTitle, ta]}>{t("notifications.title")}</Text>

      {loading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color="#036672" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#036672" />
          }
        >
          {rows.length === 0 ? (
            <Text style={[styles.empty, ta]}>{t("notifications.empty")}</Text>
          ) : (
            rows.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={[styles.card, !row.read_at && styles.cardUnread]}
                activeOpacity={0.9}
                onPress={() => void markRead(row.id)}
              >
                <Text style={[styles.cardTitle, ta]}>{row.title}</Text>
                {row.body ? <Text style={[styles.cardBody, ta]}>{row.body}</Text> : null}
                <Text style={[styles.cardTime, ta]}>
                  {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                  {row.kind ? ` · ${row.kind}` : ""}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#036672",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  empty: { color: "#64748b", paddingHorizontal: 8, lineHeight: 22, fontSize: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0f2f1",
    shadowColor: "#036672",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnread: { borderColor: "#80cbc4", backgroundColor: "#f0fdfa" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#00695c", marginBottom: 6 },
  cardBody: { fontSize: 14, color: "#374151", lineHeight: 20, marginBottom: 8 },
  cardTime: { fontSize: 12, fontWeight: "600", color: "#4dd0e1" },
});
