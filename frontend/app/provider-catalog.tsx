import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
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

type ServiceRow = {
  id: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_cents?: number | null;
  is_active: boolean;
};

type StoredUser = { id?: number; role?: string; org_type?: string | null };

const SERVICE_TEMPLATES: Record<string, { titleKey: string; duration: string }[]> = {
  hotel: [
    { titleKey: "providerCatalog.tplHotelOvernight", duration: "1440" },
    { titleKey: "providerCatalog.tplHotelWeekend", duration: "2880" },
    { titleKey: "providerCatalog.tplHotelDay", duration: "480" },
    { titleKey: "providerCatalog.tplHotelLuxury", duration: "1440" },
  ],
  vet: [
    { titleKey: "providerCatalog.tplVetWellness", duration: "45" },
    { titleKey: "providerCatalog.tplVetVaccine", duration: "30" },
    { titleKey: "providerCatalog.tplVetSick", duration: "60" },
    { titleKey: "providerCatalog.tplVetEmergency", duration: "45" },
  ],
  salon: [
    { titleKey: "providerCatalog.tplSalonBath", duration: "90" },
    { titleKey: "providerCatalog.tplSalonFull", duration: "120" },
    { titleKey: "providerCatalog.tplSalonNails", duration: "30" },
  ],
  rescue: [
    { titleKey: "providerCatalog.tplRescueMeet", duration: "60" },
    { titleKey: "providerCatalog.tplRescueFoster", duration: "45" },
  ],
  petshop: [
    { titleKey: "providerCatalog.tplPetshopConsult", duration: "30" },
    { titleKey: "providerCatalog.tplPetshopPickup", duration: "15" },
    { titleKey: "providerCatalog.tplPetshopDelivery", duration: "60" },
  ],
  trainer: [
    { titleKey: "providerCatalog.tplTrainerIntro", duration: "60" },
    { titleKey: "providerCatalog.tplTrainerAggression", duration: "90" },
    { titleKey: "providerCatalog.tplTrainerWalkTrain", duration: "45" },
  ],
  petsitter: [
    { titleKey: "providerCatalog.tplSitterDropIn", duration: "30" },
    { titleKey: "providerCatalog.tplSitterWalk", duration: "45" },
    { titleKey: "providerCatalog.tplSitterOvernight", duration: "1440" },
  ],
};

