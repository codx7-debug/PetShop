import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { clearUserSession } from "../lib/session";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageShortcutsBar } from "../components/LanguageShortcutsBar";

const C = {
  tealDeep: "#064e56",
  mint: "#2B9B7A",
  cream: "#f4faf8",
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
};

export type AdminAccountRow = {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
  status: string;
  org_name?: string | null;
  org_contact?: string | null;
  created_at?: string;
};

function formatWhen(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminAccountsScreen() {
  const { t, isRTL, locale, setLocale } = useLanguage();
  const rowDir = isRTL ? ("row-reverse" as const) : ("row" as const);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [searched, setSearched] = useState(false);

  const guard = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) {
      setAllowed(false);
      router.replace({ pathname: "/login", params: { signInUser: "1" } });
      return;
    }
    try {
      const u = JSON.parse(raw) as { role?: string };
      const ok = String(u?.role ?? "")
        .trim()
        .toLowerCase() === "admin";
      setAllowed(ok);
      if (!ok) {
        Alert.alert("", t("adminAccounts.needAdmin"));
        router.replace("/admin-dashboard");
      }
    } catch {
      setAllowed(false);
      router.replace({ pathname: "/login", params: { signInUser: "1" } });
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void guard();
    }, [guard])
  );

  const runSearch = async () => {
    if (allowed !== true) return;
    const q = query.trim();
    if (q.length < 2) {
      Alert.alert("", t("adminAccounts.queryTooShort"));
      setAccounts([]);
      setSearched(false);
      return;
    }
    setError("");
    setSearching(true);
    setSearched(true);
    try {
      const enc = encodeURIComponent(q);
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/search?q=${enc}&limit=30`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ accounts?: AdminAccountRow[]; error?: string }>(res);
      if (res.status === 401 || res.status === 403) {
        await clearUserSession();
        router.replace({ pathname: "/login", params: { signInUser: "1" } });
        return;
      }
      const payload = parsed.data as { accounts?: AdminAccountRow[]; error?: string } | null;
      if (!parsed.ok || !payload?.accounts) {
        throw new Error(payload?.error || t("adminAccounts.searchError"));
      }
      setAccounts(payload.accounts);
    } catch (e) {
      setAccounts([]);
      setError(e instanceof Error ? e.message : t("adminAccounts.searchError"));
    } finally {
      setSearching(false);
    }
  };

  const setStatus = (id: number, status: "active" | "disabled") => {
    const body =
      status === "disabled" ? t("adminAccounts.confirmDisableBody") : t("adminAccounts.confirmEnableBody");
    Alert.alert(t("adminAccounts.confirmStatusTitle"), body, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.ok"),
        onPress: () =>
          void (async () => {
            setActingId(id);
            setError("");
            try {
              const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${id}/status`, {
                method: "PATCH",
                headers: await getAuthHeaders(true),
                body: JSON.stringify({ status }),
              });
              const parsed = await parseResponseJson<{ account?: { status?: string }; error?: string }>(res);
              if (!res.ok || !parsed.data?.account) {
                throw new Error(parsed.data?.error || t("adminAccounts.statusError"));
              }
              setAccounts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: String(parsed.data?.account?.status || status) } : a))
              );
              Alert.alert("", status === "disabled" ? t("adminAccounts.disabledOk") : t("adminAccounts.enabledOk"));
            } catch (e) {
              setError(e instanceof Error ? e.message : t("adminAccounts.statusError"));
            } finally {
              setActingId(null);
            }
          })(),
      },
    ]);
  };

  const removeAccount = (id: number, label: string) => {
    Alert.alert(t("adminAccounts.deleteTitle"), t("adminAccounts.deleteBody", { label }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("adminAccounts.deleteConfirm"),
        style: "destructive",
        onPress: () =>
          void (async () => {
            setActingId(id);
            setError("");
            try {
              const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${id}`, {
                method: "DELETE",
                headers: await getAuthHeaders(false),
              });
              const parsed = await parseResponseJson<{ ok?: boolean; error?: string }>(res);
              if (!res.ok) {
                throw new Error(parsed.data?.error || t("adminAccounts.deleteError"));
              }
              setAccounts((prev) => prev.filter((a) => a.id !== id));
              Alert.alert("", t("adminAccounts.deletedOk"));
            } catch (e) {
              setError(e instanceof Error ? e.message : t("adminAccounts.deleteError"));
            } finally {
              setActingId(null);
            }
          })(),
      },
    ]);
  };

  const statusLower = (s: string | undefined) => String(s || "").toLowerCase();

  if (allowed === false) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator color={C.mint} />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <LinearGradient colors={[C.tealDeep, "#0d6b6b", C.mint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.topRow, { flexDirection: rowDir }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
            {t("adminAccounts.title")}
          </Text>
          <TouchableOpacity style={styles.backBtnGhost} disabled />
        </View>
        <Text style={[styles.sub, { textAlign: isRTL ? "right" : "left" }]}>{t("adminAccounts.subtitle")}</Text>

        <View style={styles.langPad}>
          <Text style={[styles.langLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.languageTitle")}
          </Text>
          <LanguageShortcutsBar variant="surface" locale={locale} onSelect={setLocale} isRTL={isRTL} />
        </View>
      </SafeAreaView>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchCard}>
          <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("adminAccounts.queryLabel")}</Text>
          <Text style={[styles.hint, { textAlign: isRTL ? "right" : "left" }]}>{t("adminAccounts.queryHint")}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("adminAccounts.queryPh")}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchBtn, searching && { opacity: 0.7 }]}
            onPress={() => void runSearch()}
            disabled={searching}
            activeOpacity={0.9}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchBtnTxt}>{t("adminAccounts.search")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={[styles.errBanner, { flexDirection: rowDir }]}>
            <Ionicons name="warning-outline" size={20} color={C.danger} />
            <Text style={styles.errTxt}>{error}</Text>
          </View>
        ) : null}

        {searched && !searching && accounts.length === 0 && !error ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={C.muted} />
            <Text style={[styles.emptyTitle, { textAlign: "center" }]}>{t("adminAccounts.noneTitle")}</Text>
            <Text style={[styles.emptySub, { textAlign: "center" }]}>{t("adminAccounts.noneSub")}</Text>
          </View>
        ) : null}

        {accounts.map((a) => {
          const block = actingId !== null;
          const st = statusLower(a.status);
          const label = (a.full_name || a.email || "").trim() || a.email;
          return (
            <View key={a.id} style={styles.card}>
              <View style={[styles.cardHead, { flexDirection: rowDir }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                    {a.full_name || "—"}
                  </Text>
                  <Text style={[styles.email, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                    {a.email}
                  </Text>
                  {a.org_name ? (
                    <Text style={[styles.org, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                      {a.org_name}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillTxt}>{a.status}</Text>
                </View>
              </View>
              <Text style={[styles.meta, { textAlign: isRTL ? "right" : "left" }]}>
                {t("adminAccounts.role")}: {a.role} · {t("adminAccounts.since")} {formatWhen(a.created_at)}
              </Text>

              <View style={[styles.actions, { flexDirection: rowDir }]}>
                {st === "disabled" ? (
                  <TouchableOpacity
                    style={[styles.btnSolid, block && styles.btnDisabled]}
                    disabled={block}
                    onPress={() => setStatus(a.id, "active")}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnSolidTxt}>{t("adminAccounts.enable")}</Text>
                  </TouchableOpacity>
                ) : st === "rejected" ? (
                  <TouchableOpacity
                    style={[styles.btnSolid, block && styles.btnDisabled]}
                    disabled={block}
                    onPress={() => setStatus(a.id, "active")}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                    <Text style={styles.btnSolidTxt}>{t("adminAccounts.reactivate")}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.btnOutline, block && styles.btnDisabled]}
                    disabled={block}
                    onPress={() => setStatus(a.id, "disabled")}
                  >
                    <Ionicons name="ban-outline" size={18} color={C.danger} />
                    <Text style={styles.btnOutlineTxt}>{t("adminAccounts.disable")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btnDanger, block && styles.btnDisabled]}
                  disabled={block}
                  onPress={() => removeAccount(a.id, label)}
                >
                  <Ionicons name="trash-outline" size={18} color={C.danger} />
                  <Text style={styles.btnDangerTxt}>{t("adminAccounts.remove")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: C.cream },
  loadingShell: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.cream },
  hero: { position: "absolute", left: 0, right: 0, top: 0, height: Platform.OS === "android" ? 200 : 180 },
  safe: { paddingBottom: 4 },
  topRow: { alignItems: "center", paddingHorizontal: 10, gap: 6 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  backBtnGhost: { width: 42, height: 42, opacity: 0 },
  screenTitle: { flex: 1, fontSize: 17, fontWeight: "900", color: "#fff" },
  sub: {
    marginHorizontal: 22,
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 19,
  },
  langPad: { marginHorizontal: 16, marginBottom: 8 },
  langLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.75)", marginBottom: 8, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  searchCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  label: { fontSize: 12, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 },
  hint: { fontSize: 12, color: C.muted, marginTop: 6, marginBottom: 10, lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: C.ink,
  },
  searchBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.mint,
    borderRadius: 14,
    paddingVertical: 14,
  },
  searchBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 15 },
  errBanner: {
    alignItems: "center",
    gap: 10,
    backgroundColor: C.dangerSoft,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errTxt: { flex: 1, color: C.danger, fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "800", color: C.ink },
  emptySub: { marginTop: 8, fontSize: 14, color: C.muted, maxWidth: 300, lineHeight: 21 },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 4,
    borderLeftColor: C.mint,
  },
  cardHead: { alignItems: "flex-start", gap: 12, marginBottom: 8 },
  name: { fontSize: 17, fontWeight: "800", color: C.ink },
  email: { fontSize: 13, color: C.muted, marginTop: 4 },
  org: { fontSize: 13, color: C.ink, marginTop: 4, fontWeight: "600" },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  statusPillTxt: { fontSize: 11, fontWeight: "800", color: "#166534", textTransform: "uppercase" },
  meta: { fontSize: 12, color: C.muted, marginBottom: 12 },
  actions: { flexWrap: "wrap", gap: 10, alignItems: "stretch" },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    minWidth: 100,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
  },
  btnOutlineTxt: { fontWeight: "800", fontSize: 13, color: C.danger },
  btnSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    minWidth: 100,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.mint,
  },
  btnSolidTxt: { fontWeight: "800", fontSize: 13, color: "#fff" },
  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexBasis: "100%",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.dangerSoft,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  btnDangerTxt: { fontWeight: "800", fontSize: 13, color: C.danger },
  btnDisabled: { opacity: 0.45 },
});
