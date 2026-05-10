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
type Inv = { id: number; name: string; sku?: string | null; quantity?: string | number };
type LineDraft = {
  inventory_item_id: string;
  description: string;
  quantity: string;
  unit_cost: string;
};

export default function OrgAccountingPurchasesScreen() {
  const { t } = useLanguage();
  const [invHint, setInvHint] = useState<Inv[]>([]);
  const [vendor, setVendor] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { inventory_item_id: "", description: "", quantity: "1", unit_cost: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [loadingInv, setLoadingInv] = useState(true);

  const loadInv = useCallback(async () => {
    setLoadingInv(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/inventory`, { headers: await getAuthHeaders(false) });
      const p = await parseResponseJson<{ items?: Inv[] }>(res);
      if (p.ok) setInvHint(p.data?.items || []);
    } catch {
      /* */
    } finally {
      setLoadingInv(false);
    }
  }, []);

  React.useEffect(() => {
    void loadInv();
  }, [loadInv]);

  const submit = async () => {
    const bod = lines
      .map((l) => ({
        inventory_item_id: l.inventory_item_id.trim() ? Number.parseInt(l.inventory_item_id.trim(), 10) : null,
        description: l.description.trim() || "Item",
        quantity: Number.parseFloat(l.quantity.replace(",", ".")) || 1,
        unit_cost_cents: Math.round(Number.parseFloat(l.unit_cost.replace(",", ".")) * 100),
      }))
      .filter((l) => l.unit_cost_cents >= 0 && Number.isFinite(l.quantity) && l.quantity > 0);
    if (!bod.length) {
      Alert.alert("", t("orgAccountingPurchases.atLeastOneLine"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/accounting/purchases`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          vendor_name: vendor.trim() || "Vendor",
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          lines: bod,
        }),
      });
      const p = await parseResponseJson(res);
      if (!p.ok) throw new Error("—");
      Alert.alert("", t("orgAccountingPurchases.saved"));
      setLines([{ inventory_item_id: "", description: "", quantity: "1", unit_cost: "" }]);
    } catch {
      Alert.alert("", t("orgAccountingPurchases.saveError"));
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
        <Text style={styles.title}>{t("orgAccountingPurchases.title")}</Text>
        <View style={{ width: 34 }} />
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.lab}>{t("orgAccountingPurchases.vendor")}</Text>
        <TextInput style={styles.inp} value={vendor} onChangeText={setVendor} placeholder={t("orgAccountingPurchases.vendorPh")} />
        <Text style={styles.lab}>{t("orgAccountingPurchases.reference")}</Text>
        <TextInput style={styles.inp} value={reference} onChangeText={setReference} />
        <Text style={styles.lab}>{t("orgAccountingPurchases.notes")}</Text>
        <TextInput style={styles.inp} value={notes} onChangeText={setNotes} />

        {loadingInv ? (
          <ActivityIndicator style={{ marginVertical: 8 }} />
        ) : (
          <Text style={styles.hint}>
            {t("orgAccountingPurchases.inventoryHint")}{" "}
            {invHint
              .slice(0, 8)
              .map((i) => `${i.id}(${i.name})`)
              .join(", ")}
          </Text>
        )}

        {lines.map((ln, idx) => (
          <View key={idx} style={styles.lineBlk}>
            <Text style={styles.lineTit}>{t("orgAccountingPurchases.line")} {idx + 1}</Text>
            <TextInput
              style={styles.inpSm}
              value={ln.inventory_item_id}
              onChangeText={(x) =>
                setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, inventory_item_id: x } : p)))
              }
              keyboardType="number-pad"
              placeholder={t("orgAccountingPurchases.inventoryItemPh")}
            />
            <TextInput
              style={styles.inpSm}
              value={ln.description}
              onChangeText={(x) =>
                setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, description: x } : p)))
              }
              placeholder={t("orgAccountingPurchases.descriptionPh")}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[styles.inpSm, { flex: 1 }]}
                value={ln.quantity}
                onChangeText={(x) =>
                  setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: x } : p)))
                }
                keyboardType="decimal-pad"
                placeholder={t("orgAccountingPurchases.qtyPh")}
              />
              <TextInput
                style={[styles.inpSm, { flex: 1 }]}
                value={ln.unit_cost}
                onChangeText={(x) =>
                  setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, unit_cost: x } : p)))
                }
                keyboardType="decimal-pad"
                placeholder={t("orgAccountingPurchases.unitCostPh")}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addLn} onPress={() => setLines((p) => [...p, {
          inventory_item_id: "",
          description: "",
          quantity: "1",
          unit_cost: "",
        }])}>
          <Text style={styles.addLnTxt}>+ {t("orgAccountingPurchases.addLine")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primary} disabled={saving} onPress={() => void submit()}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryTxt}>{t("orgAccountingPurchases.saveAndBump")}</Text>
          )}
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
  hint: { fontSize: 11, color: "#64748b", marginBottom: 12 },
  lineBlk: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    marginBottom: 10,
  },
  lineTit: { fontWeight: "800", marginBottom: 8, color: "#064e3b" },
  addLn: { padding: 14, alignItems: "center", marginBottom: 12 },
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
