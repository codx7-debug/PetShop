import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Till = {
  id: number;
  status: string;
  opened_at?: string;
  closed_at?: string | null;
  opening_float_cents?: number;
  closing_counted_cents?: number | null;
};

export default function OrgAccountingTillScreen() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<Till[]>([]);
  const [openSess, setOpenSess] = useState<Till | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<"open" | "close" | null>(null);
  const [floatTxt, setFloatTxt] = useState("0");
  const [notesOpen, setNotesOpen] = useState("");
  const [countTxt, setCountTxt] = useState("");
  const [notesClose, setNotesClose] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/till/sessions`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ sessions?: Till[]; open_session?: Till | null }>(res);
      if (p.ok) {
        setSessions(p.data?.sessions || []);
        setOpenSess(p.data?.open_session ?? null);
      }
    } catch {
      Alert.alert("", t("orgAccountingTill.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const doOpen = async () => {
    const cents = Math.round(Number.parseFloat(floatTxt.replace(",", ".")) * 100);
    if (!Number.isFinite(cents)) {
      Alert.alert("", t("orgAccountingTill.openingFloatRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/till/open`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          opening_float_cents: Number.isFinite(cents) ? cents : 0,
          notes: notesOpen.trim() || null,
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setModalOpen(null);
      setNotesOpen("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingTill.openError"));
    } finally {
      setSaving(false);
    }
  };

  const doClose = async () => {
    if (!openSess) return;
    const cents = Math.round(Number.parseFloat(countTxt.replace(",", ".")) * 100);
    if (!Number.isFinite(cents)) {
      Alert.alert("", t("orgAccountingTill.countedCashRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/till/${openSess.id}/close`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          closing_counted_cents: cents,
          closing_notes: notesClose.trim() || null,
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setModalOpen(null);
      setCountTxt("");
      setNotesClose("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingTill.closeError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgAccountingTill.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void load()} style={{ padding: 8 }}>
          <Ionicons name="refresh-outline" size={24} color="#0f766e" />
        </TouchableOpacity>
      </View>

      {openSess ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTit}>{t("orgAccountingTill.tillOpen")} #{openSess.id}</Text>
          <Text style={styles.bannerSub}>
            {t("orgAccountingTill.opened")} {openSess.opened_at ? new Date(openSess.opened_at).toLocaleString() : "—"}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setModalOpen("close")}>
            <Text style={styles.closeBtnTxt}>{t("orgAccountingTill.closeAndCount")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.openBtn} onPress={() => setModalOpen("open")} activeOpacity={0.9}>
          <Text style={styles.openBtnTxt}>{t("orgAccountingTill.openTill")}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgAccountingTill.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTit}>
                #{item.id} · {item.status === "closed" ? t("orgAccountingTill.closed") : item.status === "open" ? t("orgAccountingTill.open") : item.status}
              </Text>
              <Text style={styles.meta}>
                {item.opened_at ? new Date(item.opened_at).toLocaleString() : ""}
              </Text>
              {item.closed_at ? (
                <Text style={styles.meta}>{t("orgAccountingTill.closed")} {new Date(item.closed_at).toLocaleString()}</Text>
              ) : null}
              <Text style={styles.meta}>
                {t("orgAccountingTill.openingFloat")} ₺{" "}
                {((Number(item.opening_float_cents) || 0) / 100).toFixed(2)}
              </Text>
              {item.closing_counted_cents != null ? (
                <Text style={styles.meta}>
                  {t("orgAccountingTill.counted")} ₺ {(item.closing_counted_cents / 100).toFixed(2)}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={modalOpen === "open"} onRequestClose={() => setModalOpen(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgAccountingTill.openTill")}</Text>
          <TextInput
            placeholder={t("orgAccountingTill.openingFloatPh")}
            keyboardType="decimal-pad"
            style={styles.inp}
            value={floatTxt}
            onChangeText={setFloatTxt}
          />
          <TextInput style={styles.inp} value={notesOpen} onChangeText={setNotesOpen} placeholder={t("orgAccountingTill.notes")} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
            <TouchableOpacity onPress={() => setModalOpen(null)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} onPress={() => void doOpen()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okTxt}>{t("orgAccountingTill.confirm")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>

      <OrgKeyboardModalSheet visible={modalOpen === "close"} onRequestClose={() => setModalOpen(null)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgAccountingTill.closeTill")}</Text>
          <TextInput
            placeholder={t("orgAccountingTill.countedCashPh")}
            keyboardType="decimal-pad"
            style={styles.inp}
            value={countTxt}
            onChangeText={setCountTxt}
          />
          <TextInput
            style={styles.inp}
            value={notesClose}
            onChangeText={setNotesClose}
            placeholder={t("orgAccountingTill.closingNotes")}
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
            <TouchableOpacity onPress={() => setModalOpen(null)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} onPress={() => void doClose()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okTxt}>{t("orgAccountingTill.confirm")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdfa" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#064e3b" },
  banner: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 10,
  },
  bannerTit: { fontWeight: "900", color: "#92400e" },
  bannerSub: { marginTop: 4, fontSize: 12, color: "#b45309" },
  closeBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#b45309",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeBtnTxt: { color: "#fff", fontWeight: "800" },
  openBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#0f766e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  openBtnTxt: { fontWeight: "900", color: "#fff", fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  cardTit: { fontWeight: "800", color: "#064e3b" },
  meta: { marginTop: 4, fontSize: 12, color: "#64748b" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
  },
  sheetTit: { fontWeight: "900", fontSize: 17, marginBottom: 12, color: "#064e3b" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cancel: { fontWeight: "700", color: "#64748b", paddingVertical: 10 },
  ok: { backgroundColor: "#0f766e", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  okTxt: { color: "#fff", fontWeight: "800" },
});
