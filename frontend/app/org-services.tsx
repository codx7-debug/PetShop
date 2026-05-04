import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";

const ORG_DRAFT_KEY = "@petshop_org_registration_draft";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type Draft = {
  orgName: string;
  phone: string;
  email: string;
  password: string;
  orgNumber: string;
};

const SERVICE_OPTIONS = [
  { id: "vet", icon: "medical-outline" as const, labelKey: "orgServices.serviceVet" },
  { id: "salon", icon: "paw-outline" as const, labelKey: "orgServices.serviceSalon" },
  { id: "hotel", icon: "bed-outline" as const, labelKey: "orgServices.serviceHotel" },
  { id: "rescue", icon: "heart-outline" as const, labelKey: "orgServices.serviceRescue" },
  { id: "petshop", icon: "bag-handle-outline" as const, labelKey: "orgServices.servicePetshop" },
  { id: "trainer", icon: "school-outline" as const, labelKey: "orgServices.serviceTrainer" },
  { id: "petsitter", icon: "home-outline" as const, labelKey: "orgServices.servicePetsitter" },
];

export default function OrgServicesScreen() {
  const { t, isRTL } = useLanguage();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ORG_DRAFT_KEY);
        if (!raw) {
          if (!cancelled) {
            Alert.alert("", t("orgServices.missingDraft"));
            router.replace("/login");
          }
          return;
        }
        const parsed = JSON.parse(raw) as Draft;
        if (!parsed?.email || !parsed?.orgName) {
          if (!cancelled) {
            router.replace("/login");
          }
          return;
        }
        if (!cancelled) setDraft(parsed);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev[0] === id ? [] : [id]));
  };

  const submit = async () => {
    if (!draft) return;
    if (selected.length !== 1) {
      Alert.alert("", t("orgServices.pickOne"));
      return;
    }
    setLoading(true);
    try {
      const body = {
        email: draft.email.trim().toLowerCase(),
        password: draft.password,
        role: "org",
        org_name: draft.orgName.trim(),
        org_contact: draft.phone.trim(),
        full_name: draft.orgName.trim(),
        org_type: selected[0],
      };
      let res: Response | null = null;
      try {
        res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        res = null;
      }
      if (res && !res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        if (res.status === 409) {
          Alert.alert("", data.message || t("login.errRegisterFailed"));
          return;
        }
      }
      await AsyncStorage.multiRemove([ORG_DRAFT_KEY, "@petshop_org_services"]);
      await AsyncStorage.setItem("@petshop_org_services", JSON.stringify(selected));
      router.replace("/org-pending");
    } finally {
      setLoading(false);
    }
  };

  const ta = { writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr", textAlign: (isRTL ? "right" : "left") as "left" | "right" };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#036672" />
          <Text style={styles.backText}>{t("orgServices.back")}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, ta]}>{t("orgServices.title")}</Text>
        <Text style={[styles.sub, ta]}>{t("orgServices.subtitle")}</Text>

        <View style={styles.grid}>
          {SERVICE_OPTIONS.map((opt) => {
            const on = selected[0] === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggle(opt.id)}
                activeOpacity={0.85}
              >
                <Ionicons name={opt.icon} size={26} color={on ? "#fff" : "#2B9B7A"} />
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{t(opt.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submit, loading && { opacity: 0.7 }]}
          onPress={() => void submit()}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{t("orgServices.submit")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F5F9" },
  topRow: { paddingHorizontal: 16, paddingVertical: 8, alignItems: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { fontSize: 16, fontWeight: "600", color: "#036672" },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "800", color: "#0A2540", marginBottom: 8 },
  sub: { fontSize: 14, color: "#5c6b7a", marginBottom: 24, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  chip: {
    width: "47%",
    minHeight: 100,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#e0e8ef",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chipOn: { backgroundColor: "#2B9B7A", borderColor: "#2B9B7A" },
  chipLabel: { fontSize: 14, fontWeight: "700", color: "#0A2540", textAlign: "center" },
  chipLabelOn: { color: "#fff" },
  submit: {
    backgroundColor: "#2B9B7A",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2B9B7A",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
