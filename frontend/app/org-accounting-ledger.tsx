import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Cat = { id: number; name: string; kind?: string };
type Line = {
  id: number;
  flow: string;
  amount_cents: number;
  memo?: string | null;
  line_at?: string;
  category_name?: string | null;
};

export default function OrgAccountingLedgerScreen() {
  const { t } = useLanguage();
  const [cats, setCats] = useState<Cat[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<"in" | "out">("in");
  const [catId, setCatId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/org/accounting/categories`, { headers: await getAuthHeaders(false) }),
        fetch(`${API_BASE_URL}/api/org/accounting/ledger`, { headers: await getAuthHeaders(false) }),
      ]);
      const cP = await parseResponseJson<{ categories?: Cat[] }>(cRes);
      const lP = await parseResponseJson<{ lines?: Line[] }>(lRes);
      if (cP.ok) setCats(cP.data?.categories || []);
      if (lP.ok) setLines(lP.data?.lines || []);
    } catch {
      Alert.alert("", t("orgAccountingLedger.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/categories`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ name: newCat.trim(), kind: "expense" }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setNewCat("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingLedger.addCategoryError"));
    } finally {
      setSaving(false);
    }
  };

  const saveLine = async () => {
    const cents = Math.round(Number.parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      Alert.alert("", t("orgAccountingLedger.enterPositiveAmount"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/ledger`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          flow,
          amount_cents: cents,
          category_id: catId ? Number.parseInt(catId, 10) : null,
          memo: memo.trim() || null,
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      setOpen(false);
      setAmount("");
      setMemo("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingLedger.saveLineError"));
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
        <Text style={styles.title}>{t("orgAccountingLedger.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#0f766e" />
        </TouchableOpacity>
      </View>
      <View style={styles.catRow}>
        <TextInput
          placeholder={t("orgAccountingLedger.newCategoryPh")}
          style={styles.miniIn}
          value={newCat}
          onChangeText={setNewCat}
        />
        <TouchableOpacity style={styles.miniBtn} onPress={() => void addCategory()} disabled={saving}>
          <Text style={styles.miniBtnTxt}>{t("orgAccountingLedger.add")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgAccountingLedger.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.flow}>{item.flow === "in" ? t("orgAccountingLedger.moneyIn") : t("orgAccountingLedger.moneyOut")}</Text>
                <Text style={item.flow === "in" ? styles.amtIn : styles.amtOut}>
                  {formatCents(item.amount_cents * (item.flow === "in" ? 1 : -1))}
                </Text>
              </View>
              {item.category_name ? (
                <Text style={styles.meta}>{item.category_name}</Text>
              ) : null}
              {item.memo ? <Text style={styles.memo}>{item.memo}</Text> : null}
              {item.line_at ? (
                <Text style={styles.date}>{new Date(item.line_at).toLocaleString()}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgAccountingLedger.registerMovement")}</Text>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setFlow("in")} style={[styles.tab, flow === "in" && styles.tabOn]}>
              <Text style={styles.tabTxt}>{t("orgAccountingLedger.in")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlow("out")} style={[styles.tab, flow === "out" && styles.tabOn]}>
              <Text style={styles.tabTxt}>{t("orgAccountingLedger.out")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lab}>{t("orgAccountingLedger.amount")}</Text>
          <TextInput
            style={styles.inp}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder={t("orgAccountingLedger.amountPh")}
          />
          <Text style={styles.lab}>{t("orgAccountingLedger.categoryOptional")}</Text>
          <TextInput
            style={styles.inp}
            value={catId}
            onChangeText={setCatId}
            placeholder={t("orgAccountingLedger.categoryIdPh")}
            keyboardType="number-pad"
          />
          <Text style={styles.hintSmall}>
            {cats.map((c) => `${c.id}: ${c.name}`).join(" · ").slice(0, 200)}
            {cats.length > 4 ? "…" : ""}
          </Text>
          <Text style={styles.lab}>{t("orgAccountingLedger.memo")}</Text>
          <TextInput style={styles.inp} value={memo} onChangeText={setMemo} />
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} onPress={() => void saveLine()} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okTxt}>{t("orgAccountingLedger.save")}</Text>}
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
  catRow: { flexDirection: "row", paddingHorizontal: 14, gap: 8, marginBottom: 8 },
  miniIn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  miniBtn: { backgroundColor: "#0f766e", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" },
  miniBtnTxt: { color: "#fff", fontWeight: "800" },
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
  flow: { fontWeight: "800", color: "#0f172a" },
  amtIn: { fontWeight: "800", color: "#047857" },
  amtOut: { fontWeight: "800", color: "#b91c1c" },
  meta: { marginTop: 6, fontSize: 12, color: "#64748b" },
  memo: { marginTop: 6, fontSize: 14, color: "#334155" },
  date: { marginTop: 6, fontSize: 11, color: "#94a3b8" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  sheetTit: { fontSize: 18, fontWeight: "800", marginBottom: 12, color: "#064e3b" },
  tabs: { flexDirection: "row", gap: 10, marginBottom: 12 },
  tab: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center" },
  tabOn: { backgroundColor: "#ccfbf1" },
  tabTxt: { fontWeight: "800", color: "#064e3b" },
  lab: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 4 },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  hintSmall: { fontSize: 10, color: "#94a3b8", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 12, alignItems: "center" },
  cancel: { fontWeight: "700", color: "#64748b" },
  ok: { backgroundColor: "#0f766e", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  okTxt: { color: "#fff", fontWeight: "800" },
});
