import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import BottomNavBar from "./bottomNavBar";
import { useLanguage } from "../contexts/LanguageContext";

export default function NotificationsScreen() {
  const { t, isRTL } = useLanguage();
  const ta = {
    writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    textAlign: (isRTL ? "right" : "left") as "left" | "right",
  };

  const items = React.useMemo(
    () => [
      { id: "1", title: t("notifications.n1Title"), body: t("notifications.n1Body"), time: t("notifications.n1Time") },
      { id: "2", title: t("notifications.n2Title"), body: t("notifications.n2Body"), time: t("notifications.n2Time") },
      { id: "3", title: t("notifications.n3Title"), body: t("notifications.n3Body"), time: t("notifications.n3Time") },
    ],
    [t]
  );

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

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((row) => (
          <View key={row.id} style={styles.card}>
            <Text style={[styles.cardTitle, ta]}>{row.title}</Text>
            <Text style={[styles.cardBody, ta]}>{row.body}</Text>
            <Text style={[styles.cardTime, ta]}>{row.time}</Text>
          </View>
        ))}
      </ScrollView>

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
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#00695c", marginBottom: 6 },
  cardBody: { fontSize: 14, color: "#374151", lineHeight: 20, marginBottom: 8 },
  cardTime: { fontSize: 12, fontWeight: "600", color: "#4dd0e1" },
});
