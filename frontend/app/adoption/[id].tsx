import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../contexts/LanguageContext";
import { API_BASE_URL, parseResponseJson } from "../../lib/api";

const FALLBACK_IMG = "https://cdn-icons-png.flaticon.com/512/616/616408.png";

export default function AdoptionDetailScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Number.parseInt(String(id || ""), 10);

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<{
    pet_name: string;
    species?: string | null;
    breed?: string | null;
    age_label?: string | null;
    description?: string | null;
    photo_url?: string | null;
    created_at?: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(listingId)) {
      setListing(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/adoption-listings/${listingId}`);
      const parsed = await parseResponseJson<{ listing?: typeof listing; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.listing) {
        setListing(null);
      } else {
        setListing(parsed.data.listing);
      }
    } catch {
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdopt = () => {
    if (!listing) return;
    Alert.alert(t("adoptionIdInfo.interestTitle"), t("adoptionIdInfo.interestBody", { name: listing.pet_name }));
  };

  const rowDir = isRTL ? "row-reverse" : "row";
  const align = isRTL ? "right" : "left";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.toolbar, { flexDirection: rowDir }]}>
        <TouchableOpacity hitSlop={12} style={styles.backFab} onPress={() => router.back()} accessibilityRole="button">
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#2b415c" />
        </TouchableOpacity>
        <Text style={[styles.toolbarTitle, { textAlign: "center", flex: 1 }]} numberOfLines={1}>
          {t("adoptionIdInfo.toolbarTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#34a853" />
        </View>
      ) : !listing ? (
        <View style={styles.loadingBox}>
          <Text style={[styles.err, { textAlign: align }]}>{t("adoptionIdInfo.notFound")}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryTxt}>{t("adoptionIdInfo.tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: listing.photo_url?.trim() || FALLBACK_IMG }}
              style={styles.petImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.infoBox}>
            <Text style={[styles.petName, { textAlign: align }]}>{listing.pet_name}</Text>
            <Text style={[styles.meta, { textAlign: align }]}>
              {[listing.species, listing.breed, listing.age_label].filter(Boolean).join(" · ")}
            </Text>
            {listing.description ? (
              <Text style={[styles.petDescription, { textAlign: align }]}>{listing.description}</Text>
            ) : null}
            <TouchableOpacity style={styles.adoptButton} onPress={handleAdopt} activeOpacity={0.88}>
              <Text style={styles.adoptButtonText}>{t("adoptionIdInfo.adoptMe")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fa" },
  toolbar: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  backFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toolbarTitle: { fontSize: 16, fontWeight: "800", color: "#2b415c" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  err: { fontSize: 15, color: "#64748b", marginBottom: 12 },
  retry: { backgroundColor: "#34a853", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: "#fff", fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, alignItems: "center" },
  imageWrapper: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: "hidden",
    backgroundColor: "#e2e6ee",
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2.5,
    borderColor: "#627ec6",
    ...Platform.select({
      ios: {
        shadowColor: "#627ec6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.11,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  petImage: { width: "100%", height: "100%" },
  infoBox: {
    width: "92%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    borderColor: "#ebedfa",
    borderWidth: 1,
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#627ec6",
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  petName: {
    fontSize: 25,
    fontWeight: "800",
    color: "#2b415c",
    marginBottom: 6,
  },
  meta: { fontSize: 15, color: "#627ec6", marginBottom: 12, fontWeight: "600" },
  petDescription: { fontSize: 16, color: "#2b415c", marginBottom: 20, lineHeight: 24 },
  adoptButton: {
    backgroundColor: "#34a853",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  adoptButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
