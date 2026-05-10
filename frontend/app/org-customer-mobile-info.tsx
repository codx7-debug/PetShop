import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

export default function OrgCustomerMobileInfoScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgCustomerMobileInfo.title")}</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.p}>
          {t("orgCustomerMobileInfo.body1a")} <Text style={styles.bold}>{t("orgCustomerMobileInfo.userRole")}</Text>
          {t("orgCustomerMobileInfo.body1b")}
        </Text>
        <Text style={styles.section}>{t("orgCustomerMobileInfo.section")}</Text>
        <Text style={styles.bullet}>{t("orgCustomerMobileInfo.bullet1")}</Text>
        <Text style={styles.bullet}>{t("orgCustomerMobileInfo.bullet2")}</Text>
        <Text style={styles.bullet}>{t("orgCustomerMobileInfo.bullet3")}</Text>
        <Text style={styles.small}>
          {t("orgCustomerMobileInfo.footnote")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  pad: { paddingHorizontal: 20, paddingBottom: 40 },
  p: { fontSize: 15, lineHeight: 22, color: "#334155", marginBottom: 16 },
  bold: { fontWeight: "800", color: "#0f172a" },
  section: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginBottom: 10,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  small: { marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 18 },
});
