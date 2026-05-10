import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";
import { ServiceCardSkeleton } from "../components/ui/BookingSkeleton";

type ServiceRow = {
  id: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_cents?: number | null;
};

type PackageRow = {
  id: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_cents?: number | null;
};

function iconForOrgType(orgType: string): keyof typeof Ionicons.glyphMap {
  const k = orgType.trim().toLowerCase();
  if (k === "hotel") return "bed-outline";
  if (k === "salon") return "sparkles-outline";
  if (k === "rescue") return "heart-outline";
  if (k === "petshop") return "bag-handle-outline";
  if (k === "trainer") return "school-outline";
  if (k === "petsitter") return "home-outline";
  return "medkit-outline";
}

export default function BookServiceScreen() {
  const { t, isRTL } = useLanguage();
  const params = useLocalSearchParams<{ orgId: string; orgName?: string; orgType?: string }>();
  const { orgId, orgName, orgType: orgTypeParam } = params;
  const orgType = String(orgTypeParam || "vet").toLowerCase();
  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(
    async (fromPull?: boolean) => {
      if (!orgId) return;
      setErr("");
      if (fromPull) setRefreshing(true);
      else setLoading(true);
      try {
        const [svcRes, pkgRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/organizations/${orgId}/services`),
          fetch(`${API_BASE_URL}/api/organizations/${orgId}/packages`),
        ]);
        const svcData = (await svcRes.json()) as { services?: ServiceRow[]; error?: string };
        const pkgData = (await pkgRes.json()) as { packages?: PackageRow[]; error?: string };
        if (!svcRes.ok) throw new Error(svcData.error || svcRes.statusText);
        setRows(svcData.services || []);
        if (pkgRes.ok) setPackages(pkgData.packages || []);
        else setPackages([]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
        setRows([]);
        setPackages([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orgId]
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const rowDir = isRTL ? "row-reverse" : "row";
  const headerIcon = iconForOrgType(orgType);
  const showSkeleton = loading && rows.length === 0;

  const Header = (
    <>
      <View style={[styles.flowStepRow, { borderLeftColor: theme.accent, flexDirection: rowDir }]}>
        <View style={[styles.flowStepNum, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.flowStepNumTxt, { color: theme.accent }]}>2</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.flowStepTitle}>{t("browseServices.stepService")}</Text>
          <Text style={styles.flowStepSub}>{t("browseServices.stepServiceHint")}</Text>
        </View>
      </View>
      {!showSkeleton && packages.length > 0 ? (
        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.pkgSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("bookService.bundles")}</Text>
          {packages.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { borderLeftColor: "#7c3aed", marginBottom: 10 }]}
              activeOpacity={0.92}
              onPress={() =>
                router.push({
                  pathname: "/book-appointment",
                  params: {
                    packageId: String(p.id),
                    serviceTitle: p.title,
                    durationMinutes:
                      p.duration_minutes != null ? String(p.duration_minutes) : "60",
                    orgName: orgName || "",
                    orgType,
                    orgId: String(orgId),
                  },
                })
              }
            >
              <View style={[styles.cardTop, { flexDirection: rowDir }]}>
                <View style={[styles.cardIcon, { backgroundColor: "#f5f3ff" }]}>
                  <Ionicons name="layers-outline" size={22} color="#7c3aed" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  {p.price_cents != null ? (
                    <Text style={styles.chipMutedTxt}>
                      {t("bookService.priceLabel", { price: (p.price_cents / 100).toFixed(2) })}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.cardCta, { color: "#7c3aed" }]}>{t("bookService.book")}</Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.pkgSectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 8 }]}>
            {t("bookService.aLaCarte")}
          </Text>
        </View>
      ) : null}
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {showSkeleton ? (
        <View style={{ paddingTop: 10 }}>
          <ServiceCardSkeleton count={5} accentHue={theme.accent} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.shell}>
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity style={styles.heroReload} hitSlop={12} onPress={() => void load(true)}>
            <Ionicons name="refresh-outline" size={21} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroTextBlock}>
          <View style={[styles.heroTitleRow, { flexDirection: rowDir }]}>
            <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name={headerIcon} size={22} color="#fff" />
            </View>
            <Text style={styles.kicker} numberOfLines={1}>{t(theme.kickerKey)}</Text>
          </View>
          <Text style={styles.orgHeadline} numberOfLines={2}>
            {orgName || t("bookService.fallbackOrg")}
          </Text>
          <Text style={styles.chooseTitle}>{t("bookService.chooseTitle")}</Text>
          <Text style={styles.helper}>{t("bookService.helper")}</Text>
        </View>
      </SafeAreaView>

      <FlatList
        style={styles.listFlex}
        data={showSkeleton ? [] : rows}
        keyExtractor={(s) => String(s.id)}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={8}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.sheet}>
            {Header}
          </View>
        }
        contentContainerStyle={[styles.sheetContent, rows.length === 0 && showSkeleton === false ? { flexGrow: 1 } : null]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !showSkeleton}
            onRefresh={() => void load(true)}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: theme.accent }]}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/book-appointment",
                params: {
                  serviceId: String(item.id),
                  serviceTitle: item.title,
                  durationMinutes: item.duration_minutes != null ? String(item.duration_minutes) : "60",
                  orgName: orgName || "",
                  orgType,
                  orgId: String(orgId),
                },
              })
            }
          >
            <View style={[styles.cardTop, { flexDirection: rowDir }]}>
              <View style={[styles.cardIcon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={headerIcon} size={22} color={theme.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={[styles.chips, { flexDirection: rowDir }]}>
                  {item.duration_minutes != null ? (
                    <View style={[styles.chip, { backgroundColor: theme.accentSoft }]}>
                      <Text style={[styles.chipTxt, { color: theme.accent }]}>
                        {t("bookService.durationMin", { n: item.duration_minutes })}
                      </Text>
                    </View>
                  ) : null}
                  {item.price_cents != null ? (
                    <View style={styles.chipMuted}>
                      <Text style={styles.chipMutedTxt}>
                        {t("bookService.priceLabel", {
                          price: (item.price_cents / 100).toFixed(2),
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={22} color="#94a3b8" />
            </View>
            <Text style={[styles.cardCta, { color: theme.accent }]}>{t("bookService.book")}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && rows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="list-outline" size={40} color="#94a3b8" />
              <Text style={styles.empty}>{t("bookService.noServices")}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f8fafc" },
  hero: { position: "absolute", left: 0, right: 0, top: 0, height: 226 },
  listFlex: { flex: 1 },
  sheetContent: { paddingHorizontal: 0, paddingBottom: 40 },
  safe: { zIndex: 1 },
  topBar: {
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "android" ? 4 : 0,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  topBarSpacer: { flex: 1, minWidth: 8 },
  heroReload: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroTextBlock: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 36 },
  heroTitleRow: { alignItems: "center", gap: 10, marginBottom: 6 },
  heroBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  kicker: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  orgHeadline: { fontSize: 26, fontWeight: "900", color: "#fff", marginTop: 6, letterSpacing: -0.5 },
  chooseTitle: { fontSize: 17, fontWeight: "900", color: "#fff", marginTop: 12 },
  helper: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    lineHeight: 19,
    maxWidth: "96%",
    fontWeight: "500",
  },
  sheet: {
    flex: 1,
    marginTop: -14,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingBottom: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(226,232,240,0.9)",
    minHeight: 120,
  },
  pkgSectionTitle: {
    marginHorizontal: 18,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  flowStepRow: {
    marginHorizontal: 18,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2f6",
    borderLeftWidth: 4,
    gap: 12,
    alignItems: "center",
  },
  flowStepNum: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  flowStepNumTxt: { fontSize: 17, fontWeight: "900" },
  flowStepTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  flowStepSub: { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 17, fontWeight: "500" },
  err: { color: "#b91c1c", paddingHorizontal: 20, marginBottom: 10, fontWeight: "700" },
  emptyWrap: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  empty: { textAlign: "center", color: "#64748b", fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 17,
    marginHorizontal: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2f6",
    borderLeftWidth: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardTop: { alignItems: "flex-start", gap: 12 },
  cardIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a", letterSpacing: -0.35 },
  cardDesc: { fontSize: 14, color: "#475569", marginTop: 6, lineHeight: 21 },
  chips: { flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipTxt: { fontSize: 12, fontWeight: "800" },
  chipMuted: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  chipMutedTxt: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  cardCta: { marginTop: 14, fontSize: 15, fontWeight: "900" },
});
