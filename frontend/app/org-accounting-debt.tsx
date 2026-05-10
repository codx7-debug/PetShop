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
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type Debtor = {
  customer_user_id: number;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  balance_cents?: number | string;
  last_movement_at?: string;
};

export default function OrgAccountingDebtScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [payCust, setPayCust] = useState<Debtor | null>(null);
  const [amt, setAmt] = useState("");
  const [memo, setMemo] = useState("");
  const [chgCust, setChgCust] = useState<Debtor | null>(null);
  const [chgAmt, setChgAmt] = useState("");
  const [chgDesc, setChgDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/debtors`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ debtors?: Debtor[] }>(res);
      if (p.ok) setRows(p.data?.debtors || []);
    } catch {
      Alert.alert("", t("orgAccountingDebt.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pay = async () => {
    if (!payCust) return;
    const cents = Math.round(Number.parseFloat(amt.replace(",", ".")) * 100);
    if (!(cents > 0)) {
      Alert.alert("", t("orgAccountingDebt.amountRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/org/accounting/customers/${payCust.customer_user_id}/payments`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ amount_cents: cents, memo: memo.trim() || "Payment received" }),
        }
      );
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      Alert.alert("", t("orgAccountingDebt.recorded"));
      setPayCust(null);
      setAmt("");
      setMemo("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingDebt.recordPaymentError"));
    } finally {
      setSaving(false);
    }
  };

  const chgSave = async () => {
    if (!chgCust) return;
    const cents = Math.round(Number.parseFloat(chgAmt.replace(",", ".")) * 100);
    if (!(cents > 0)) {
      Alert.alert("", t("orgAccountingDebt.chargeAmount"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/org/accounting/customers/${chgCust.customer_user_id}/charges`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            amount_cents: cents,
            description: chgDesc.trim() || "Manual charge",
          }),
        }
      );
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      Alert.alert("", t("orgAccountingDebt.chargeAdded"));
      setChgCust(null);
      setChgAmt("");
      setChgDesc("");
      void load();
    } catch {
      Alert.alert("", t("orgAccountingDebt.chargeError"));
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
        <Text style={styles.title}>{t("orgAccountingDebt.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => void load()} style={{ padding: 8 }}>
          <Ionicons name="refresh-outline" size={24} color="#b45309" />
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>{t("orgAccountingDebt.disclaimer")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.customer_user_id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgAccountingDebt.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.full_name || item.email || `#${item.customer_user_id}`}
              </Text>
              <Text style={styles.bal}>{formatCents(Number(item.balance_cents) || 0)} {t("orgAccountingDebt.outstanding")}</Text>
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.btnPay} onPress={() => setPayCust(item)}>
                  <Text style={styles.btnPayTxt}>{t("orgAccountingDebt.recordPayment")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnChg} onPress={() => setChgCust(item)}>
                  <Text style={styles.btnChgTxt}>{t("orgAccountingDebt.addCharge")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnStmt} onPress={() =>
                  router.push({
                    pathname: "/org-accounting-statement",
                    params: { customerUserId: String(item.customer_user_id) },
                  })
                }>
                  <Text style={styles.btnStmtTxt}>{t("orgAccountingDebt.statement")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet
        visible={payCust != null}
        onRequestClose={() => setPayCust(null)}
        animationType="fade"
      >
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgAccountingDebt.recordPayment")}</Text>
          <TextInput placeholder={t("orgAccountingDebt.amountPh")} keyboardType="decimal-pad" style={styles.inp} value={amt} onChangeText={setAmt} />
          <TextInput style={styles.inp} value={memo} onChangeText={setMemo} placeholder={t("orgAccountingDebt.memoPh")} />
          <View style={styles.sheetRow}>
            <TouchableOpacity onPress={() => setPayCust(null)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} disabled={saving} onPress={() => void pay()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okTxt}>{t("orgAccountingDebt.save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>

      <OrgKeyboardModalSheet
        visible={chgCust != null}
        onRequestClose={() => setChgCust(null)}
        animationType="fade"
      >
        <View style={styles.sheet}>
          <Text style={styles.sheetTit}>{t("orgAccountingDebt.manualCharge")}</Text>
          <TextInput placeholder={t("orgAccountingDebt.amountPh")} keyboardType="decimal-pad" style={styles.inp} value={chgAmt} onChangeText={setChgAmt} />
          <TextInput style={styles.inp} value={chgDesc} onChangeText={setChgDesc} placeholder={t("orgAccountingDebt.descriptionPh")} />
          <View style={styles.sheetRow}>
            <TouchableOpacity onPress={() => setChgCust(null)}>
              <Text style={styles.cancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ok} disabled={saving} onPress={() => void chgSave()}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.okTxt}>{t("orgAccountingDebt.save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffbeb" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#92400e" },
  disclaimer: {
    paddingHorizontal: 18,
    fontSize: 12,
    color: "#92400e",
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#92400e", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  name: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  bal: { marginTop: 6, fontSize: 18, fontWeight: "900", color: "#b45309" },
  meta: { marginTop: 4, fontSize: 13, color: "#64748b" },
  btnPay: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    alignItems: "center",
  },
  btnPayTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  btnChg: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#b45309",
    borderRadius: 10,
    alignItems: "center",
  },
  btnChgTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  btnStmt: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  btnStmtTxt: { color: "#0f172a", fontWeight: "800", fontSize: 12 },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  sheetTit: { fontWeight: "900", fontSize: 17, marginBottom: 12, color: "#92400e" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 10,
  },
  sheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 16, alignItems: "center" },
  cancel: { fontWeight: "700", color: "#64748b" },
  ok: {
    backgroundColor: "#b45309",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 96,
    alignItems: "center",
  },
  okTxt: { color: "#fff", fontWeight: "800" },
});
