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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";
import OrgKeyboardModalSheet from "../components/org/OrgKeyboardModalSheet";

type OfferRow = {
  id: number;
  title: string;
  description?: string | null;
  icon_emoji?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
};

export default function OrgOffersScreen() {
  const { t, isRTL } = useLanguage();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/offers`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ offers?: OfferRow[] }>(res);
      if (!parsed.ok) throw new Error("—");
      setRows(parsed.data?.offers || []);
    } catch {
      Alert.alert("", t("orgOffers.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert("", t("orgOffers.titleRequired"));
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        icon_emoji: emoji.trim() || "🎁",
        is_active: true,
      };
      if (validUntil.trim()) body.valid_until = validUntil.trim().slice(0, 10);
      const res = await fetch(`${API_BASE_URL}/api/org/offers`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.status === 403) {
        Alert.alert("", t("orgOffers.ownerOnly"));
        return;
      }
      const parsed = await parseResponseJson<{ error?: string }>(res);
      if (!parsed.ok) throw new Error(parsed.data?.error || "");
      setOpen(false);
      setTitle("");
      setDescription("");
      setEmoji("🎁");
      setValidUntil("");
      void load();
    } catch {
      Alert.alert("", t("orgOffers.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: OfferRow, next: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/org/offers/${item.id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ is_active: next }),
      });
      if (res.status === 403) {
        Alert.alert("", t("orgOffers.ownerOnly"));
        return;
      }
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      void load();
    } catch {
      Alert.alert("", t("orgOffers.saveError"));
    }
  };

  const remove = (item: OfferRow) => {
    Alert.alert(t("orgOffers.delete"), t("orgOffers.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("orgOffers.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/org/offers/${item.id}`, {
              method: "DELETE",
              headers: await getAuthHeaders(false),
            });
            if (res.status === 403) {
              Alert.alert("", t("orgOffers.ownerOnly"));
              return;
            }
            if (!res.ok) throw new Error("—");
            void load();
          } catch {
            Alert.alert("", t("orgOffers.deleteError"));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>{t("orgOffers.title")}</Text>
        <TouchableOpacity hitSlop={12} onPress={() => setOpen(true)} style={styles.addBn}>
          <Ionicons name="add-circle" size={30} color="#0d9488" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.sub, { textAlign: isRTL ? "right" : "left" }]}>{t("orgOffers.subtitle")}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("orgOffers.empty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.cardTop, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={styles.emoji}>{item.icon_emoji || "🎁"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{item.title}</Text>
                  {item.description ? (
                    <Text style={[styles.cardDesc, { textAlign: isRTL ? "right" : "left" }]}>{item.description}</Text>
                  ) : null}
                  <Text style={[styles.cardMeta, { textAlign: isRTL ? "right" : "left" }]}>
                    {item.valid_until
                      ? `${t("offers.validUntil")} ${item.valid_until}`
                      : t("offers.noExpiry")}
                  </Text>
                  <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Text style={styles.switchLabel}>{t("orgOffers.visible")}</Text>
                    <Switch value={item.is_active !== false} onValueChange={(v) => void toggleActive(item, v)} />
                  </View>
                </View>
                <TouchableOpacity onPress={() => remove(item)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={22} color="#b91c1c" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <OrgKeyboardModalSheet visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t("orgOffers.add")}</Text>
          <TextInput placeholder={t("orgOffers.titlePh")} style={styles.inp} value={title} onChangeText={setTitle} />
          <TextInput
            placeholder={t("orgOffers.descPh")}
            style={[styles.inp, styles.inpMulti]}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput placeholder={t("orgOffers.emojiPh")} style={styles.inp} value={emoji} onChangeText={setEmoji} />
          <TextInput
            placeholder={t("orgOffers.validPh")}
            style={styles.inp}
            value={validUntil}
            onChangeText={setValidUntil}
          />
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setOpen(false)}>
              <Text style={styles.btnGhostTxt}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => void save()} disabled={saving}>
              <Text style={styles.btnPrimaryTxt}>{saving ? "…" : t("orgOffers.save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </OrgKeyboardModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: "#0f172a" },
  addBn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sub: { paddingHorizontal: 16, fontSize: 13, color: "#64748b", marginBottom: 10 },
  list: { paddingHorizontal: 14, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTop: { alignItems: "flex-start", gap: 10 },
  emoji: { fontSize: 32 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  cardDesc: { fontSize: 14, color: "#475569", marginTop: 4 },
  cardMeta: { fontSize: 12, color: "#0d9488", marginTop: 6, fontWeight: "600" },
  row: { alignItems: "center", gap: 8, marginTop: 10 },
  switchLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 28,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14, color: "#0f172a" },
  inp: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  inpMulti: { minHeight: 80, textAlignVertical: "top" },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 16 },
  btnGhostTxt: { color: "#64748b", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#0d9488", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  btnPrimaryTxt: { color: "#fff", fontWeight: "800" },
});
