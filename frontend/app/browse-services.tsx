import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { OrgCardSkeleton } from "../components/ui/BookingSkeleton";

type OrgRow = {
  id: number;
  display_name: string;
  org_type: string;
  description?: string | null;
  city?: string | null;
  country?: string | null;
};

type OrgMini = { id: number; display_name: string; org_type: string };

const FILTER_IDS = new Set(["vet", "salon", "hotel", "rescue", "petshop", "trainer", "petsitter"]);

function normalizeOrgType(raw: string | undefined): string | null {
  if (typeof raw !== "string") return null;
  const k = raw.trim().toLowerCase();
  return FILTER_IDS.has(k) ? k : null;
}

function orgTypeIcon(kind: string): keyof typeof Ionicons.glyphMap {
  const k = String(kind).trim().toLowerCase();
  if (k === "hotel") return "bed-outline";
  if (k === "salon") return "sparkles-outline";
  if (k === "rescue") return "heart-outline";
  if (k === "petshop") return "bag-handle-outline";
  if (k === "trainer") return "school-outline";
  if (k === "petsitter") return "home-outline";
  return "medkit-outline";
}

function orgTypeAccent(kind: string): { bg: string; fg: string } {
  const k = String(kind).trim().toLowerCase();
  if (k === "hotel") return { bg: "#fff7ed", fg: "#c2410c" };
  if (k === "salon") return { bg: "#faf5ff", fg: "#7c3aed" };
  if (k === "rescue") return { bg: "#fef2f2", fg: "#dc2626" };
  if (k === "petshop") return { bg: "#ecfdf5", fg: "#15803d" };
  if (k === "trainer") return { bg: "#eef2ff", fg: "#4f46e5" };
  if (k === "petsitter") return { bg: "#f0fdfa", fg: "#0f766e" };
  return { bg: "#e0f7fa", fg: "#0d9488" };
}

