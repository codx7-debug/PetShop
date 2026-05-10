import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgScreenKeyboardAvoiding from "../components/org/OrgScreenKeyboardAvoiding";

type Unit = { id: number; label?: string; capacity?: number };
type Stay = Record<string, unknown> & {
  id: number;
  guest_name?: string | null;
  pet_id?: number | null;
  check_in_date?: string;
  check_out_date?: string;
  status?: string;
  unit_id?: number | null;
};

export default function OrgLodgingScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"units" | "stays">("units");
  const [units, setUnits] = useState<Unit[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [cap, setCap] = useState("1");
  const [petId, setPetId] = useState("");
  const [guest, setGuest] = useState("");
  const [inD, setInD] = useState("");
  const [outD, setOutD] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUnits = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/lodging/units`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ units?: Unit[] }>(res);
      if (parsed.ok) setUnits(parsed.data?.units || []);
    } catch {
      /* */
    }
  }, []);

  const loadStays = useCallback(async () => {
    const from = new Date();
    const to = new Date();
    to.setMonth(to.getMonth() + 2);
    try {
      const q = `from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`;
      const res = await fetch(`${API_BASE_URL}/api/org/facility/lodging/stays?${q}`, {
        headers: await getAuthHeaders(false),
      });
      const parsed = await parseResponseJson<{ stays?: Stay[] }>(res);
      if (parsed.ok) setStays(parsed.data?.stays || []);
    } catch {
      /* */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadUnits(), loadStays()]);
    setLoading(false);
  }, [loadUnits, loadStays]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addUnit = async () => {
    if (!label.trim()) return Alert.alert("", t("orgLodging.labelRequired"));
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/lodging/units`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ label: label.trim(), capacity: parseInt(cap, 10) || 1 }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("exists");
      setLabel("");
      void loadUnits();
    } catch {
      Alert.alert("", t("orgLodging.createError"));
    } finally {
      setSaving(false);
    }
  };

  const addStay = async () => {
    const body: Record<string, unknown> = {
      check_in_date: inD.trim(),
      check_out_date: outD.trim(),
      status: "booked",
    };
    const p = petId.trim();
    if (p) body.pet_id = parseInt(p, 10);
    if (guest.trim()) body.guest_name = guest.trim();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/facility/lodging/stays`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setPetId("");
      setGuest("");
      setInD("");
      setOutD("");
      void loadStays();
    } catch {
      Alert.alert("", t("orgLodging.stayValidation"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgLodging.title")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabs}>
        {(["units", "stays"] as const).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.tab, tab === k && styles.tabOn]}
            onPress={() => setTab(k)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabTxt, tab === k && styles.tabTxtOn]}>{k === "units" ? t("orgLodging.rooms") : t("orgLodging.stays")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <OrgScreenKeyboardAvoiding>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          {tab === "units" ? (
            <>
              <Text style={styles.sec}>{t("orgLodging.roomsSection")}</Text>
              {units.map((u) => (
                <View key={u.id} style={styles.card}>
                  <Text style={styles.cardT}>{String(u.label)}</Text>
                  <Text style={styles.cardS}>{t("orgLodging.capacity")} {Number(u.capacity ?? 1)}</Text>
                </View>
              ))}
              <TextInput placeholder={t("orgLodging.newLabelPh")} style={styles.inp} value={label} onChangeText={setLabel} />
              <TextInput placeholder={t("orgLodging.capacityPh")} style={styles.inp} value={cap} onChangeText={setCap} keyboardType="number-pad" />
              <TouchableOpacity style={styles.btn} onPress={() => void addUnit()} disabled={saving}>
                <Text style={styles.btnTx}>{t("orgLodging.addUnit")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sec}>{t("orgLodging.newStay")}</Text>
              <TextInput placeholder={t("orgLodging.petIdPh")} style={styles.inp} value={petId} onChangeText={setPetId} />
              <TextInput placeholder={t("orgLodging.guestNamePh")} style={styles.inp} value={guest} onChangeText={setGuest} />
              <TextInput placeholder={t("orgLodging.checkInPh")} style={styles.inp} value={inD} onChangeText={setInD} />
              <TextInput placeholder={t("orgLodging.checkOutPh")} style={styles.inp} value={outD} onChangeText={setOutD} />
              <TouchableOpacity style={styles.btn} onPress={() => void addStay()} disabled={saving}>
                <Text style={styles.btnTx}>{t("orgLodging.bookStay")}</Text>
              </TouchableOpacity>
              <Text style={[styles.sec, { marginTop: 24 }]}>{t("orgLodging.upcoming")}</Text>
              {stays.map((s) => (
                <View key={s.id} style={styles.card}>
                  <Text style={styles.cardT}>
                    {s.guest_name ? String(s.guest_name) : s.pet_id ? `${t("orgLodging.pet")} #${s.pet_id}` : "—"}
                  </Text>
                  <Text style={styles.cardS}>
                    {String(s.check_in_date)} → {String(s.check_out_date)} · {String(s.status || "")}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        </OrgScreenKeyboardAvoiding>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "android" ? 8 : 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  tabs: { flexDirection: "row", padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "#e2e8f0", alignItems: "center" },
  tabOn: { backgroundColor: "#0369a1" },
  tabTxt: { fontWeight: "800", color: "#475569" },
  tabTxtOn: { color: "#fff" },
  pad: { padding: 16, paddingBottom: 120 },
  sec: { fontSize: 15, fontWeight: "900", color: "#0f172a", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    marginBottom: 10,
  },
  cardT: { fontSize: 16, fontWeight: "800" },
  cardS: { fontSize: 13, color: "#64748b", marginTop: 4 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  btn: { backgroundColor: "#0369a1", padding: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  btnTx: { color: "#fff", fontWeight: "900" },
});
