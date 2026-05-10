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
  RefreshControl,
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

type AccounterRow = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at?: string;
};

export default function AdminAccounterUsersScreen() {
  const { t, isRTL, locale, setLocale } = useLanguage();
  const rowDir = isRTL ? ("row-reverse" as const) : ("row" as const);

  const [allowed, setAllowed] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<AccounterRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        Alert.alert("", t("accountantUsers.needAdmin"));
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

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (allowed !== true) return;
      setError("");
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/accounter-users`, { headers: await getAuthHeaders() });
        const parsed = await parseResponseJson<{ users?: AccounterRow[]; error?: string }>(res);
        if (res.status === 401 || res.status === 403) {
          await clearUserSession();
          router.replace({ pathname: "/login", params: { signInUser: "1" } });
          return;
        }
        if (!res.ok || !parsed.data?.users) {
          throw new Error(parsed.data?.error || t("accountantUsers.loadError"));
        }
        setUsers(parsed.data.users);
      } catch (e) {
        setUsers([]);
        setError(e instanceof Error ? e.message : t("accountantUsers.loadError"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allowed, t]
  );

  React.useEffect(() => {
    if (allowed === true) void load();
  }, [allowed, load]);

  const createUser = async () => {
    const fn = fullName.trim();
    const em = email.trim().toLowerCase();
    const pw = password;
    if (!fn || !em || !pw) return;
    if (pw.length < 6) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounter-users`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ full_name: fn, email: em, password: pw }),
      });
      const parsed = await parseResponseJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(parsed.data?.error || t("accountantUsers.createError"));
      setFullName("");
      setEmail("");
      setPassword("");
      Alert.alert("", t("accountantUsers.created"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("accountantUsers.createError"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (u: AccounterRow, next: "active" | "disabled") => {
    Alert.alert(
      next === "disabled" ? t("accountantUsers.disable") : t("accountantUsers.enable"),
      u.email,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: next === "disabled" ? t("accountantUsers.disable") : t("accountantUsers.enable"),
          style: next === "disabled" ? "destructive" : "default",
          onPress: () => void patchUser(u.id, next),
        },
      ]
    );
  };

  const patchUser = async (id: number, status: "active" | "disabled") => {
    setActingId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounter-users/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const parsed = await parseResponseJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(parsed.data?.error || t("accountantUsers.updateError"));
      Alert.alert("", status === "disabled" ? t("accountantUsers.disabled") : t("accountantUsers.activated"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("accountantUsers.updateError"));
    } finally {
      setActingId(null);
    }
  };

  const signOut = async () => {
    await clearUserSession();
    router.replace("/login");
  };

  if (allowed === false) {
    return (
      <View style={styles.shell}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.blocked}>{t("accountantUsers.needAdmin")}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <LinearGradient colors={["#064e56", "#0d6b6b"]} style={styles.gradientBg} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <View style={[styles.hero, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <Text style={[styles.kicker, { textAlign: isRTL ? "right" : "left" }]}>{t("accountantUsers.title")}</Text>
            <Text style={[styles.sub, { textAlign: isRTL ? "right" : "left" }]}>{t("accountantUsers.subtitle")}</Text>
          </View>
          <View style={styles.actionsCol}>
            <TouchableOpacity style={styles.pill} onPress={() => router.push("/admin-dashboard")} activeOpacity={0.88}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
              <Text style={styles.pillText}>{t("accountantUsers.backAdmin")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => void signOut()} activeOpacity={0.88}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.pillText}>{t("accountantUsers.signOut")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.langShortcutBlock}>
          <Text style={[styles.langShortcutLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t("settings.languageTitle")}
          </Text>
          <LanguageShortcutsBar variant="onDark" locale={locale} onSelect={setLocale} isRTL={isRTL} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load({ refresh: true })} tintColor={C.mint} colors={[C.mint]} />
          }
        >
          <View style={styles.form}>
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("accountantUsers.fullName")}</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("accountantUsers.fullName")}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              autoCapitalize="words"
            />
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("accountantUsers.email")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("accountantUsers.email")}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t("accountantUsers.password")}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("accountantUsers.passwordPlaceholder")}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.createBtn, saving && styles.disabled]}
              disabled={saving}
              onPress={() => void createUser()}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[C.mint, "#1a7a5c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createGrad}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>{t("accountantUsers.create")}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBanner, { flexDirection: rowDir }]}>
              <Ionicons name="warning-outline" size={20} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading && users.length === 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={C.mint} />
            </View>
          ) : null}

          {users.map((u) => {
            const disabled = String(u.status).toLowerCase() === "disabled";
            return (
              <View key={u.id} style={styles.card}>
                <View style={[styles.cardTop, { flexDirection: rowDir }]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                      {u.full_name}
                    </Text>
                    <Text style={[styles.em, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                      {u.email}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, disabled && styles.statusPillOff]}>
                    <Text style={[styles.statusTxt, disabled && styles.statusTxtOff]}>
                      {disabled ? t("accountantUsers.statusDisabled") : t("accountantUsers.statusActive")}
                    </Text>
                  </View>
                </View>
                <View style={[styles.rowActions, { flexDirection: rowDir }]}>
                  <TouchableOpacity
                    style={[styles.sideBtn, disabled && styles.disabled]}
                    disabled={disabled || actingId !== null}
                    onPress={() => toggleStatus(u, "disabled")}
                  >
                    <Text style={styles.sideBtnDanger}>{t("accountantUsers.disable")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sideBtn, !disabled && styles.disabled]}
                    disabled={!disabled || actingId !== null}
                    onPress={() => toggleStatus(u, "active")}
                  >
                    <Text style={styles.sideBtnOk}>{t("accountantUsers.enable")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: C.cream },
  gradientBg: { ...StyleSheet.absoluteFillObject, height: 200, opacity: 0.95 },
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 6 : 2,
    paddingBottom: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  hero: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 6 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 19 },
  actionsCol: { gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pillText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  langShortcutBlock: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  langShortcutLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  form: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  label: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: C.ink,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  createBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  createGrad: { paddingVertical: 14, alignItems: "center" },
  createText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabled: { opacity: 0.45 },
  errorBanner: {
    gap: 10,
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    backgroundColor: C.dangerSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, color: C.danger, fontWeight: "600", fontSize: 14 },
  loader: { paddingVertical: 24, alignItems: "center" },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  cardTop: { alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  name: { fontSize: 17, fontWeight: "800", color: C.ink },
  em: { fontSize: 13, color: C.muted, marginTop: 4, fontWeight: "600" },
  statusPill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  statusPillOff: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  statusTxt: { fontSize: 11, fontWeight: "800", color: "#065f46" },
  statusTxtOff: { color: C.muted },
  rowActions: { gap: 10 },
  sideBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  sideBtnDanger: { fontWeight: "800", color: C.danger },
  sideBtnOk: { fontWeight: "800", color: C.tealDeep },
  blocked: { padding: 24, textAlign: "center", color: C.muted, fontSize: 15 },
});
