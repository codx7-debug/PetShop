import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";
import OrgScreenKeyboardAvoiding from "../components/org/OrgScreenKeyboardAvoiding";

type UserLite = { role?: string; org_type?: string | null };

export default function OrgOperationsScreen() {
  const { t, isRTL } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row";
  const [gate, setGate] = useState<"load" | "ok" | "no">("load");
  const [orgType, setOrgType] = useState("vet");
  const [tab, setTab] = useState<"pkg" | "staff" | "inv" | "bc" | "wait">("pkg");
  const [loading, setLoading] = useState(false);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgDur, setPkgDur] = useState("60");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPass, setStaffPass] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("reception");
  const [sku, setSku] = useState("");
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState("0");
  const [bcTitle, setBcTitle] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [waitlist, setWaitlist] = useState<Record<string, unknown>[]>([]);

  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (!raw) {
          setGate("no");
          return;
        }
        const u = JSON.parse(raw) as UserLite;
        const r = String(u.role || "").toLowerCase();
        if (r === "org_staff") {
          Alert.alert("", t("orgOperations.staffBlocked"));
          router.back();
          return;
        }
        if (r !== "org") {
          Alert.alert("", t("orgOperations.ownerOnly"));
          router.back();
          return;
        }
        setOrgType(String(u.org_type || "vet"));
        setGate("ok");
        const res = await fetch(`${API_BASE_URL}/api/org/me`, { headers: await getAuthHeaders(false) });
        const parsed = await parseResponseJson<{ organization?: { org_type?: string } }>(res);
        if (parsed.ok && parsed.data?.organization?.org_type) {
          setOrgType(String(parsed.data.organization.org_type).toLowerCase());
        }
      } catch {
        setGate("no");
      }
    })();
  }, []);

  const loadWait = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/waitlist`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ waitlist?: Record<string, unknown>[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setWaitlist(parsed.data?.waitlist || []);
    } catch {
      setWaitlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (gate !== "ok" || tab !== "wait") return;
    void loadWait();
  }, [gate, tab, loadWait]);

  const submitPackage = async () => {
    setLoading(true);
    try {
      const priceCents = Math.round(parseFloat(pkgPrice || "0") * 100);
      const res = await fetch(`${API_BASE_URL}/api/org/packages`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          title: pkgTitle.trim(),
          price_cents: Number.isFinite(priceCents) ? priceCents : 0,
          duration_minutes: Math.max(15, parseInt(pkgDur, 10) || 60),
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      Alert.alert("", t("orgOperations.bundleCreated"));
      setPkgTitle("");
      setPkgPrice("");
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("login.errGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const submitStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/members`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          email: staffEmail.trim().toLowerCase(),
          password: staffPass,
          full_name: staffName.trim(),
          role_in_org: staffRole,
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      Alert.alert("", t("orgOperations.staffCreated"));
      setStaffEmail("");
      setStaffPass("");
      setStaffName("");
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("login.errGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const submitInv = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/inventory`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          sku: sku.trim() || null,
          name: invName.trim(),
          quantity: parseFloat(invQty) || 0,
        }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      Alert.alert("", t("orgOperations.inventorySaved"));
      setSku("");
      setInvName("");
      setInvQty("0");
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("login.errGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const submitBc = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/broadcasts`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ title: bcTitle.trim(), body: bcBody.trim() }),
      });
      const parsed = await parseResponseJson<{ delivered_count?: number }>(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      Alert.alert("", t("orgOperations.broadcastSent", { count: parsed.data?.delivered_count ?? 0 }));
      setBcTitle("");
      setBcBody("");
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("login.errGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (gate === "load") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.head, { flexDirection: rowDir }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgOperations.title")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={[styles.tabs, { flexDirection: rowDir }]}>
        {(
          [
            ["pkg", t("orgOperations.tabBundles")],
            ["staff", t("orgOperations.tabStaff")],
            ["inv", t("orgOperations.tabStock")],
            ["bc", t("orgOperations.tabBroadcast")],
            ["wait", t("orgOperations.tabWaitlist")],
          ] as const
        ).map(([k, lbl]) => (
          <TouchableOpacity
            key={k}
            style={[styles.tab, tab === k && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
            onPress={() => setTab(k)}
          >
            <Text style={[styles.tabTxt, tab === k && { color: theme.accent }]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <OrgScreenKeyboardAvoiding>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} /> : null}

        {tab === "pkg" ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("orgOperations.bundleTitle")}</Text>
            <TextInput style={styles.input} value={pkgTitle} onChangeText={setPkgTitle} placeholder={t("orgOperations.bundleTitlePh")} />
            <Text style={styles.label}>{t("orgOperations.durationMin")}</Text>
            <TextInput style={styles.input} value={pkgDur} onChangeText={setPkgDur} keyboardType="number-pad" />
            <Text style={styles.label}>{t("orgOperations.priceTry")}</Text>
            <TextInput style={styles.input} value={pkgPrice} onChangeText={setPkgPrice} keyboardType="decimal-pad" />
            <Text style={styles.hint}>{t("orgOperations.bundleHint")}</Text>
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => void submitPackage()}>
              <Text style={styles.ctaTxt}>{t("orgOperations.saveBundle")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === "staff" ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("orgOperations.fullName")}</Text>
            <TextInput style={styles.input} value={staffName} onChangeText={setStaffName} />
            <Text style={styles.label}>{t("orgOperations.workEmail")}</Text>
            <TextInput style={styles.input} value={staffEmail} onChangeText={setStaffEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>{t("orgOperations.password")}</Text>
            <TextInput style={styles.input} value={staffPass} onChangeText={setStaffPass} secureTextEntry />
            <Text style={styles.label}>{t("orgOperations.role")}</Text>
            <TextInput style={styles.input} value={staffRole} onChangeText={setStaffRole} placeholder={t("orgOperations.rolePh")} />
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => void submitStaff()}>
              <Text style={styles.ctaTxt}>{t("orgOperations.createStaffLogin")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === "inv" ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("orgOperations.skuOptional")}</Text>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} />
            <Text style={styles.label}>{t("orgOperations.productName")}</Text>
            <TextInput style={styles.input} value={invName} onChangeText={setInvName} />
            <Text style={styles.label}>{t("orgOperations.quantity")}</Text>
            <TextInput style={styles.input} value={invQty} onChangeText={setInvQty} keyboardType="decimal-pad" />
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => void submitInv()}>
              <Text style={styles.ctaTxt}>{t("orgOperations.addStockLine")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === "bc" ? (
          <View style={styles.card}>
            <Text style={styles.label}>{t("orgOperations.broadcastTitle")}</Text>
            <TextInput style={styles.input} value={bcTitle} onChangeText={setBcTitle} />
            <Text style={styles.label}>{t("orgOperations.broadcastMessage")}</Text>
            <TextInput style={[styles.input, { minHeight: 100 }]} value={bcBody} onChangeText={setBcBody} multiline />
            <Text style={styles.hint}>{t("orgOperations.broadcastHint")}</Text>
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => void submitBc()}>
              <Text style={styles.ctaTxt}>{t("orgOperations.sendBroadcast")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === "wait" ? (
          <View style={styles.card}>
            <Text style={styles.hint}>{t("orgOperations.waitlistHint")}</Text>
            {waitlist.length === 0 ? (
              <Text style={styles.muted}>{t("orgOperations.waitlistEmpty")}</Text>
            ) : (
              waitlist.map((w) => (
                <View key={String(w.id)} style={styles.wlRow}>
                  <Text style={styles.wlTxt}>#{String(w.id)} · user {String(w.owner_user_id)}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
      </OrgScreenKeyboardAvoiding>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  head: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "900", color: "#0f172a" },
  tabs: { flexWrap: "wrap", gap: 4, paddingHorizontal: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 10, paddingVertical: 8 },
  tabTxt: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  scroll: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#e2e8f0" },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 12,
    fontSize: 15,
  },
  hint: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 18 },
  muted: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  cta: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  ctaTxt: { color: "#fff", fontWeight: "900", fontSize: 15 },
  wlRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  wlTxt: { fontSize: 14, color: "#0f172a" },
});
