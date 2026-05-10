import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

const TILES = [
  { titleKey: "orgClinicHub.patientsTitle", subtitleKey: "orgClinicHub.patientsSub", icon: "paw-outline" as const, path: "/org-clinic-patients" },
  { titleKey: "orgClinicHub.customersTitle", subtitleKey: "orgClinicHub.customersSub", icon: "people-outline" as const, path: "/org-clinic-customers" },
  { titleKey: "orgClinicHub.consentTitle", subtitleKey: "orgClinicHub.consentSub", icon: "shield-checkmark-outline" as const, path: "/org-clinic-consents" },
  { titleKey: "orgClinicHub.inspectionsTitle", subtitleKey: "orgClinicHub.inspectionsSub", icon: "medkit-outline" as const, path: "/org-clinic-inspections" },
  { titleKey: "orgClinicHub.mobileAppTitle", subtitleKey: "orgClinicHub.mobileAppSub", icon: "phone-portrait-outline" as const, path: "/org-customer-mobile-info" },
] as const;

export default function OrgClinicHubScreen() {
  const { t } = useLanguage();
  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headTitle}>{t("orgClinicHub.title")}</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={styles.sub}>
          {t("orgClinicHub.subtitle")}
        </Text>

        <ScrollView contentContainerStyle={styles.gridPad} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {TILES.map((tile) => (
              <TouchableOpacity
                key={tile.titleKey}
                style={styles.tile}
                activeOpacity={0.9}
                onPress={() => router.push(tile.path as Parameters<typeof router.push>[0])}
              >
                <View style={styles.tileTop}>
                  <Ionicons name={tile.icon} size={24} color="#0f172a" />
                  <Ionicons name="open-outline" size={14} color="#94a3b8" />
                </View>
                <Text style={styles.tileTitle}>{t(tile.titleKey)}</Text>
                <Text style={styles.tileSub}>{t(tile.subtitleKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const BG = "#1d4ed8";

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  back: { padding: 8 },
  headTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#fff" },
  sub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  gridPad: { paddingHorizontal: 16, paddingBottom: 32 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  tile: {
    width: Platform.OS === "web" ? "48%" : "47.6%",
    minHeight: 110,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 4,
  },
  tileTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  tileTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  tileSub: { marginTop: 4, fontSize: 12, color: "#64748b" },
});
