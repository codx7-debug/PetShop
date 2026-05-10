import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { formatCents } from "../lib/money";
import { useLanguage } from "../contexts/LanguageContext";

type Inv = {
  id: number;
  name: string;
  sku?: string | null;
  quantity?: number | string;
};

export default function OrgAccountingBarcodeScreen() {
  const { t } = useLanguage();
  const [sku, setSku] = useState("");
  const [item, setItem] = useState<Inv | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const lookup = async () => {
    if (!sku.trim()) {
      Alert.alert("", t("orgAccountingBarcode.scanOrEnter"));
      return;
    }
    setLoading(true);
    setWarn(null);
    setItem(null);
    try {
      const q = encodeURIComponent(sku.trim());
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/inventory-scan?sku=${q}`, {
        headers: await getAuthHeaders(false),
      });
      const p = await parseResponseJson<{ item?: Inv | null; ambiguous?: boolean; matches?: number }>(res);
      if (!p.ok) throw new Error("—");
      if (!p.data?.item) {
        Alert.alert("", t("orgAccountingBarcode.noProduct"));
        return;
      }
      setItem(p.data.item);
      if (p.data.ambiguous)
        setWarn(`Multiple inventory rows share this SKU (${p.data.matches ?? "?"} matches) — showing the first id.`);
    } catch {
      Alert.alert("", t("orgAccountingBarcode.lookupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const sellCash = async () => {
    if (!item) return;
    const q = Number.parseFloat(qty.replace(",", "."));
    const pcents = Math.round(Number.parseFloat(price.replace(",", ".")) * 100);
    if (!(q > 0) || !(pcents >= 0)) {
      Alert.alert("", t("orgAccountingBarcode.qtyPriceRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/sales`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          channel: "barcode",
          payment_method: "cash",
          lines: [
            {
              inventory_item_id: item.id,
              description: item.name,
              quantity: q,
              unit_price_cents: pcents,
            },
          ],
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      Alert.alert("", t("orgAccountingBarcode.sold"));
      setSku("");
      setItem(null);
    } catch {
      Alert.alert("", t("orgAccountingBarcode.saleFailed"));
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
        <Text style={styles.title}>{t("orgAccountingBarcode.title")}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.lab}>{t("orgAccountingBarcode.barcodeSku")}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput style={[styles.inp, { flex: 1 }]} value={sku} onChangeText={setSku} autoCapitalize="none" />
          <TouchableOpacity style={styles.go} onPress={() => void lookup()} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.goTxt}>{t("orgAccountingBarcode.lookup")}</Text>}
          </TouchableOpacity>
        </View>

        {item ? (
          <View style={styles.card}>
            <Text style={styles.nm}>{item.name}</Text>
            <Text style={styles.sm}>#{item.id} · {t("orgAccountingBarcode.stock")} ≈ {String(item.quantity)}</Text>
            {warn ? <Text style={styles.warn}>{warn}</Text> : null}

            <Text style={styles.lab}>{t("orgAccountingBarcode.quantity")}</Text>
            <TextInput style={styles.inp} value={qty} onChangeText={setQty} keyboardType="decimal-pad" />

            <Text style={styles.lab}>{t("orgAccountingBarcode.retailUnitPrice")}</Text>
            <TextInput style={styles.inp} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

            <TouchableOpacity style={styles.primary} onPress={() => void sellCash()} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryTxt}>{t("orgAccountingBarcode.cashSale")} {price ? `@ ${formatCents(Math.round(Number.parseFloat(price) * 100))}` : ""}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
  },
  go: {
    justifyContent: "center",
    backgroundColor: "#0f766e",
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  goTxt: { color: "#fff", fontWeight: "800" },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  nm: { fontSize: 18, fontWeight: "900", color: "#064e3b" },
  sm: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  warn: { fontSize: 12, color: "#c2410c", marginBottom: 8 },
  primary: {
    marginTop: 12,
    backgroundColor: "#0f766e",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryTxt: { color: "#fff", fontWeight: "800" },
});
