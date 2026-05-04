import React, { useEffect, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { PetChipSkeletonRow } from "../components/ui/BookingSkeleton";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders } from "../lib/api";

type PetRow = { id: number; name: string };

export default function BookAppointmentScreen() {
  const { t, isRTL } = useLanguage();
  const params = useLocalSearchParams<{
    serviceId: string;
    serviceTitle?: string;
    durationMinutes?: string;
    orgName?: string;
    orgType?: string;
  }>();
  const serviceId = Number(params.serviceId);
  const durationMin = Math.max(15, Number(params.durationMinutes) || 60);

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [petId, setPetId] = useState<number | null>(null);
  const [loadingPets, setLoadingPets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startsIso, setStartsIso] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 26, 0, 0, 0);
    return d.toISOString();
  });

  useEffect(() => {
    (async () => {
      const tok = await AsyncStorage.getItem("token");
      const raw = await AsyncStorage.getItem("user");
      setToken(tok);
      if (raw) {
        try {
          const u = JSON.parse(raw) as { id?: number; role?: string };
          const role = String(u.role || "").toLowerCase();
          if (role === "user" && u.id != null) setUserId(Number(u.id));
        } catch {
          /* */
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || userId == null) return;
    let cancelled = false;
    (async () => {
      setLoadingPets(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/pets/by-owner/${userId}`, {
          headers: await getAuthHeaders(false),
        });
        const data = (await res.json()) as PetRow[] | { error?: string };
        if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setPets(list);
          setPetId((prev) => (prev != null ? prev : list[0]?.id ?? null));
        }
      } catch {
        if (!cancelled) setPets([]);
      } finally {
        if (!cancelled) setLoadingPets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const submit = async () => {
    if (!Number.isFinite(serviceId)) {
      Alert.alert("", t("bookAppointment.badService"));
      return;
    }
    if (!token || userId == null) {
      Alert.alert(t("bookAppointment.needLoginTitle"), t("bookAppointment.needLoginBody"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("bookAppointment.goLogin"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    if (petId == null) {
      Alert.alert("", t("bookAppointment.needPet"));
      return;
    }
    const start = new Date(startsIso);
    if (Number.isNaN(start.getTime())) {
      Alert.alert("", t("bookAppointment.badDate"));
      return;
    }
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    setSubmitting(true);
    try {
      const body = {
        ownerUserId: userId,
        petId,
        serviceId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        displayTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        reminderChannel: "auto",
      };
      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      Alert.alert(t("bookAppointment.successTitle"), t("bookAppointment.successBody"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t("bookAppointment.failTitle"), e instanceof Error ? e.message : "—");
    } finally {
      setSubmitting(false);
    }
  };

  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#0f3d3a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("bookAppointment.title")}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.stepBar, { flexDirection: rowDir }]}>
          <View style={styles.stepBarNumWrap}>
            <Text style={styles.stepBarNum}>3</Text>
          </View>
          <Text style={[styles.stepBarTxt, { textAlign: isRTL ? "right" : "left" }]}>
            {t("browseServices.stepConfirm")}
          </Text>
        </View>
        <Text style={styles.serviceName}>{params.serviceTitle || `#${serviceId}`}</Text>
        {params.orgName ? <Text style={styles.org}>{params.orgName}</Text> : null}

        {!token || userId == null ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTxt}>{t("bookAppointment.signInHint")}</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push("/login")}>
              <Text style={styles.bannerBtnTxt}>{t("bookAppointment.goLogin")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.label}>{t("bookAppointment.petLabel")}</Text>
        {loadingPets ? (
          <PetChipSkeletonRow />
        ) : pets.length === 0 ? (
          <Text style={styles.muted}>{t("bookAppointment.noPets")}</Text>
        ) : (
          <View style={styles.petRow}>
            {pets.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.petChip, petId === p.id && styles.petChipOn]}
                onPress={() => setPetId(p.id)}
              >
                <Text style={[styles.petChipTxt, petId === p.id && styles.petChipTxtOn]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>{t("bookAppointment.startLabel")}</Text>
        <Text style={styles.hint}>{t("bookAppointment.startHint")}</Text>
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => {
            const d = new Date(startsIso);
            d.setDate(d.getDate() + 1);
            setStartsIso(d.toISOString());
          }}
        >
          <Text style={styles.timeTxt}>{new Date(startsIso).toLocaleString()}</Text>
          <Text style={styles.timeTap}>{t("bookAppointment.tapAdvanceDay")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={() => void submit()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitTxt}>{t("bookAppointment.confirm")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F5F9" },
  header: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#0a2540" },
  scroll: { padding: 20, paddingBottom: 48 },
  stepBar: {
    alignItems: "center",
    gap: 12,
    backgroundColor: "#e8f7f3",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#b8e0d4",
  },
  stepBarNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#2B9B7A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBarNum: { color: "#fff", fontWeight: "900", fontSize: 14 },
  stepBarTxt: { flex: 1, fontSize: 13, fontWeight: "800", color: "#0f3d3a", lineHeight: 18 },
  serviceName: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  org: { fontSize: 14, color: "#64748b", marginTop: 4 },
  banner: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  bannerTxt: { fontSize: 14, color: "#9a3412", marginBottom: 10 },
  bannerBtn: { alignSelf: "flex-start", backgroundColor: "#ea580c", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  bannerBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  label: { marginTop: 22, fontSize: 13, fontWeight: "700", color: "#334155" },
  hint: { fontSize: 12, color: "#64748b", marginTop: 4 },
  muted: { fontSize: 14, color: "#64748b", marginTop: 8 },
  petRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  petChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  petChipOn: { backgroundColor: "#2B9B7A", borderColor: "#2B9B7A" },
  petChipTxt: { fontWeight: "600", color: "#334155" },
  petChipTxtOn: { color: "#fff" },
  timeBtn: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeTxt: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  timeTap: { fontSize: 12, color: "#64748b", marginTop: 6 },
  submit: {
    marginTop: 28,
    backgroundColor: "#2B9B7A",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitTxt: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
