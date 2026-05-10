import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

type Cust = {
  customer_user_id: number;
  full_name?: string | null;
  email?: string | null;
};

type StmtLine = {
  id: number;
  delta_cents: number;
  kind?: string;
  description?: string;
  created_at?: string;
  running_balance_cents?: number;
};

export default function OrgAccountingStatementScreen() {
  const { t } = useLanguage();
  const { customerUserId: paramId } = useLocalSearchParams<{ customerUserId?: string }>();
  const initial = Number.parseInt(String(paramId || ""), 10);
  const [customers, setCustomers] = useState<Cust[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [cid, setCid] = useState<number | null>(Number.isFinite(initial) ? initial : null);
  const [lines, setLines] = useState<StmtLine[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/clinic/customers`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ customers?: Cust[] }>(res);
      if (p.ok) setCustomers(p.data?.customers || []);
    } catch {
      /* */
    }
  }, []);

  const loadStatement = useCallback(async () => {
    if (cid == null || !Number.isFinite(cid)) {
      setLines([]);
      setBalance(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/customers/${cid}/statement`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ statement?: { lines?: StmtLine[]; balance_cents_end?: number } }>(res);
      if (!p.ok) throw new Error("—");
      setLines(p.data?.statement?.lines || []);
      setBalance(Number(p.data?.statement?.balance_cents_end) || 0);
    } catch {
      Alert.alert("", t("orgAccountingStatement.loadError"));
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadStatement();
  }, [loadStatement]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("orgAccountingStatement.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setPickOpen(true)} style={{ padding: 8 }}>
          <Ionicons name="people-outline" size={24} color="#0f766e" />
        </TouchableOpacity>
      </View>

      {cid ? (
        <View style={styles.pickRowTop}>
          <Text style={styles.pickLab}>
            {t("orgAccountingStatement.user")} #{cid} · {t("orgAccountingStatement.balance")} {formatCents(balance)}
          </Text>
          <TouchableOpacity onPress={() => setPickOpen(true)}>
            <Text style={styles.chg}>{t("orgAccountingStatement.change")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pickBig} onPress={() => setPickOpen(true)}>
          <Text style={styles.pickBigTxt}>{t("orgAccountingStatement.tapToChoose")}</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            cid ? (
              <Text style={styles.empty}>{t("orgAccountingStatement.noLines")}</Text>
            ) : (
              <Text style={styles.empty}>{t("orgAccountingStatement.selectCustomer")}</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.memo}>{item.description || item.kind}</Text>
                <Text style={styles.sub}>
                  {(item.delta_cents ?? 0) >= 0 ? "+" : ""}
                  {formatCents(item.delta_cents)} · {item.kind}
                </Text>
                <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
              </View>
              <Text style={styles.run}>{formatCents(item.running_balance_cents)}</Text>
            </View>
          )}
        />
      )}

      <Modal visible={pickOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTit}>{t("orgAccountingStatement.customersWithBookings")}</Text>
            <TouchableOpacity hitSlop={12} style={styles.closeX} onPress={() => setPickOpen(false)}>
              <Ionicons name="close" size={26} />
            </TouchableOpacity>
            <FlatList
              data={customers}
              keyExtractor={(c) => String(c.customer_user_id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickRow}
                  onPress={() => {
                    setCid(item.customer_user_id);
                    setPickOpen(false);
                  }}
                >
                  <Text style={styles.pickName}>
                    {item.full_name || item.email} <Text style={styles.idTag}>#{item.customer_user_id}</Text>
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>{t("orgAccountingStatement.noCustomers")}</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdfa" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#064e3b" },
  pickRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 12,
  },
  pickLab: { flex: 1, fontSize: 14 },
  pickBig: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#ccfbf1",
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  pickBigTxt: { fontWeight: "800", color: "#064e3b" },
  chg: { color: "#2563eb", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  memo: { fontWeight: "700", color: "#0f172a", flexShrink: 1 },
  sub: { marginTop: 4, fontSize: 13, fontWeight: "600", color: "#334155" },
  date: { marginTop: 4, fontSize: 11, color: "#94a3b8" },
  run: { fontWeight: "800", color: "#064e3b", marginLeft: 8 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 16,
  },
  sheetTit: { fontWeight: "900", fontSize: 16, paddingHorizontal: 8, marginBottom: 12, color: "#064e3b" },
  closeX: { position: "absolute", right: 12, top: 12, zIndex: 2 },
  pickRow: { paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pickName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  idTag: { fontSize: 12, color: "#64748b", fontWeight: "600" },
});
