import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageShortcutsBar } from "../components/LanguageShortcutsBar";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const C = {
  tealDeep: "#064e56",
  teal: "#0d6b6b",
  mint: "#2B9B7A",
  mintLight: "#4dd4b0",
  cream: "#f4faf8",
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  warn: "#b45309",
  warnBg: "#fffbeb",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  success: "#047857",
};

type OrgRequest = {
  id: number;
  full_name: string;
  email: string;
  org_name: string | null;
  org_contact: string | null;
  created_at: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminDashboardScreen() {
  const { t, isRTL, locale, setLocale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [requests, setRequests] = useState<OrgRequest[]>([]);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(
    async (opts?: { refresh?: boolean }) => {
      setError("");
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/org-requests`, {
          headers: await authHeaders(),
        });
        const data = (await res.json().catch(() => ({}))) as { requests?: OrgRequest[]; error?: string };
        if (res.status === 401 || res.status === 403) {
          await AsyncStorage.multiRemove(["token", "user"]);
          router.replace({ pathname: "/login" });
          return;
        }
        if (!res.ok) throw new Error(data.error || res.statusText);
        setRequests(data.requests || []);
      } catch (e) {
        setRequests([]);
        setError(e instanceof Error ? e.message : t("adminDashboard.loadError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  const onRefresh = useCallback(() => {
    void fetchRequests({ refresh: true });
  }, [fetchRequests]);

  React.useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const signOut = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace({ pathname: "/login" });
  };

  const approve = async (id: number) => {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/org-requests/${id}/approve`, {
        method: "POST",
        headers: await authHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      Alert.alert("", t("adminDashboard.approved"));
      await fetchRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminDashboard.loadError"));
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: number) => {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/org-requests/${id}/reject`, {
        method: "POST",
        headers: await authHeaders(),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      Alert.alert("", t("adminDashboard.rejected"));
      await fetchRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminDashboard.loadError"));
    } finally {
      setActingId(null);
    }
  };

  const count = requests.length;
  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[C.tealDeep, C.teal, C.mint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.heroRow, { flexDirection: rowDir }]}>
          <View style={[styles.heroBrand, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <View style={[styles.badgeRow, { flexDirection: rowDir }]}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
              </View>
              <Text style={styles.kicker} numberOfLines={2}>
                {t("adminDashboard.brandBadge")}
              </Text>
            </View>
            <Text
              style={styles.heroTitle}
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {t("adminDashboard.title")}
            </Text>
            <Text
              style={[styles.heroSub, { textAlign: isRTL ? "right" : "left" }]}
              numberOfLines={4}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {t("adminDashboard.subtitle")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void signOut()}
            style={styles.signOutPill}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text
              style={styles.signOutText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t("adminDashboard.signOut")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentSheet}>
          <View style={styles.langSection}>
            <Text style={[styles.langShortcutLabel, { textAlign: isRTL ? "right" : "left" }]}>
              {t("settings.languageTitle")}
            </Text>
            <LanguageShortcutsBar variant="surface" locale={locale} onSelect={setLocale} isRTL={isRTL} />
          </View>

          <View style={[styles.statCard, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.statIconWrap,
                { marginEnd: isRTL ? 0 : 12, marginStart: isRTL ? 12 : 0 },
              ]}
            >
              <Ionicons name="hourglass-outline" size={26} color={C.mint} />
            </View>
            <View style={styles.statTextBlock}>
              <Text style={[styles.statLabel, { textAlign: isRTL ? "right" : "left" }]}>
                {t("adminDashboard.countLabel", { count })}
              </Text>
              <Text style={[styles.statHint, { textAlign: isRTL ? "right" : "left" }]}>
                {t("adminDashboard.refresh")}
              </Text>
            </View>
          </View>

          <View style={styles.adminShortcuts}>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push("/admin-accounts")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#0f172a", "#334155"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.shortcutGrad, { flexDirection: rowDir }]}
              >
                <Ionicons name="people-circle-outline" size={22} color="#fff" />
                <Text
                  style={[styles.shortcutText, { textAlign: isRTL ? "right" : "left" }]}
                  numberOfLines={2}
                >
                  {t("adminDashboard.lookupAccounts")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push("/accounter")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#0f766e", "#0d9488"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.shortcutGrad, { flexDirection: rowDir }]}
              >
                <Ionicons name="calculator-outline" size={22} color="#fff" />
                <Text
                style={[styles.shortcutText, { textAlign: isRTL ? "right" : "left" }]}
                numberOfLines={2}
              >
                  {t("adminDashboard.openAccountant")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push("/admin-accounter-users")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[C.tealDeep, "#0a5560"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.shortcutGrad, { flexDirection: rowDir }]}
              >
                <Ionicons name="people-outline" size={22} color="#fff" />
                <Text
                  style={[styles.shortcutText, { textAlign: isRTL ? "right" : "left" }]}
                  numberOfLines={2}
                >
                  {t("adminDashboard.manageAccountants")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <View style={styles.loaderCard}>
                <ActivityIndicator size="large" color={C.mint} />
                <Text style={styles.loaderHint}>{t("adminDashboard.refresh")}</Text>
              </View>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollFlex}
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mint} colors={[C.mint]} />
              }
            >
            {error ? (
              <View style={[styles.errorBanner, { flexDirection: rowDir }]}>
                <Ionicons name="warning-outline" size={22} color={C.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {requests.map((r, index) => (
              <View key={r.id} style={[styles.card, { borderLeftColor: index % 2 === 0 ? C.mint : C.teal }]}>
                <View style={[styles.cardTop, { flexDirection: rowDir }]}>
                  <View style={[styles.orgTitleBlock, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                    <Text style={styles.orgName} numberOfLines={2}>
                      {r.org_name || "—"}
                    </Text>
                    <Text style={styles.orgEmail} numberOfLines={1}>
                      {r.email}
                    </Text>
                  </View>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>{t("adminDashboard.pendingBadge")}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={[styles.infoRow, { flexDirection: rowDir }]}>
                  <Ionicons name="person-outline" size={18} color={C.muted} />
                  <Text style={[styles.infoText, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("adminDashboard.contact")}: {r.org_contact || r.full_name || "—"}
                  </Text>
                </View>
                <View style={[styles.infoRow, { flexDirection: rowDir }]}>
                  <Ionicons name="calendar-outline" size={18} color={C.muted} />
                  <Text style={[styles.infoText, { textAlign: isRTL ? "right" : "left" }]}>{formatDate(r.created_at)}</Text>
                </View>

                <View style={[styles.actions, { flexDirection: rowDir }]}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, actingId !== null && styles.disabled]}
                    disabled={actingId !== null}
                    onPress={() => void reject(r.id)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={C.danger} />
                    <Text style={styles.rejectBtnText}>{t("adminDashboard.reject")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={actingId !== null}
                    onPress={() => void approve(r.id)}
                    activeOpacity={0.9}
                    style={[styles.approveWrap, actingId !== null && styles.disabled]}
                  >
                    <LinearGradient
                      colors={[C.mint, "#1a7a5c"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.approveGrad}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.approveText}>{t("adminDashboard.accept")}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {!error && requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <LinearGradient colors={["#e8f8f3", "#f0fdf9"]} style={styles.emptyIconRing}>
                  <Ionicons name="business-outline" size={48} color={C.mint} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>{t("adminDashboard.empty")}</Text>
                <Text style={styles.emptySub}>{t("adminDashboard.emptySub")}</Text>
              </View>
            ) : null}
              <View style={styles.scrollBottomPad} />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: C.cream },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    height: 200,
    opacity: 0.96,
  },
  safe: { flex: 1 },
  heroRow: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBrand: { flex: 1, minWidth: 0, flexShrink: 1, paddingEnd: 8 },
  contentSheet: {
    flex: 1,
    marginTop: -12,
    backgroundColor: C.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  langSection: { marginBottom: 16 },
  badgeRow: { alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8, maxWidth: "100%" },
  shieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.85)",
    flexShrink: 1,
    maxWidth: "100%",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
    flexShrink: 1,
    width: "100%",
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 20,
    maxWidth: "100%",
    flexShrink: 1,
    width: "100%",
  },
  langShortcutLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: C.muted,
    textTransform: "uppercase",
  },
  signOutPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  signOutText: { color: "#fff", fontWeight: "700", fontSize: 13, flexShrink: 1, minWidth: 0 },
  statCard: {
    marginBottom: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#036672",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.line,
  },
  statIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  statTextBlock: { flex: 1, minWidth: 0, justifyContent: "center" },
  statLabel: { fontSize: 17, fontWeight: "800", color: C.ink },
  statHint: { fontSize: 12, color: C.muted, marginTop: 4 },
  adminShortcuts: {
    marginBottom: 14,
    gap: 10,
  },
  shortcutBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  shortcutGrad: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  shortcutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    lineHeight: 20,
  },
  loaderWrap: { flexGrow: 1, minHeight: 220, justifyContent: "center", paddingVertical: 24 },
  loaderCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  loaderHint: { marginTop: 14, fontSize: 13, color: C.muted, fontWeight: "600" },
  scrollFlex: { flex: 1 },
  scroll: { paddingTop: 2, paddingBottom: 8, flexGrow: 1 },
  scrollBottomPad: { height: 28 },
  errorBanner: {
    alignItems: "center",
    gap: 10,
    backgroundColor: C.dangerSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorBannerText: { flex: 1, color: C.danger, fontWeight: "600", fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: C.mint,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.line,
  },
  cardTop: { alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  orgTitleBlock: { flex: 1, minWidth: 0 },
  orgName: { fontSize: 19, fontWeight: "800", color: C.ink, letterSpacing: -0.3 },
  orgEmail: { fontSize: 13, color: C.muted, marginTop: 4, fontWeight: "500" },
  pendingPill: {
    backgroundColor: C.warnBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  pendingPillText: { fontSize: 11, fontWeight: "800", color: C.warn, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 14 },
  infoRow: { alignItems: "center", gap: 10, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: "500" },
  actions: { marginTop: 18, justifyContent: "space-between", alignItems: "center", gap: 12 },
  rejectBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  rejectBtnText: { fontSize: 15, fontWeight: "800", color: C.danger },
  approveWrap: { flex: 1, minWidth: 120, borderRadius: 14, overflow: "hidden" },
  approveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  approveText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  disabled: { opacity: 0.45 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  emptyIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21, maxWidth: 280 },
});
