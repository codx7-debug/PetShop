import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";

type StoredUser = {
  id?: number;
  email?: string;
  org_name?: string | null;
  role?: string;
  org_type?: string | null;
  organization_id?: number | null;
};

type UpcomingAppt = {
  id: number;
  starts_at: string;
  ends_at: string;
  display_timezone: string;
  pet_name: string | null;
  service_title?: string | null;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function heroSubKey(orgType: string) {
  const k = orgType.trim().toLowerCase();
  if (k === "vet") return "orgDashboard.heroSubVet";
  if (k === "salon") return "orgDashboard.heroSubSalon";
  if (k === "hotel") return "orgDashboard.heroSubHotel";
  if (k === "rescue") return "orgDashboard.heroSubRescue";
  if (k === "petshop") return "orgDashboard.heroSubPetshop";
  if (k === "trainer") return "orgDashboard.heroSubTrainer";
  if (k === "petsitter") return "orgDashboard.heroSubPetsitter";
  return "orgDashboard.heroSubDefault";
}

export default function OrgDashboardScreen() {
  const { t, isRTL } = useLanguage();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState<string>("vet");
  const [loadingMe, setLoadingMe] = useState(false);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [listedServiceCount, setListedServiceCount] = useState<number | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const rowDir = isRTL ? "row-reverse" : "row";

  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);

  const persistUserPatch = async (partial: Partial<StoredUser>) => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;
      const u = { ...JSON.parse(raw), ...partial };
      await AsyncStorage.setItem("user", JSON.stringify(u));
    } catch {
      /* */
    }
  };

  const loadWeekBookingCount = useCallback(async () => {
    const base = startOfWeek(new Date());
    const fromIso = base.toISOString();
    const toIso = addDays(base, 7).toISOString();
    try {
      const q = new URLSearchParams({ from: fromIso, to: toIso });
      const res = await fetch(`${API_BASE_URL}/api/org/appointments?${q}`, {
        headers: await getAuthHeaders(false),
      });
      if (!res.ok) {
        setBookingCount(0);
        return;
      }
      const data = (await res.json()) as unknown[];
      setBookingCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setBookingCount(0);
    }
  }, []);

  const loadListedServiceCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/services`, {
        headers: await getAuthHeaders(false),
      });
      const data = (await res.json()) as { services?: { is_active?: boolean }[] };
      if (!res.ok) {
        setListedServiceCount(null);
        return;
      }
      const active = (data.services || []).filter((s) => s.is_active).length;
      setListedServiceCount(active);
    } catch {
      setListedServiceCount(null);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    const fromIso = new Date().toISOString();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    const toIso = end.toISOString();
    try {
      const q = new URLSearchParams({ from: fromIso, to: toIso });
      const res = await fetch(`${API_BASE_URL}/api/org/appointments?${q}`, {
        headers: await getAuthHeaders(false),
      });
      if (!res.ok) {
        setUpcoming([]);
        return;
      }
      const data = (await res.json()) as UpcomingAppt[];
      const list = Array.isArray(data) ? data : [];
      const now = Date.now();
      setUpcoming(
        list
          .filter((a) => new Date(a.starts_at).getTime() >= now)
          .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
          .slice(0, 6)
      );
    } catch {
      setUpcoming([]);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        router.replace({ pathname: "/login" });
        return;
      }
      const u = JSON.parse(raw) as StoredUser;
      const role = String(u.role ?? "")
        .trim()
        .toLowerCase();
      if (role !== "org") {
        router.replace({ pathname: "/home" });
        return;
      }
      setOrgName((u.org_name || u.email || "").trim());
      setEmail((u.email || "").trim());
      const ot = String(u.org_type || "vet").trim().toLowerCase();
      setOrgType(ot || "vet");

      const token = await AsyncStorage.getItem("token");
      const uid = Number(u.id);
      if (token && Number.isFinite(uid)) {
        void loadWeekBookingCount();
        void loadUpcoming();
        void loadListedServiceCount();
        setLoadingMe(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/org/me`, {
            headers: await getAuthHeaders(false),
          });
          const data = (await res.json().catch(() => ({}))) as {
            organization?: { org_type?: string; display_name?: string };
          };
          if (res.ok && data.organization) {
            const nextType = String(data.organization.org_type || "vet").toLowerCase();
            setOrgType(nextType);
            if (data.organization.display_name?.trim())
              setOrgName(data.organization.display_name.trim());
            await persistUserPatch({
              org_type: data.organization.org_type ?? null,
            });
          }
        } finally {
          setLoadingMe(false);
        }
      }
    } catch {
      router.replace({ pathname: "/login" });
    }
  }, [loadWeekBookingCount, loadUpcoming, loadListedServiceCount]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const signOut = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace({ pathname: "/login" });
  };

  return (
    <View style={styles.shell}>
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBg} />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(15,23,42,0.14)"]}
        style={styles.heroVignette}
      />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.topRow, { flexDirection: rowDir }]}>
          <View style={styles.heroTextCol}>
            <View style={[styles.kickerChip, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name={theme.icon} size={16} color="#fff" />
              <Text style={styles.kickerTxt}>{t(theme.kickerKey)}</Text>
            </View>
            <Text style={styles.orgTitle}>{orgName || t("orgDashboard.fallbackName")}</Text>
            <Text style={styles.heroSub} numberOfLines={3}>
              {t(heroSubKey(orgType))}
            </Text>
            <Text style={styles.sheetTag}>{t("orgDash.sheetTagline")}</Text>
            {email ? (
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.outBtn} onPress={() => void signOut()} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={[styles.sheet, styles.sheetShadow]}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {listedServiceCount != null ? (
              <TouchableOpacity
                style={[styles.servicesBanner, { flexDirection: rowDir }]}
                onPress={() => router.push({ pathname: "/provider-catalog" })}
                activeOpacity={0.9}
              >
                <View style={[styles.servicesBannerIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="pricetag-outline" size={20} color={theme.accent} />
                </View>
                <View style={styles.servicesBannerTextWrap}>
                  <Text style={[styles.servicesBannerTitle, { textAlign: isRTL ? "right" : "left" }]}>
                    {listedServiceCount === 0
                      ? t("orgDash.activeServicesNone")
                      : t("orgDash.activeServices", { count: listedServiceCount })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.accent} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.statsColumn}>
              <View style={[styles.statCardWide, { borderColor: theme.accentSoft }]}>
                <LinearGradient
                  colors={["#ffffff", theme.accentSoft]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <View style={[styles.statWeekInner, { flexDirection: rowDir }]}>
                  <Text style={[styles.statValue, { color: theme.gradient[1] }]}>
                    {bookingCount === null ? "–" : String(bookingCount ?? "0")}
                  </Text>
                  <View style={styles.statWeekLabels}>
                    <Text style={[styles.statLabel, { flexShrink: 1 }]}>{t("orgDashboard.statBookings")}</Text>
                    <Text style={[styles.statCaption, { flexShrink: 1 }]}>{t("orgDashboard.statBookingsCaption")}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.statCardWide, styles.statScheduleCard]}>
                <View style={[styles.statScheduleTop, { flexDirection: rowDir }]}>
                  <View style={[styles.statIconBubble, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="calendar-outline" size={22} color={theme.accent} />
                  </View>
                  <View style={styles.statScheduleTitleCol}>
                    <Text
                      style={[styles.statSideTitle, { textAlign: isRTL ? "right" : "left" }]}
                      numberOfLines={2}
                    >
                      {t("orgDashboard.scheduleTitle")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.miniCta, { backgroundColor: theme.accent }]}
                    onPress={() => router.push({ pathname: "/staff-calendar" })}
                    activeOpacity={0.88}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                      style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.statSideSub, { textAlign: isRTL ? "right" : "left" }]}>
                  {t("orgDashboard.scheduleDesc")}
                </Text>
              </View>
            </View>

          <View style={[styles.sectionHead, { flexDirection: rowDir }]}>
            <View style={[styles.sectionAccentBar, { backgroundColor: theme.accent }]} />
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("orgDash.sectionUpcoming")}</Text>
          </View>
          {upcoming.length === 0 ? (
            <Text style={styles.upcomingEmpty}>{t("orgDash.upcomingEmpty")}</Text>
          ) : (
            upcoming.map((a) => (
              <View key={a.id} style={[styles.upcomingCard, styles.upcomingElevated]}>
                <LinearGradient
                  colors={["#ffffff", theme.accentSoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.upcomingInner, { flexDirection: rowDir }]}>
                  <View style={[styles.upcomingLeftRail, { backgroundColor: theme.accent }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.upcomingWhen, { color: theme.accent }]}>
                      {new Date(a.starts_at).toLocaleString(undefined, {
                        timeZone: a.display_timezone || undefined,
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {a.service_title ? (
                      <Text style={styles.upcomingSvc}>{a.service_title}</Text>
                    ) : null}
                    <Text style={styles.upcomingPet}>{a.pet_name || "—"}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.calLinkWrap}
            onPress={() => router.push({ pathname: "/staff-calendar" })}
            activeOpacity={0.8}
          >
            <Text style={[styles.calLink, { color: theme.accent }]}>{t("orgDash.viewCalendar")}</Text>
          </TouchableOpacity>

          <View style={[styles.sectionHead, { flexDirection: rowDir, marginTop: 6 }]}>
            <View style={[styles.sectionAccentBar, { backgroundColor: theme.accent }]} />
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("orgDash.sectionActions")}</Text>
          </View>

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.tile, styles.shadow]}
              activeOpacity={0.92}
              onPress={() => router.push({ pathname: "/org-profile-settings" })}
            >
              <LinearGradient colors={["#ffffff", theme.accentSoft]} style={styles.tileInner}>
                <View style={[styles.tileIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="business-outline" size={26} color={theme.accent} />
                </View>
                <Text style={styles.tileTitle}>{t("orgProfileSettings.dashboardTileTitle")}</Text>
                <Text style={styles.tileDesc} numberOfLines={3}>
                  {t("orgProfileSettings.dashboardTileDesc")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.tileRow, { flexDirection: rowDir }]}>
              <TouchableOpacity
                style={[styles.tileHalf, styles.shadow]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: "/staff-calendar" })}
              >
                <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.tileInnerTight}>
                  <View style={[styles.tileIconSm2, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="calendar-sharp" size={22} color={theme.accent} />
                  </View>
                  <Text style={styles.tileTitleSm2}>{t("orgDashboard.openCalendar")}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tileHalf, styles.shadow]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: "/provider-catalog" })}
              >
                <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.tileInnerTight}>
                  <View style={[styles.tileIconSm2, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="pricetag-outline" size={22} color={theme.accent} />
                  </View>
                  <Text style={styles.tileTitleSm2}>{t("orgDash.openServices")}</Text>
                  <Text style={styles.tileMicro} numberOfLines={2}>
                    {t("orgDash.openServicesDesc")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {orgType.trim().toLowerCase() === "vet" ? (
              <TouchableOpacity
                style={[styles.tile, styles.shadow]}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: "/org-reports" })}
              >
                <LinearGradient colors={["#ffffff", "#fffbeb"]} style={styles.tileInner}>
                  <View style={[styles.tileIcon, { backgroundColor: "#ffedd5" }]}>
                    <Ionicons name="medkit-outline" size={26} color="#c2410c" />
                  </View>
                  <Text style={styles.tileTitle}>{t("orgDashboard.openReports")}</Text>
                  <Text style={styles.tileDesc}>{t("orgDashboard.reportsShortcutDesc")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.tileWide, styles.shadow]}
              activeOpacity={0.92}
              onPress={() => router.replace({ pathname: "/home" })}
            >
              <View style={[styles.tileInnerRow, { flexDirection: rowDir }]}>
                <View style={[styles.tileIconSm, { backgroundColor: "#e0f2fe" }]}>
                  <Ionicons name="paw" size={22} color="#0369a1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileTitleSm}>{t("orgDashboard.openMarket")}</Text>
                  <Text style={styles.tileDescSm}>{t("orgDashboard.petoraDesc")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.notePill, { flexDirection: rowDir }]}>
            <Ionicons name="sparkles-outline" size={18} color={theme.accent} />
            <Text style={styles.note}>{t("orgDashboard.note")}</Text>
          </View>

          {loadingMe ? (
            <View style={styles.inlineLoad}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const BG = "#f1f5f9";

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: BG },
  heroBg: { position: "absolute", left: 0, right: 0, top: 0, height: 280 },
  heroVignette: { position: "absolute", left: 0, right: 0, top: 0, height: 280 },
  safe: { flex: 1 },
  scrollView: { flex: 1 },
  topRow: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 24,
    alignItems: "flex-start",
    gap: 12,
  },
  heroTextCol: { flex: 1, minWidth: 0, paddingEnd: 4 },
  kickerChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexWrap: "wrap",
    maxWidth: "100%",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  kickerTxt: { fontSize: 12, fontWeight: "800", color: "#fff", letterSpacing: 0.4, flexShrink: 1 },
  orgTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
    maxWidth: "100%",
  },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.92)", marginTop: 8, lineHeight: 22, maxWidth: "100%" },
  sheetTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 1.8,
    marginTop: 10,
    textTransform: "uppercase",
  },
  email: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 8 },
  outBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginTop: 4,
  },
  scroll: { paddingHorizontal: 0, paddingBottom: 32, gap: 0 },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
  },
  sheetShadow: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  handleWrap: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },
  servicesBanner: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  servicesBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  servicesBannerTextWrap: { flex: 1, minWidth: 0, justifyContent: "center" },
  servicesBannerTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", lineHeight: 19 },
  statsColumn: { gap: 12, marginTop: 0, marginBottom: 22 },
  statCardWide: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#fff",
    minHeight: 88,
  },
  statWeekInner: {
    alignItems: "center",
    gap: 16,
    zIndex: 1,
    justifyContent: "flex-start",
  },
  statWeekLabels: { flex: 1, minWidth: 0, justifyContent: "center", gap: 2 },
  statIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: { fontSize: 36, fontWeight: "900" },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 4 },
  statCaption: { fontSize: 11, fontWeight: "600", color: "#64748b", marginTop: 2 },
  statScheduleCard: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    paddingBottom: 14,
    gap: 10,
  },
  statScheduleTop: { alignItems: "center", gap: 12 },
  statScheduleTitleCol: { flex: 1, minWidth: 0, justifyContent: "center" },
  statSideTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a", lineHeight: 21 },
  statSideSub: { fontSize: 13, color: "#64748b", lineHeight: 19, marginTop: 2 },
  miniCta: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionHead: {
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
    marginTop: 2,
    paddingVertical: 2,
    minHeight: 28,
  },
  sectionAccentBar: { width: 4, height: 22, borderRadius: 2, alignSelf: "center", flexShrink: 0 },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: "900", color: "#0f172a", letterSpacing: -0.4, minWidth: 0 },
  upcomingEmpty: { fontSize: 14, color: "#64748b", marginBottom: 14, lineHeight: 20 },
  upcomingCard: {
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8eef4",
    overflow: "hidden",
    position: "relative",
    minHeight: 72,
  },
  upcomingElevated: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  upcomingInner: {
    alignItems: "stretch",
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 1,
    gap: 12,
  },
  upcomingLeftRail: { width: 5, alignSelf: "stretch", borderRadius: 3 },
  upcomingWhen: { fontSize: 13, fontWeight: "900" },
  upcomingSvc: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginTop: 6 },
  upcomingPet: { fontSize: 13, color: "#64748b", marginTop: 4 },
  calLinkWrap: { marginBottom: 18 },
  calLink: { fontSize: 14, fontWeight: "800" },
  grid: { gap: 12 },
  tileRow: { gap: 12, marginBottom: 0 },
  tileHalf: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 128,
  },
  tileInnerTight: { padding: 16, alignItems: "flex-start" },
  tileIconSm2: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileTitleSm2: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  tileMicro: { fontSize: 11, color: "#64748b", marginTop: 6, lineHeight: 15 },
  tile: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tileWide: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    marginTop: 4,
    overflow: "hidden",
  },
  shadow: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tileInner: { padding: 18 },
  tileInnerRow: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  tileIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  tileIconSm: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  tileDesc: { fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 19 },
  tileTitleSm: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  tileDescSm: { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 18 },
  notePill: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "flex-start",
  },
  note: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 20 },
  inlineLoad: { marginTop: 12, alignItems: "center" },
});
