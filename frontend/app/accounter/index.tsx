import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../../lib/api";
import { clearUserSession } from "../../lib/session";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageShortcutsBar } from "../../components/LanguageShortcutsBar";
import type { AppLocale } from "../../i18n/translations";

const C = {
  tealDeep: "#064e56",
  teal: "#0d6b6b",
  mint: "#2B9B7A",
  cream: "#f4faf8",
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  danger: "#dc2626",
};

type OrgRow = { id: number; display_name: string };

function formatMoneyCents(cents: number, loc: AppLocale) {
  const n = Number(cents) || 0;
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n / 100);
}

function formatDateTime(iso: string | null | undefined, loc: AppLocale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(loc, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

type DetailProps = { label: string; value: string; isRTL: boolean };
function DetailLine({ label, value, isRTL }: DetailProps) {
  const align = isRTL ? ("right" as const) : ("left" as const);
  return (
    <View style={[styles.detailLine, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
      <Text style={[styles.detailLabel, { textAlign: align }]}>{label}</Text>
      <Text style={[styles.detailValue, { textAlign: align }]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

type SectionProps = { title: string; isRTL: boolean; children: React.ReactNode };
function Section({ title, isRTL, children }: SectionProps) {
  const align = isRTL ? ("right" as const) : ("left" as const);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: align }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function AccounterDashboardScreen() {
  const { t, isRTL, locale, setLocale } = useLanguage();
  const rowDir = isRTL ? ("row-reverse" as const) : ("row" as const);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayEmail, setDisplayEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [windowDays, setWindowDays] = useState(30);
  const [orgIdFilter, setOrgIdFilter] = useState<number | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [orgModal, setOrgModal] = useState(false);

  const [summary, setSummary] = useState<{
    window_days?: number;
    organization_count?: number;
    retail_sales_cents_period?: number;
    purchase_spend_cents_period?: number;
    open_receivable_cents_total?: number;
  } | null>(null);
  const [sales, setSales] = useState<
    Array<{
      id: number;
      organization_name?: string;
      total_cents?: number;
      payment_method?: string | null;
      occurred_at?: string;
    }>
  >([]);
  const [purchases, setPurchases] = useState<
    Array<{
      id: number;
      organization_name?: string;
      vendor_name?: string | null;
      total_cents?: number;
      purchased_at?: string;
    }>
  >([]);
  const [receivables, setReceivables] = useState<
    Array<{ organization_name?: string; balance_cents?: number }>
  >([]);
  const [ledgerLines, setLedgerLines] = useState<
    Array<{
      organization_name?: string;
      flow?: string;
      amount_cents?: number;
      category_name?: string | null;
      line_at?: string;
    }>
  >([]);

  const selectedOrgLabel = useMemo(() => {
    if (orgIdFilter == null) return t("accounterDashboard.allOrgs");
    const o = orgs.find((x) => x.id === orgIdFilter);
    return o?.display_name || `#${orgIdFilter}`;
  }, [orgIdFilter, orgs, t]);

  const guardAndIdentity = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) {
      setAllowed(false);
      return;
    }
    try {
      const u = JSON.parse(raw) as { role?: string; email?: string };
      const role = String(u?.role ?? "")
        .trim()
        .toLowerCase();
      const ok = role === "accounter" || role === "admin";
      setAllowed(ok);
      setIsAdmin(role === "admin");
      setDisplayEmail(String(u?.email ?? ""));
      if (!ok) {
        router.replace({ pathname: "/login", params: { signInUser: "1" } });
      }
    } catch {
      setAllowed(false);
      router.replace({ pathname: "/login", params: { signInUser: "1" } });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void guardAndIdentity();
    }, [guardAndIdentity])
  );

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (allowed === false) return;
      setError("");
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const qh = async (path: string) => {
          const res = await fetch(`${API_BASE_URL}${path}`, { headers: await getAuthHeaders() });
          const parsed = await parseResponseJson<unknown>(res);
          if (res.status === 401 || res.status === 403) {
            await clearUserSession();
            router.replace({ pathname: "/login", params: { signInUser: "1" } });
            throw new Error("REAUTH");
          }
          if (!parsed.ok || parsed.data === null) {
            const snippet = parsed.bodySnippet?.slice(0, 120);
            throw new Error(
              snippet
                ? `${t("accounterDashboard.loadError")} (${res.status}${snippet ? ` — ${snippet}` : ""})`
                : t("accounterDashboard.loadError")
            );
          }
          return parsed.data as Record<string, unknown>;
        };

        const orgQ = orgIdFilter != null ? `&organization_id=${orgIdFilter}` : "";
        const [sum, s, p, recv, ledger, orgPack] = await Promise.all([
          qh(`/api/accounter/finance/summary?days=${windowDays}`),
          qh(`/api/accounter/finance/sales?limit=25${orgQ}`),
          qh(`/api/accounter/finance/purchases?limit=25${orgQ}`),
          qh(`/api/accounter/finance/receivables`),
          qh(`/api/accounter/finance/ledger-lines?limit=40`),
          qh(`/api/accounter/organizations`),
        ]);

        setSummary(sum as typeof summary);
        setSales(Array.isArray(s.sales) ? (s.sales as typeof sales) : []);
        setPurchases(Array.isArray(p.purchases) ? (p.purchases as typeof purchases) : []);
        setReceivables(Array.isArray(recv.receivables_by_org) ? (recv.receivables_by_org as typeof receivables) : []);
        setLedgerLines(Array.isArray(ledger.ledger_lines) ? (ledger.ledger_lines as typeof ledgerLines) : []);
        setOrgs(Array.isArray(orgPack.organizations) ? (orgPack.organizations as OrgRow[]) : []);
      } catch (e) {
        if (e instanceof Error && e.message === "REAUTH") {
          /* session cleared */
        } else if (e instanceof Error && e.message) setError(e.message);
        else setError(t("accounterDashboard.loadError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allowed, orgIdFilter, windowDays, t]
  );

  React.useEffect(() => {
    if (allowed === true) void load();
  }, [allowed, load]);

  const onRefresh = useCallback(() => void load({ refresh: true }), [load]);

  const signOut = useCallback(async () => {
    await clearUserSession();
    router.replace("/login");
  }, []);

  const textStart = isRTL ? ("right" as const) : ("left" as const);

  if (allowed === false) {
    return (
      <View style={styles.shell}>
        <SafeAreaView style={styles.safe}>
          <Text style={[styles.blocked, { textAlign: "center" }]}>{t("accounterDashboard.needRole")}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <LinearGradient colors={["#065f46", "#0d9488"]} style={styles.gradientBg} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <View style={[styles.heroBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <Text
              style={[styles.heroScreenTitle, { textAlign: textStart }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {t("accounterDashboard.title")}
            </Text>
            <Text style={[styles.heroSignedLabel, { textAlign: textStart }]} numberOfLines={2}>
              {t("accounterDashboard.signedInAs")}
            </Text>
            <Text style={[styles.heroEmail, { textAlign: textStart }]} numberOfLines={2}>
              {displayEmail || "—"}
            </Text>
            <Text
              style={[styles.heroBody, { textAlign: textStart }]}
              numberOfLines={4}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t("accounterDashboard.subtitle")}
            </Text>
            <Text style={[styles.heroNote, { textAlign: textStart }]} numberOfLines={3}>
              {t("accounterDashboard.readOnlyNote")}
            </Text>
          </View>
          <View
            style={[
              styles.actionsCol,
              isRTL ? { alignItems: "flex-start" } : { alignItems: "flex-end" },
            ]}
          >
            {isAdmin ? (
              <TouchableOpacity onPress={() => router.push("/admin-dashboard")} style={styles.pillMuted} activeOpacity={0.88}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.pillMutedText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                  {t("accounterDashboard.backAdmin")}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => void signOut()} style={styles.pillMuted} activeOpacity={0.88}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.pillMutedText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                {t("accounterDashboard.signOut")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <Text style={[styles.cardSectionTitle, { textAlign: textStart }]}>{t("settings.languageTitle")}</Text>
          <LanguageShortcutsBar variant="surface" locale={locale} onSelect={setLocale} isRTL={isRTL} />
          <View style={styles.langCardDivider} />
          <Text style={[styles.cardSectionTitle, { textAlign: textStart }]}>{t("accounterDashboard.summary")}</Text>
          <View style={[styles.dayChips, { flexDirection: rowDir }]}>
            {[7, 30, 90].map((d) => {
              const sel = windowDays === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setWindowDays(d)}
                  activeOpacity={0.88}
                  style={[styles.dayChip, sel && styles.dayChipSel]}
                >
                  <Text style={[styles.dayChipTxt, sel && styles.dayChipTxtSel]}>{t("accounterDashboard.days", { count: d })}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={[styles.orgPicker, { flexDirection: rowDir }]} onPress={() => setOrgModal(true)} activeOpacity={0.9}>
            <Ionicons name="business-outline" size={20} color={C.teal} />
            <View style={styles.orgPickerTextWrap}>
              <Text style={[styles.orgPickerLabel, { textAlign: textStart }]}>{t("accounterDashboard.orgFilter")}</Text>
              <Text style={[styles.orgPickerHint, { textAlign: textStart }]}>{t("accounterDashboard.orgFilterHint")}</Text>
              <Text style={[styles.orgPickerVal, { textAlign: textStart }]} numberOfLines={2}>
                {selectedOrgLabel}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color={C.mint} />
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mint} colors={[C.mint]} />
            }
          >
            {error ? (
              <View style={[styles.errorBanner, { flexDirection: rowDir }]}>
                <Ionicons name="warning-outline" size={22} color={C.danger} />
                <Text style={[styles.errorText, { textAlign: textStart }]}>{error}</Text>
              </View>
            ) : null}

            {summary ? (
              <View style={styles.metricGrid}>
                <View style={[styles.metric, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.metricLabel, { textAlign: textStart }]} numberOfLines={3}>
                    {t("accounterDashboard.periodRetail")}
                  </Text>
                  <Text style={styles.metricVal}>{formatMoneyCents(summary.retail_sales_cents_period ?? 0, locale)}</Text>
                </View>
                <View style={[styles.metric, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.metricLabel, { textAlign: textStart }]} numberOfLines={3}>
                    {t("accounterDashboard.periodPurchases")}
                  </Text>
                  <Text style={styles.metricVal}>{formatMoneyCents(summary.purchase_spend_cents_period ?? 0, locale)}</Text>
                </View>
                <View style={[styles.metric, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.metricLabel, { textAlign: textStart }]} numberOfLines={3}>
                    {t("accounterDashboard.openReceivables")}
                  </Text>
                  <Text style={styles.metricVal}>{formatMoneyCents(summary.open_receivable_cents_total ?? 0, locale)}</Text>
                </View>
                <View style={[styles.metric, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                  <Text style={[styles.metricLabel, { textAlign: textStart }]} numberOfLines={3}>
                    {t("accounterDashboard.platformOrganizations")}
                  </Text>
                  <Text style={styles.metricVal}>{String(summary.organization_count ?? 0)}</Text>
                  <Text style={[styles.metricCaption, { textAlign: textStart }]}>
                    {t("accounterDashboard.periodWindowHint", { count: summary.window_days ?? windowDays })}
                  </Text>
                </View>
              </View>
            ) : null}

            <Section title={t("accounterDashboard.recentSales")} isRTL={isRTL}>
              {sales.map((x) => (
                <View key={`s-${x.id}`} style={styles.lineCard}>
                  <View style={[styles.lineTop, { flexDirection: rowDir }]}>
                    <Text style={[styles.lineOrg, { textAlign: textStart }]} numberOfLines={2}>
                      {x.organization_name ?? "—"}
                    </Text>
                    <Text style={styles.lineAmt}>{formatMoneyCents(x.total_cents ?? 0, locale)}</Text>
                  </View>
                  <DetailLine label={t("accounterDashboard.date")} value={formatDateTime(x.occurred_at, locale)} isRTL={isRTL} />
                  <DetailLine
                    label={t("accounterDashboard.method")}
                    value={x.payment_method?.trim() ? String(x.payment_method) : "—"}
                    isRTL={isRTL}
                  />
                </View>
              ))}
            </Section>

            <Section title={t("accounterDashboard.recentPurchases")} isRTL={isRTL}>
              {purchases.map((x) => (
                <View key={`p-${x.id}`} style={styles.lineCard}>
                  <View style={[styles.lineTop, { flexDirection: rowDir }]}>
                    <Text style={[styles.lineOrg, { textAlign: textStart }]} numberOfLines={2}>
                      {x.organization_name ?? "—"}
                    </Text>
                    <Text style={styles.lineAmt}>{formatMoneyCents(x.total_cents ?? 0, locale)}</Text>
                  </View>
                  <DetailLine label={t("accounterDashboard.date")} value={formatDateTime(x.purchased_at, locale)} isRTL={isRTL} />
                  <DetailLine
                    label={t("accounterDashboard.vendor")}
                    value={x.vendor_name?.trim() ? String(x.vendor_name) : "—"}
                    isRTL={isRTL}
                  />
                </View>
              ))}
            </Section>

            <Section title={t("accounterDashboard.receivablesByOrg")} isRTL={isRTL}>
              {receivables.length === 0 ? (
                <Text style={[styles.emptyHint, { textAlign: textStart }]}>{t("accounterDashboard.emptyReceivables")}</Text>
              ) : (
                receivables.map((x, i) => (
                  <View key={`r-${i}`} style={styles.lineCard}>
                    <View style={[styles.lineTop, { flexDirection: rowDir }]}>
                      <Text style={[styles.lineOrg, { textAlign: textStart }]} numberOfLines={2}>
                        {x.organization_name ?? "—"}
                      </Text>
                      <Text style={styles.lineAmt}>{formatMoneyCents(x.balance_cents ?? 0, locale)}</Text>
                    </View>
                  </View>
                ))
              )}
            </Section>

            <Section title={t("accounterDashboard.recentLedger")} isRTL={isRTL}>
              {ledgerLines.map((x, i) => (
                <View key={`l-${i}`} style={styles.lineCard}>
                  <View style={[styles.lineTop, { flexDirection: rowDir }]}>
                    <Text style={[styles.lineOrg, { textAlign: textStart }]} numberOfLines={2}>
                      {x.organization_name ?? "—"}
                    </Text>
                    <Text style={styles.lineAmt}>{formatMoneyCents(x.amount_cents ?? 0, locale)}</Text>
                  </View>
                  <DetailLine label={t("accounterDashboard.date")} value={formatDateTime(x.line_at, locale)} isRTL={isRTL} />
                  <DetailLine label={t("accounterDashboard.flow")} value={x.flow?.trim() ? String(x.flow) : "—"} isRTL={isRTL} />
                  <DetailLine
                    label={t("accounterDashboard.category")}
                    value={x.category_name?.trim() ? String(x.category_name) : "—"}
                    isRTL={isRTL}
                  />
                </View>
              ))}
            </Section>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}

        <Modal animationType="fade" transparent visible={orgModal} onRequestClose={() => setOrgModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOrgModal(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { textAlign: textStart }]}>{t("accounterDashboard.orgFilter")}</Text>
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  style={[styles.modalRow, { flexDirection: rowDir }]}
                  onPress={() => {
                    setOrgIdFilter(null);
                    setOrgModal(false);
                  }}
                >
                  <Text style={[styles.modalRowText, { textAlign: textStart }]}>{t("accounterDashboard.allOrgs")}</Text>
                  {orgIdFilter == null ? <Ionicons name="checkmark" size={20} color={C.mint} /> : <View style={{ width: 20 }} />}
                </TouchableOpacity>
                {orgs.map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.modalRow, { flexDirection: rowDir }]}
                    onPress={() => {
                      setOrgIdFilter(o.id);
                      setOrgModal(false);
                    }}
                  >
                    <Text style={[styles.modalRowText, { textAlign: textStart }]} numberOfLines={2}>
                      {o.display_name}
                    </Text>
                    {orgIdFilter === o.id ? <Ionicons name="checkmark" size={20} color={C.mint} /> : <View style={{ width: 20 }} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalClose} onPress={() => setOrgModal(false)}>
                <Text style={styles.modalCloseText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: C.cream },
  gradientBg: { ...StyleSheet.absoluteFillObject, height: 220, opacity: 0.96 },
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 14,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  heroBlock: { flex: 1, minWidth: 0, flexShrink: 1 },
  heroScreenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    marginBottom: 10,
    width: "100%",
    flexShrink: 1,
  },
  heroSignedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
    width: "100%",
    flexShrink: 1,
  },
  heroEmail: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 22,
    marginBottom: 10,
    width: "100%",
    flexShrink: 1,
  },
  heroBody: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.92)",
    lineHeight: 21,
    marginBottom: 8,
    width: "100%",
    flexShrink: 1,
  },
  heroNote: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.78)",
    lineHeight: 19,
    width: "100%",
    flexShrink: 1,
  },
  actionsCol: { gap: 8, justifyContent: "flex-start", flexShrink: 0, alignSelf: "flex-start" },
  pillMuted: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  pillMutedText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    flexShrink: 1,
    minWidth: 0,
    flex: 1,
  },
  langCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.line,
    marginVertical: 14,
  },
  filtersCard: {
    marginHorizontal: 20,
    marginTop: -6,
    marginBottom: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: "#036672",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  dayChips: { gap: 8, marginBottom: 14, flexWrap: "wrap" },
  dayChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#f8fafc",
  },
  dayChipSel: { backgroundColor: "#ecfdf5", borderColor: C.mint },
  dayChipTxt: { fontSize: 13, fontWeight: "700", color: C.muted },
  dayChipTxtSel: { color: C.tealDeep },
  orgPicker: {
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: C.line,
  },
  orgPickerTextWrap: { flex: 1, minWidth: 0 },
  orgPickerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  orgPickerHint: {
    fontSize: 12,
    fontWeight: "500",
    color: C.muted,
    marginBottom: 6,
    opacity: 0.9,
  },
  orgPickerVal: { fontSize: 16, fontWeight: "700", color: C.ink, lineHeight: 22 },
  loaderWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  loaderCard: { backgroundColor: C.card, borderRadius: 20, padding: 36, alignItems: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  errorBanner: {
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, color: C.danger, fontWeight: "600", fontSize: 14, lineHeight: 21 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metric: {
    width: "48%",
    minWidth: 0,
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    width: "100%",
    flexShrink: 1,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.2,
  },
  metricCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
    marginTop: 6,
    lineHeight: 17,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  lineCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  lineTop: { alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  lineOrg: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "700",
    color: C.ink,
    lineHeight: 21,
  },
  lineAmt: {
    fontSize: 15,
    fontWeight: "800",
    color: C.teal,
    flexShrink: 0,
  },
  detailLine: { marginTop: 10, width: "100%" },
  detailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: C.ink,
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 14,
    fontWeight: "500",
    color: C.muted,
    lineHeight: 20,
    paddingVertical: 8,
  },
  blocked: { padding: 24, fontSize: 16, color: C.muted, lineHeight: 24 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: 20 },
  modalSheet: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: C.line,
  },
  modalScroll: { maxHeight: 360 },
  modalTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  modalRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    gap: 12,
  },
  modalRowText: { flex: 1, fontSize: 16, color: C.ink, fontWeight: "600", lineHeight: 22 },
  modalClose: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  modalCloseText: { fontSize: 15, fontWeight: "700", color: C.tealDeep },
});