export default function ProviderCatalogScreen() {
  const { t, isRTL } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row";
  const tplRowDir = isRTL ? "row-reverse" : "row";
  const [orgOk, setOrgOk] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [orgType, setOrgType] = useState<string>("vet");
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [priceTry, setPriceTry] = useState("");
  const [description, setDescription] = useState("");

  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);
  const templates = useMemo(() => {
    const k = orgType.trim().toLowerCase();
    return SERVICE_TEMPLATES[k] ?? SERVICE_TEMPLATES.vet;
  }, [orgType]);

  const gate = useCallback(async () => {
    setHydrated(false);
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const u = JSON.parse(raw) as StoredUser;
      const role = String(u?.role ?? "")
        .trim()
        .toLowerCase();
      if (role !== "org" && role !== "org_staff") {
        router.replace("/home");
        return;
      }
      setOrgOk(true);
      setOrgType(String(u.org_type || "vet"));

      const res = await fetch(`${API_BASE_URL}/api/org/me`, {
        headers: await getAuthHeaders(false),
      });
      const data = (await res.json().catch(() => ({}))) as {
        organization?: { org_type?: string };
      };
      if (res.ok && data.organization?.org_type)
        setOrgType(String(data.organization.org_type));
    } catch {
      router.replace("/login");
    } finally {
      setHydrated(true);
    }
  }, []);

  const loadServices = useCallback(async () => {
    if (!orgOk) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/services`, {
        headers: await getAuthHeaders(false),
      });
      const data = (await res.json()) as { services?: ServiceRow[]; error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setRows(data.services || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orgOk]);

  useFocusEffect(
    useCallback(() => {
      void gate();
    }, [gate])
  );

  useFocusEffect(
    useCallback(() => {
      void loadServices();
    }, [loadServices])
  );

  const persistToggle = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/services/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      await loadServices();
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : "—");
    }
  };

  const applyTemplate = (titleKey: string, dur: string) => {
    setTitle(t(titleKey));
    setDuration(dur);
  };

  const submitAdd = async () => {
    const tit = title.trim();
    if (!tit) {
      Alert.alert("", t("providerCatalog.needTitle"));
      return;
    }
    const dm = Number.parseInt(duration.trim(), 10);
    const duration_minutes = Number.isFinite(dm) && dm >= 15 ? dm : 60;
    let price_cents: number | null = null;
    const p = priceTry.trim().replace(",", ".");
    if (p) {
      const n = Number.parseFloat(p);
      if (!Number.isFinite(n) || n < 0) {
        Alert.alert("", t("providerCatalog.badPrice"));
        return;
      }
      price_cents = Math.round(n * 100);
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/services`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          title: tit,
          description: description.trim() || null,
          duration_minutes,
          price_cents,
          is_active: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setTitle("");
      setDuration("60");
      setPriceTry("");
      setDescription("");
      Alert.alert("", t("providerCatalog.saved"));
      await loadServices();
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : "—");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || !orgOk) {
    return (
      <View style={[styles.centered, styles.fill]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBg} />

      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={[styles.heroRow, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBack}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitles}>
            <View style={[styles.kickerChip, { flexDirection: rowDir }]}>
              <Ionicons name={theme.icon} size={14} color="#fff" />
              <Text style={styles.kickerTxt}>{t(theme.kickerKey)}</Text>
            </View>
            <Text style={styles.heroTitle}>{t("providerCatalog.title")}</Text>
            <Text style={styles.heroSub}>{t("providerCatalog.subtitle")}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollOuter}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.handleTrack}>
          <View style={styles.handle} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color={theme.accent} />
        ) : rows.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: theme.accentSoft }]}>
            <Ionicons name="clipboard-outline" size={36} color={theme.accent} />
            <Text style={styles.empty}>{t("providerCatalog.empty")}</Text>
          </View>
        ) : (
          rows.map((s) => (
            <View key={s.id} style={[styles.listCard, styles.shadowCard, { borderLeftColor: theme.accent }]}>
              <View style={[styles.cardTop, { flexDirection: rowDir }]}>
                <View style={[styles.typeDot, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="paw-outline" size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  {s.description ? (
                    <Text style={styles.cardDesc} numberOfLines={3}>
                      {s.description}
                    </Text>
                  ) : null}
                  <Text style={styles.meta}>
                    {s.duration_minutes != null ? `${s.duration_minutes} min` : "—"}
                    {s.price_cents != null ? ` · ${(s.price_cents / 100).toFixed(2)}` : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { backgroundColor: s.is_active ? theme.accent : "#94a3b8" },
                  ]}
                  onPress={() => void persistToggle(s.id, !s.is_active)}
                >
                  <Text style={styles.pillTxt}>
                    {s.is_active ? t("providerCatalog.active") : t("providerCatalog.inactive")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={[styles.sectionHead, { flexDirection: rowDir }]}>
          <View style={[styles.sectionBar, { backgroundColor: theme.accent }]} />
          <Text style={styles.sectionTitle}>{t("providerCatalog.addTitle")}</Text>
        </View>

        <Text style={styles.templatesLead}>{t("providerCatalog.templatesSection")}</Text>
        <Text style={styles.templatesHint}>{t("providerCatalog.templatesHint")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tplScroll, { flexDirection: tplRowDir }]}
        >
          {templates.map((tpl) => (
            <TouchableOpacity
              key={tpl.titleKey}
              style={[styles.tplChip, { borderColor: theme.accent }]}
              onPress={() => applyTemplate(tpl.titleKey, tpl.duration)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tplChipTxt, { color: theme.accent }]} numberOfLines={2}>
                {t(tpl.titleKey)}
              </Text>
              <Text style={styles.tplDur}>{t("providerCatalog.durationChipMinutes", { n: tpl.duration })}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("providerCatalog.namePh")}
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("providerCatalog.descPh")}
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.inputMultiline]}
          multiline
        />
        <Text style={styles.formLabel}>{t("providerCatalog.durationLabel")}</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholder={t("providerCatalog.durationPlaceholder")}
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
        <Text style={styles.formLabel}>{t("providerCatalog.priceLabel")}</Text>
        <TextInput
          value={priceTry}
          onChangeText={setPriceTry}
          keyboardType="decimal-pad"
          placeholder={t("providerCatalog.priceOptionalPlaceholder")}
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: theme.accent }, saving && { opacity: 0.75 }]}
          disabled={saving}
          onPress={() => void submitAdd()}
          activeOpacity={0.92}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={[styles.ctaInner, { flexDirection: rowDir }]}>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.ctaTxt}>{t("providerCatalog.save")}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f1f5f9" },
  fill: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { justifyContent: "center", alignItems: "center" },
  heroBg: { position: "absolute", left: 0, right: 0, top: 0, height: 200 },
  safeTop: { zIndex: 1 },
  heroRow: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: "flex-start",
    gap: 14,
  },
  heroBack: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  heroTitles: { flex: 1 },
  kickerChip: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  kickerTxt: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },
  heroTitle: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.92)", marginTop: 8, lineHeight: 20 },
  scrollOuter: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -12,
  },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  handleTrack: { alignItems: "center", paddingTop: 10, paddingBottom: 8 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1" },
  emptyCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginBottom: 16,
    gap: 12,
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  shadowCard: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTop: { alignItems: "flex-start", gap: 12 },
  typeDot: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  cardDesc: { fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 18 },
  meta: { fontSize: 12, color: "#64748b", marginTop: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pillTxt: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  empty: { fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 21 },
  sectionHead: { alignItems: "center", marginTop: 8, marginBottom: 8, gap: 10 },
  sectionBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: "900", color: "#0f172a" },
  templatesLead: { fontSize: 14, fontWeight: "800", color: "#334155", marginBottom: 4 },
  templatesHint: { fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 17 },
  tplScroll: { gap: 10, paddingBottom: 14, alignItems: "stretch" },
  tplChip: {
    maxWidth: 200,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "#fff",
  },
  tplChipTxt: { fontSize: 13, fontWeight: "800", lineHeight: 18 },
  tplDur: { fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: "700" },
  formLabel: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  cta: {
    marginTop: 8,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  ctaInner: { alignItems: "center", gap: 10 },
  ctaTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
