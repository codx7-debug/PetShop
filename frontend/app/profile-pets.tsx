import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../lib/api";

type Pet = {
  id: number;
  name: string;
  species?: string | null;
  breed?: string | null;
  notes?: string | null;
};

export default function ProfilePetsScreen() {
  const { t, isRTL } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Pet | "new" | null>(null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/pets`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ pets?: Pet[]; error?: string }>(res);
      if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      setPets(parsed.data?.pets || []);
    } catch {
      Alert.alert("", t("userProfile.petsLoadFail"));
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setName("");
    setSpecies("");
    setBreed("");
    setModal("new");
  };

  const openEdit = (p: Pet) => {
    setName(p.name);
    setSpecies(p.species || "");
    setBreed(p.breed || "");
    setModal(p);
  };

  const savePet = async () => {
    if (!name.trim()) {
      Alert.alert("", t("userProfile.petNameRequired"));
      return;
    }
    setSaving(true);
    try {
      if (modal === "new") {
        const res = await fetch(`${API_BASE_URL}/api/me/pets`, {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            name: name.trim(),
            species: species.trim() || null,
            breed: breed.trim() || null,
          }),
        });
        const parsed = await parseResponseJson<{ error?: string }>(res);
        if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      } else if (modal && typeof modal === "object") {
        const res = await fetch(`${API_BASE_URL}/api/me/pets/${modal.id}`, {
          method: "PATCH",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            name: name.trim(),
            species: species.trim() || null,
            breed: breed.trim() || null,
          }),
        });
        const parsed = await parseResponseJson<{ error?: string }>(res);
        if (!parsed.ok) throw new Error((parsed.data as { error?: string })?.error || "—");
      }
      setModal(null);
      await load();
      Alert.alert("", t("userProfile.saved"));
    } catch (e) {
      Alert.alert("", e instanceof Error ? e.message : t("userProfile.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#2b415c" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("userProfile.petsTitle")}</Text>
        <TouchableOpacity onPress={openNew} style={styles.addTop}>
          <Ionicons name="add-circle-outline" size={26} color="#4361ee" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => router.push("/browse-services")}
      >
        <Ionicons name="calendar-outline" size={22} color="#059669" />
        <Text style={styles.linkTxt}>{t("userProfile.petsBookCta")}</Text>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4361ee" />
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t("userProfile.petsEmpty")}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => openEdit(item)} activeOpacity={0.85}>
                <View style={[styles.cardInner, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={styles.paw}>
                    <Text style={{ fontSize: 22 }}>🐾</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.petName}>{item.name}</Text>
                    <Text style={styles.petSub}>
                      {[item.species, item.breed].filter(Boolean).join(" · ") || "—"}
                    </Text>
                  </View>
                  <Ionicons name="create-outline" size={20} color="#627ec6" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.vaccineRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() =>
                  router.push({
                    pathname: "/pet-documents",
                    params: { petId: String(item.id), petName: item.name },
                  })
                }
                activeOpacity={0.88}
              >
                <Ionicons name="document-text-outline" size={18} color="#2563eb" />
                <Text style={[styles.vaccineTxt, { color: "#1d4ed8" }]}>{t("userProfile.petDocumentsCta")}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.vaccineRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() =>
                  router.push({
                    pathname: "/pet-vaccinations",
                    params: { petId: String(item.id), petName: item.name },
                  })
                }
                activeOpacity={0.88}
              >
                <Ionicons name="medkit-outline" size={18} color="#0f766e" />
                <Text style={styles.vaccineTxt}>{t("userProfile.petVaccinationsCta")}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal != null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modal === "new" ? t("userProfile.petAdd") : t("userProfile.petEdit")}
            </Text>
            <Text style={styles.label}>{t("userProfile.petName")}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>{t("userProfile.petSpecies")}</Text>
            <TextInput style={styles.input} value={species} onChangeText={setSpecies} />
            <Text style={styles.label}>{t("userProfile.petBreed")}</Text>
            <TextInput style={styles.input} value={breed} onChangeText={setBreed} />
            <View style={[styles.modalBtns, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                <Text style={styles.cancelTxt}>{t("userProfile.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => void savePet()} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>{t("userProfile.save")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  linkTxt: { flex: 1, fontSize: 15, fontWeight: "700", color: "#14532d" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardInner: { padding: 14, alignItems: "center" },
  paw: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f4f7fe",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  petName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  petSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  vaccineRow: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#eef2f6",
    backgroundColor: "#f8fafc",
  },
  vaccineTxt: { flex: 1, fontWeight: "800", fontSize: 14, color: "#0f766e" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 16,
  },
  modalBtns: { marginTop: 20, gap: 12, justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelTxt: { fontWeight: "700", color: "#64748b" },
  saveBtn: {
    backgroundColor: "#4361ee",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveTxt: { color: "#fff", fontWeight: "800" },
});
