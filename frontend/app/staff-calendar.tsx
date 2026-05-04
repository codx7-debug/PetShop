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
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";
import { useFocusEffect } from "@react-navigation/native";

type AppointmentRow = {
  id: number;
  starts_at: string;
  ends_at: string;
  display_timezone: string;
  status: string;
  pet_name: string | null;
  owner_user_id: number;
  clinic_staff_user_id: number | null;
  notes: string | null;
  service_title?: string | null;
};

type StoredUser = { id?: number; role?: string; org_type?: string | null };

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

function formatAppointmentRange(startIso: string, endIso: string, displayTz: string) {
  const tz = displayTz?.trim() || undefined;
  const opt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  try {
    const s = new Date(startIso).toLocaleTimeString(undefined, tz ? { ...opt, timeZone: tz } : opt);
    const e = new Date(endIso).toLocaleTimeString(undefined, tz ? { ...opt, timeZone: tz } : opt);
    return `${s} → ${e}`;
  } catch {
    return `${startIso.slice(11, 16)} → ${endIso.slice(11, 16)}`;
  }
}

export default function StaffCalendarScreen() {
  const { t, isRTL } = useLanguage();
  const [weekOffset, setWeekOffset] = useState(0);
  const [boot, setBoot] = useState(false);
  const [orgOk, setOrgOk] = useState(false);
  const [orgType, setOrgType] = useState<string>("vet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<AppointmentRow[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const u = JSON.parse(raw) as StoredUser;
          const r = String(u?.role ?? "")
            .trim()
            .toLowerCase();
          if (r === "org" && u?.id != null) {
            setOrgOk(true);
            setOrgType(String(u.org_type || "vet"));
          }
        }
      } catch {
        /* */
      }
      setBoot(true);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem("user");
          if (!raw) return;
          const u = JSON.parse(raw) as StoredUser;
          if (String(u?.role ?? "")
            .trim()
            .toLowerCase() !== "org")
            return;
          const res = await fetch(`${API_BASE_URL}/api/org/me`, {
            headers: await getAuthHeaders(false),
          });
          const data = (await res.json().catch(() => ({}))) as {
            organization?: { org_type?: string };
          };
          if (!cancelled && res.ok && data.organization?.org_type) {
            setOrgType(String(data.organization.org_type).toLowerCase());
          }
        } catch {
          /* */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);

  const { fromIso, toIso } = useMemo(() => {
    const base = startOfWeek(new Date());
    const start = addDays(base, weekOffset * 7);
    const end = addDays(start, 7);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }, [weekOffset]);

  const load = useCallback(async () => {
    if (!orgOk) return;
    setError("");
    setLoading(true);
    try {
      const q = new URLSearchParams({ from: fromIso, to: toIso });
      const res = await fetch(`${API_BASE_URL}/api/org/appointments?${q}`, {
        headers: await getAuthHeaders(false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromIso, toIso, orgOk]);

  React.useEffect(() => {
    if (!boot) return;
    if (!orgOk) return;
    void load();
  }, [boot, orgOk, load]);

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const r of rows) {
      const day = r.starts_at.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const rowDir = isRTL ? "row-reverse" : "row";

  if (!boot) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!orgOk) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("orgSchedule.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.blockCard}>
          <Ionicons name="lock-closed-outline" size={40} color="#94a3b8" />
          <Text style={styles.blockText}>{t("orgSchedule.needOrgRole")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: "#f8fafc" }]} edges={["top"]}>
      <View style={[styles.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>{t("orgSchedule.title")}</Text>
          <View style={[styles.typePill, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={theme.icon} size={14} color={theme.accent} />
            <Text style={[styles.typePillTxt, { color: theme.accent }]}>{t(theme.kickerKey)}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.intro, { flexDirection: rowDir }]}>
          <Ionicons name="information-circle-outline" size={22} color={theme.accent} />
          <Text style={styles.hint}>{t("orgSchedule.hint")}</Text>
        </View>

        <View style={[styles.weekRow, { flexDirection: rowDir }]}>
          <TouchableOpacity
            style={[styles.navBtn, { borderColor: theme.accent }]}
            onPress={() => setWeekOffset((w) => w - 1)}
          >
            <Text style={[styles.navBtnText, { color: theme.gradient[1] }]}>{t("orgSchedule.prevWeek")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtnPrimary, { backgroundColor: theme.accent }]} onPress={() => setWeekOffset(0)}>
            <Text style={styles.navBtnPrimText}>{t("orgSchedule.thisWeek")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { borderColor: theme.accent }]}
            onPress={() => setWeekOffset((w) => w + 1)}
          >
            <Text style={[styles.navBtnText, { color: theme.gradient[1] }]}>{t("orgSchedule.nextWeek")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.refresh, { backgroundColor: theme.gradient[2] ?? theme.accent }]} onPress={() => void load()}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.refreshText}>{t("orgSchedule.refresh")}</Text>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        {grouped.map(([day, list]) => (
          <View key={day} style={styles.dayBlock}>
            <Text style={[styles.dayTitle, { color: theme.gradient[0] || "#0f172a" }]}>{day}</Text>
            {list.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={[styles.cardTopRow, { flexDirection: rowDir }]}>
                  <View style={[styles.timePill, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.cardTime, { color: theme.accent }]}>
                      {formatAppointmentRange(a.starts_at, a.ends_at, a.display_timezone)}
                    </Text>
                  </View>
                  <Text style={styles.tz}>{a.display_timezone}</Text>
                </View>
                {a.service_title ? (
                  <Text style={styles.serviceLine}>
                    {t("orgSchedule.serviceLabel")}: {a.service_title}
                  </Text>
                ) : null}
                <Text style={styles.cardPet}>{a.pet_name || "—"}</Text>
                <Text style={styles.cardMeta}>{t("orgSchedule.customerId", { id: a.owner_user_id })}</Text>
                {a.notes ? <Text style={styles.cardNotes}>{a.notes}</Text> : null}
                <View style={[styles.cardActions, { flexDirection: rowDir }]}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/appointments/${a.id}/cancel`, {
                          method: "POST",
                          headers: await getAuthHeaders(),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || res.statusText);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Cancel failed");
                      }
                    }}
                  >
                    <Text style={[styles.link, { color: "#dc2626" }]}>{t("orgSchedule.cancel")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}

        {!loading && grouped.length === 0 && !error ? <Text style={styles.empty}>{t("orgSchedule.empty")}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc", paddingTop: Platform.OS === "android" ? 4 : 0 },
  centered: { justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typePillTxt: { fontSize: 11, fontWeight: "700" },
  scroll: { padding: 18, paddingBottom: 56 },
  intro: {
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  hint: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 19 },
  weekRow: {
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    minWidth: "28%",
  },
  navBtnText: { fontWeight: "800", fontSize: 12 },
  navBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    minWidth: "28%",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  navBtnPrimText: { fontWeight: "800", fontSize: 13, color: "#fff" },
  refresh: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshText: { color: "#fff", fontWeight: "700" },
  err: { color: "#b91c1c", marginBottom: 12, fontWeight: "600" },
  dayBlock: { marginBottom: 22 },
  dayTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: { alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  timePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cardTime: { fontSize: 13, fontWeight: "800" },
  tz: { fontSize: 11, color: "#64748b" },
  serviceLine: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  cardPet: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  cardMeta: { fontSize: 12, color: "#64748b", marginTop: 4 },
  cardNotes: { fontSize: 12, color: "#475569", marginTop: 8, fontStyle: "italic" },
  cardActions: { marginTop: 10, justifyContent: "flex-end" },
  link: { fontWeight: "700" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 28, fontSize: 15 },
  blockCard: {
    margin: 24,
    padding: 28,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  blockText: { fontSize: 15, color: "#475569", textAlign: "center", lineHeight: 22 },
});