export default function BrowseServicesScreen() {
  const { t, isRTL } = useLanguage();
  const params = useLocalSearchParams<{ orgType?: string }>();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [freeFilter, setFreeFilter] = useState<string | null>(null);
  const [catalogFavs, setCatalogFavs] = useState<OrgMini[]>([]);
  const [catalogRecent, setCatalogRecent] = useState<OrgMini[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const tok = await AsyncStorage.getItem("token");
          if (!tok) {
            if (!cancelled) {
              setCatalogFavs([]);
              setCatalogRecent([]);
            }
            return;
          }
          const [fRes, rRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/me/catalog/favorites`, { headers: await getAuthHeaders(false) }),
            fetch(`${API_BASE_URL}/api/me/catalog/recent`, { headers: await getAuthHeaders(false) }),
          ]);
          const fParsed = await parseResponseJson<{ organizations?: OrgMini[] }>(fRes);
          const rParsed = await parseResponseJson<{ organizations?: OrgMini[] }>(rRes);
          if (!cancelled && fParsed.ok && fParsed.data?.organizations)
            setCatalogFavs(fParsed.data.organizations);
          else if (!cancelled && !fRes.ok) setCatalogFavs([]);
          if (!cancelled && rParsed.ok && rParsed.data?.organizations)
            setCatalogRecent(rParsed.data.organizations);
          else if (!cancelled && !rRes.ok) setCatalogRecent([]);
        } catch {
          if (!cancelled) {
            setCatalogFavs([]);
            setCatalogRecent([]);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const categoryLock = useMemo(() => normalizeOrgType(params.orgType), [params.orgType]);
  const effectiveFilter = categoryLock ?? freeFilter;

  const load = useCallback(
    async (fromPull?: boolean) => {
      setErr("");
      if (fromPull) setRefreshing(true);
      else setLoading(true);
      try {
        const q = effectiveFilter ? `?orgType=${encodeURIComponent(effectiveFilter)}` : "";
        const res = await fetch(`${API_BASE_URL}/api/organizations${q}`);
        const data = (await res.json()) as { organizations?: OrgRow[]; error?: string };
        if (!res.ok) throw new Error(data.error || res.statusText);
        setOrgs(data.organizations || []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("login.errGeneric"));
        setOrgs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [effectiveFilter, t]
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const chips = useMemo(
    () => [
      { id: null as string | null, label: t("browseServices.filterAll") },
      { id: "vet", label: t("browseServices.filterVet") },
      { id: "salon", label: t("browseServices.filterSalon") },
      { id: "hotel", label: t("browseServices.filterHotel") },
      { id: "rescue", label: t("browseServices.filterRescue") },
      { id: "petshop", label: t("browseServices.filterPetshop") },
      { id: "trainer", label: t("browseServices.filterTrainer") },
      { id: "petsitter", label: t("browseServices.filterPetsitter") },
    ],
    [t]
  );

  const filterLabel = useMemo(() => {
    if (!effectiveFilter) return null;
    const keys: Record<string, string> = {
      salon: "browseServices.filterSalon",
      vet: "browseServices.filterVet",
      hotel: "browseServices.filterHotel",
      rescue: "browseServices.filterRescue",
      petshop: "browseServices.filterPetshop",
      trainer: "browseServices.filterTrainer",
      petsitter: "browseServices.filterPetsitter",
    };
    const k = keys[effectiveFilter];
    return k ? t(k) : null;
  }, [effectiveFilter, t]);

  const listHead = useMemo(() => {
    const keys: Record<string, string> = {
      salon: "browseServices.listTitleSalon",
      vet: "browseServices.listTitleVet",
      hotel: "browseServices.listTitleHotel",
      rescue: "browseServices.listTitleRescue",
      petshop: "browseServices.listTitlePetshop",
      trainer: "browseServices.listTitleTrainer",
      petsitter: "browseServices.listTitlePetsitter",
    };
    if (!effectiveFilter) return t("browseServices.listTitleAll");
    const k = keys[effectiveFilter];
    return k ? t(k) : t("browseServices.listTitleAll");
  }, [effectiveFilter, t]);

  const visibleOrgs = useMemo(() => {
    if (!effectiveFilter) return orgs;
    return orgs.filter((o) => String(o.org_type ?? "").trim().toLowerCase() === effectiveFilter);
  }, [orgs, effectiveFilter]);

  const showSkeleton = loading && visibleOrgs.length === 0;
  const flowHintTxt = useMemo(() => {
    const keys: Record<string, string> = {
      vet: "browseServices.flowHintVet",
      salon: "browseServices.flowHintSalon",
      hotel: "browseServices.flowHintHotel",
      rescue: "browseServices.flowHintRescue",
      petshop: "browseServices.flowHintPetshop",
      trainer: "browseServices.flowHintTrainer",
      petsitter: "browseServices.flowHintPetsitter",
    };
    if (!effectiveFilter) return t("browseServices.flowHint");
    const k = keys[effectiveFilter];
    return k ? t(k) : t("browseServices.flowHint");
  }, [effectiveFilter, t]);

  const Header = (
    <>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("browseServices.title")}</Text>
        <TouchableOpacity style={styles.reloadMini} hitSlop={12} onPress={() => void load(true)}>
          <Ionicons name="refresh-outline" size={21} color="#2B9B7A" />
        </TouchableOpacity>
      </View>

      <View style={[styles.flowStepBlock, { alignItems: isRTL ? "flex-end" : "flex-start", paddingHorizontal: 16 }]}>
        <Text style={[styles.flowStepBadge, { textAlign: isRTL ? "right" : "left" }]}>
          {t("browseServices.stepProviders")}
        </Text>
        <Text style={[styles.listHeadline, { textAlign: isRTL ? "right" : "left" }]}>{listHead}</Text>
      </View>

      {categoryLock ? (
        <View
          style={[
            styles.lockedBar,
            { flexDirection: isRTL ? "row-reverse" : "row", alignSelf: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={17} color="#0369a1" style={{ marginEnd: 8 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.lockedBadge, { textAlign: isRTL ? "right" : "left" }]}>
              {filterLabel ? t("browseServices.lockedBadge", { label: filterLabel }) : categoryLock}
            </Text>
            <Text style={[styles.lockedNote, { textAlign: isRTL ? "right" : "left" }]}>
              {t("browseServices.lockedCategoryNote")}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipsScroll, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        >
          {chips.map((c) => (
            <TouchableOpacity
              key={String(c.id)}
              style={[styles.chip, freeFilter === c.id && styles.chipOn]}
              onPress={() => setFreeFilter(c.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipTxt, freeFilter === c.id && styles.chipTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.flowHint, { textAlign: isRTL ? "right" : "left" }]}>{flowHintTxt}</Text>

      {(catalogFavs.length > 0 || catalogRecent.length > 0) && (
        <View style={{ marginBottom: 12 }}>
          {catalogFavs.length > 0 ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.subListTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("browseServices.favorites")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catMiniRow}>
                {catalogFavs.map((o) => (
                  <TouchableOpacity
                    key={`f-${o.id}`}
                    style={styles.catMiniChip}
                    onPress={() =>
                      router.push({
                        pathname: "/provider-profile",
                        params: { orgId: String(o.id), orgName: o.display_name, orgType: o.org_type || "" },
                      })
                    }
                  >
                    <Text style={styles.catMiniChipTxt} numberOfLines={1}>{o.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
          {catalogRecent.length > 0 ? (
            <View>
              <Text style={[styles.subListTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("browseServices.recentlyViewed")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catMiniRow}>
                {catalogRecent.map((o) => (
                  <TouchableOpacity
                    key={`r-${o.id}`}
                    style={styles.catMiniChipMuted}
                    onPress={() =>
                      router.push({
                        pathname: "/provider-profile",
                        params: { orgId: String(o.id), orgName: o.display_name, orgType: o.org_type || "" },
                      })
                    }
                  >
                    <Text style={styles.catMiniChipTxtMuted} numberOfLines={1}>{o.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      {err ? <Text style={styles.err}>{err}</Text> : null}
      {showSkeleton ? (
        <View style={{ paddingTop: 8 }}>
          <OrgCardSkeleton count={6} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#ecfdf8", "#f0fdfa", "#f8fafc"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <FlatList
          data={showSkeleton ? [] : visibleOrgs}
          style={styles.flex}
          keyExtractor={(o) => String(o.id)}
          initialNumToRender={10}
          maxToRenderPerBatch={14}
          windowSize={8}
          removeClippedSubviews
          ListHeaderComponent={Header}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing && !showSkeleton}
              onRefresh={() => void load(true)}
              tintColor="#2B9B7A"
              colors={["#2B9B7A"]}
            />
          }
          renderItem={({ item }) => {
            const acc = orgTypeAccent(item.org_type || "");
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/provider-profile",
                    params: {
                      orgId: String(item.id),
                      orgName: item.display_name,
                      orgType: item.org_type || "",
                    },
                  })
                }
              >
                <View style={[styles.cardTop, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[styles.iconBubble, { backgroundColor: acc.bg }]}>
                    <Ionicons name={orgTypeIcon(item.org_type)} size={22} color={acc.fg} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                    <Text style={[styles.cardMeta, { textAlign: isRTL ? "right" : "left" }]}>
                      {[item.city, item.country].filter(Boolean).join(" · ") || t("common.emDash")}
                    </Text>
                    {item.description ? (
                      <Text
                        style={[styles.cardDesc, { textAlign: isRTL ? "right" : "left" }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={[styles.cardCtaRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                      <Text style={styles.cardCta}>{t("browseServices.viewProfile")}</Text>
                      <Ionicons
                        name={isRTL ? "chevron-back" : "chevron-forward"}
                        size={18}
                        color="#2B9B7A"
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading && visibleOrgs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="sparkles-outline" size={42} color="#94a3b8" />
                <Text style={styles.empty}>{t("browseServices.empty")}</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "transparent" },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  header: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  reloadMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "900", color: "#0f172a" },
  flowStepBlock: { marginBottom: 6 },
  flowStepBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2B9B7A",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  listHeadline: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  lockedBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(224,242,254,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#bae6fd",
    gap: 10,
    alignItems: "flex-start",
    maxWidth: "100%",
  },
  lockedBadge: { fontSize: 14, fontWeight: "900", color: "#0c4a6e" },
  lockedNote: { fontSize: 12, color: "#0369a1", marginTop: 6, lineHeight: 17 },
  chipsScroll: { flexGrow: 0, gap: 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: "center" },
  chips: { flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dfe7ee",
    shadowColor: "#64748b",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chipOn: {
    backgroundColor: "#11a884",
    borderColor: "#0d9488",
    shadowOpacity: 0.12,
  },
  chipTxt: { fontSize: 13, fontWeight: "700", color: "#334155" },
  chipTxtOn: { color: "#fff" },
  flowHint: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 19,
    paddingHorizontal: 18,
    marginBottom: 12,
    fontWeight: "500",
  },
  subListTitle: {
    paddingHorizontal: 18,
    fontSize: 12,
    fontWeight: "900",
    color: "#0f766e",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  catMiniRow: { gap: 8, paddingHorizontal: 18 },
  catMiniChip: {
    maxWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#2B9B7A",
    marginEnd: 4,
  },
  catMiniChipTxt: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  catMiniChipMuted: {
    maxWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cbd5e1",
    marginEnd: 4,
  },
  catMiniChipTxtMuted: { fontSize: 13, fontWeight: "700", color: "#475569" },
  err: {
    color: "#b91c1c",
    paddingHorizontal: 18,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2f6",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTop: { alignItems: "flex-start", gap: 14 },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  cardMeta: { fontSize: 12, fontWeight: "600", color: "#64748b", marginTop: 5 },
  cardDesc: { fontSize: 14, color: "#475569", marginTop: 8, lineHeight: 21 },
  cardCtaRow: { alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 12 },
  cardCta: { fontSize: 14, fontWeight: "800", color: "#0d9488" },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 24,
    gap: 14,
  },
  empty: { textAlign: "center", color: "#64748b", fontSize: 15, lineHeight: 22 },
});
