import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type CardRow = {
  id: number;
  label?: string | null;
  brand: string;
  last_four: string;
  holder_name?: string | null;
  is_default: boolean;
  created_at?: string;
};

type TxRow = {
  id: number;
  amount_cents: number;
  currency: string;
  title: string;
  status: string;
  address_text?: string | null;
  created_at?: string;
};

export default function ProfilePaymentsScreen() {
  const { t, isRTL } = useLanguage();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [last4, setLast4] = useState("");
  const [holder, setHolder] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await getAuthHeaders(false);
      const [cRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/me/payment/cards`, { headers: h }),
        fetch(`${API_BASE_URL}/api/me/payment/transactions?limit=100`, { headers: h }),
      ]);
      const cParsed = await parseResponseJson<{ cards?: CardRow[] }>(cRes);
      const tParsed = await parseResponseJson<{ transactions?: TxRow[] }>(tRes);
      setCards(cParsed.data?.cards || []);
      setTxs(tParsed.data?.transactions || []);
    } catch {
      Alert.alert("", t("userProfile.payLoadFail"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addCard = async () => {
    const four = last4.replace(/\D/g, "").slice(-4);
    if (four.length !== 4) {
      Alert.alert("", t("userProfile.payLast4"));
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/payment/cards`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          last_four: four,
          holder_name: holder.trim() || null,
          brand: "card",
          is_default: cards.length === 0,
        }),
      });
      const parsed = await parseResponseJson<{ error?: string }>(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      setShowAdd(false);
      setLast4("");
      setHolder("");
      await load();
      Alert.alert("", t("userProfile.payCardAdded"));
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : "—");
    } finally {
      setAdding(false);
    }
  };

  const money = (cents: number, cur: string) => {
    const v = (Number(cents) || 0) / 100;
    return `${v.toFixed(2)} ${cur}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#2b415c" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("userProfile.payTitle")}</Text>
        <TouchableOpacity onPress={() => setShowAdd((s) => !s)} style={styles.addTop}>
          <Ionicons name="add-circle-outline" size={26} color="#4361ee" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4361ee" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {showAdd ? (
            <View style={styles.card}>
              <Text style={styles.section}>{t("userProfile.payAddCard")}</Text>
              <Text style={styles.hint}>{t("userProfile.payAddHint")}</Text>
              <Text style={styles.label}>{t("userProfile.payHolder")}</Text>
              <TextInput style={styles.input} value={holder} onChangeText={setHolder} />
              <Text style={styles.label}>{t("userProfile.payLast4Label")}</Text>
              <TextInput
                style={styles.input}
                value={last4}
                onChangeText={setLast4}
                keyboardType="number-pad"
                maxLength={4}
              />
              <TouchableOpacity style={styles.btn} onPress={() => void addCard()} disabled={adding}>
                {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{t("userProfile.save")}</Text>}
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.section}>{t("userProfile.payCards")}</Text>
          {cards.length === 0 ? (
            <Text style={styles.empty}>{t("userProfile.payNoCards")}</Text>
          ) : (
            cards.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Ionicons name="card" size={28} color="#4361ee" />
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.cardTitle}>
                      {c.brand} ·••• {c.last_four}
                    </Text>
                    {c.holder_name ? <Text style={styles.sub}>{c.holder_name}</Text> : null}
                    {c.is_default ? <Text style={styles.badge}>{t("userProfile.payDefault")}</Text> : null}
                  </View>
                </View>
              </View>
            ))
          )}

          <Text style={[styles.section, { marginTop: 22 }]}>{t("userProfile.payHistory")}</Text>
          {txs.length === 0 ? (
            <Text style={styles.empty}>{t("userProfile.payNoTx")}</Text>
          ) : (
            txs.map((x) => (
              <View key={x.id} style={styles.card}>
                <Text style={styles.cardTitle}>{x.title}</Text>
                <Text style={styles.amount}>{money(x.amount_cents, x.currency)}</Text>
                <Text style={styles.sub}>
                  {x.status} · {x.created_at ? new Date(x.created_at).toLocaleString() : "—"}
                </Text>
                {x.address_text ? <Text style={styles.addr}>{x.address_text}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7fe" },
  header: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { padding: 8 },
  addTop: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 48 },
  section: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  hint: { fontSize: 12, color: "#64748b", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: { alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  amount: { fontSize: 18, fontWeight: "800", color: "#059669", marginTop: 6 },
  addr: { fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 18 },
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: "#0369a1",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empty: { color: "#64748b", marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
});
