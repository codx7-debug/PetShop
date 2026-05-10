import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

const TILES = [
  { titleKey: "orgAccountingHub.statementTitle", subtitleKey: "orgAccountingHub.statementSub", icon: "receipt-outline" as const, path: "/org-accounting-statement" },
  { titleKey: "orgAccountingHub.ledgerTitle", subtitleKey: "orgAccountingHub.ledgerSub", icon: "calculator-outline" as const, path: "/org-accounting-ledger" },
  { titleKey: "orgAccountingHub.purchasesTitle", subtitleKey: "orgAccountingHub.purchasesSub", icon: "cart-outline" as const, path: "/org-accounting-purchases" },
  { titleKey: "orgAccountingHub.tillTitle", subtitleKey: "orgAccountingHub.tillSub", icon: "wallet-outline" as const, path: "/org-accounting-till" },
  { titleKey: "orgAccountingHub.salesTitle", subtitleKey: "orgAccountingHub.salesSub", icon: "trending-up-outline" as const, path: "/org-accounting-sales" },
  { titleKey: "orgAccountingHub.barcodeTitle", subtitleKey: "orgAccountingHub.barcodeSub", icon: "scan-outline" as const, path: "/org-accounting-barcode" },
  { titleKey: "orgAccountingHub.debtTitle", subtitleKey: "orgAccountingHub.debtSub", icon: "alert-circle-outline" as const, path: "/org-accounting-debt" },
] as const;

const BG = "#0f766e";

export default function OrgAccountingHubScreen() {
  const { t } = useLanguage();
  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headTitle}>{t("orgAccountingHub.title")}</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={styles.sub}>
          {t("orgAccountingHub.subtitle")}
        </Text>

        <ScrollView contentContainerStyle={styles.gridPad} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {TILES.map((tile) => (
              <TouchableOpacity key={tile.titleKey} style={styles.tile} activeOpacity={0.9} onPress={() => router.push(tile.path as Parameters<typeof router.push>[0])}>
                <View style={styles.tileTop}>
                  <Ionicons name={tile.icon} size={24} color="#064e3b" />
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
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 20,
    marginBottom: 14,
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
    minHeight: 108,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tileTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  tileTitle: { fontSize: 15, fontWeight: "800", color: "#064e3b" },
  tileSub: { marginTop: 4, fontSize: 12, color: "#64748b" },
});
