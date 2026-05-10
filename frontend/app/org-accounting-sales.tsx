import React, { useState } from "react";
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

type LineDraft = {
  inventory_item_id: string;
  description: string;
  quantity: string;
  unit_price: string;
};

export default function OrgAccountingSalesScreen() {
  const { t } = useLanguage();
  const [channel, setChannel] = useState("pos");
  const [payment, setPayment] = useState<"cash" | "card" | "account">("cash");
  const [customerUserId, setCustomerUserId] = useState("");
  const [paidTry, setPaidTry] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { inventory_item_id: "", description: "", quantity: "1", unit_price: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const paid_cents =
      paidTry.trim() === ""
        ? undefined
        : Math.round(Number.parseFloat(paidTry.replace(",", ".")) * 100);
    const bod = lines
      .map((l) => ({
        inventory_item_id: l.inventory_item_id.trim() ? Number.parseInt(l.inventory_item_id.trim(), 10) : null,
        description: l.description.trim() || "Item",
        quantity: Number.parseFloat(l.quantity.replace(",", ".")) || 1,
        unit_price_cents: Math.round(Number.parseFloat(l.unit_price.replace(",", ".")) * 100),
      }))
      .filter((l) => l.unit_price_cents >= 0 && Number.isFinite(l.quantity) && l.quantity > 0);
    if (!bod.length) {
      Alert.alert("", t("orgAccountingSales.atLeastOneLine"));
      return;
    }

    const payload: Record<string, unknown> = {
      channel,
      payment_method: payment,
      lines: bod,
      notes: notes.trim() || null,
    };
    if (customerUserId.trim()) payload.customer_user_id = Number.parseInt(customerUserId.trim(), 10);
    if (payment === "account" && paid_cents !== undefined) payload.paid_cents = paid_cents;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/sales`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const p = await parseResponseJson<{ error?: string }>(res);
      if (!p.ok) throw new Error(p.data?.error || "—");
      Alert.alert("", t("orgAccountingSales.saleRecorded"));
      setLines([{ inventory_item_id: "", description: t("orgAccountingSales.saleLine"), quantity: "1", unit_price: "" }]);
      setPaidTry("");
    } catch {
      Alert.alert("", t("orgAccountingSales.saleFailed"));
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
        <Text style={styles.title}>{t("orgAccountingSales.title")}</Text>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.lab}>{t("orgAccountingSales.payment")}</Text>
        <View style={styles.tabs}>
          {(["cash", "card", "account"] as const).map((pm) => (
            <TouchableOpacity
              key={pm}
              onPress={() => setPayment(pm)}
              style={[styles.tab, payment === pm && styles.tabOn]}
            >
            <Text style={styles.tabTxt}>{t(`orgAccountingSales.payment${pm.charAt(0).toUpperCase()}${pm.slice(1)}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {payment === "account" ? (
          <>
            <Text style={styles.lab}>{t("orgAccountingSales.customerUserId")}</Text>
            <TextInput
              style={styles.inp}
              value={customerUserId}
              onChangeText={setCustomerUserId}
              keyboardType="number-pad"
              placeholder={t("orgAccountingSales.customerUserIdPh")}
            />
            <Text style={styles.lab}>{t("orgAccountingSales.paidNow")}</Text>
            <TextInput style={styles.inp} value={paidTry} onChangeText={setPaidTry} keyboardType="decimal-pad" />
          </>
        ) : null}

        <Text style={styles.lab}>{t("orgAccountingSales.channel")}</Text>
        <TextInput style={styles.inp} value={channel} onChangeText={setChannel} placeholder={t("orgAccountingSales.channelPh")} />

        {lines.map((ln, idx) => (
          <View key={idx} style={styles.lineBlk}>
            <Text style={styles.lineTit}>{t("orgAccountingSales.line")} {idx + 1}</Text>
            <TextInput
              style={styles.inpSm}
              placeholder={t("orgAccountingSales.inventoryIdPh")}
              keyboardType="number-pad"
              value={ln.inventory_item_id}
              onChangeText={(x) =>
                setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, inventory_item_id: x } : p)))
              }
            />
            <TextInput
              style={styles.inpSm}
              value={ln.description}
              onChangeText={(x) =>
                setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, description: x } : p)))
              }
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[styles.inpSm, { flex: 1 }]}
                keyboardType="decimal-pad"
                value={ln.quantity}
                onChangeText={(x) =>
                  setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: x } : p)))
                }
                placeholder={t("orgAccountingSales.qtyPh")}
              />
              <TextInput
                style={[styles.inpSm, { flex: 1 }]}
                keyboardType="decimal-pad"
                value={ln.unit_price}
                onChangeText={(x) =>
                  setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, unit_price: x } : p)))
                }
                placeholder={t("orgAccountingSales.pricePh")}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addLn} onPress={() => setLines((p) => [...p, {
          inventory_item_id: "",
          description: t("orgAccountingSales.saleLine"),
          quantity: "1",
          unit_price: "",
        }])}>
          <Text style={styles.addLnTxt}>+ {t("orgAccountingSales.addLine")}</Text>
        </TouchableOpacity>

        <Text style={styles.lab}>{t("orgAccountingSales.notes")}</Text>
        <TextInput style={styles.inp} value={notes} onChangeText={setNotes} />

        <TouchableOpacity style={styles.primary} disabled={saving} onPress={() => void submit()}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>{t("orgAccountingSales.submitSale")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0fdfa" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 },
  back: { padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: "#064e3b" },
  pad: { paddingHorizontal: 16, paddingBottom: 40 },
  lab: { fontWeight: "700", color: "#475569", marginBottom: 4 },
  inp: {
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inpSm: {
    borderWidth: 1,
    borderColor: "#ccfbf1",
    borderRadius: 10,
    padding: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  tabOn: { backgroundColor: "#99f6e4" },
  tabTxt: { fontWeight: "800", color: "#064e3b", textTransform: "capitalize" },
  lineBlk: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    marginBottom: 10,
  },
  lineTit: { fontWeight: "800", marginBottom: 8, color: "#064e3b" },
  addLn: { padding: 12, alignItems: "center" },
  addLnTxt: { fontWeight: "800", color: "#0f766e" },
  primary: {
    backgroundColor: "#0f766e",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
