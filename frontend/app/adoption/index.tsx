import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { API_BASE_URL, parseResponseJson } from "../../lib/api";

type Listing = {
  id: number;
  pet_name: string;
  species?: string | null;
  breed?: string | null;
  age_label?: string | null;
  description?: string | null;
  photo_url?: string | null;
};

const PLACEHOLDER = "https://cdn-icons-png.flaticon.com/512/616/616408.png";

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function speciesEmoji(species: string | null | undefined) {
  const s = String(species || "").toLowerCase();
  if (s.includes("cat")) return "🐱";
  if (s.includes("dog") || s.includes("pup")) return "🐶";
  return "🐾";
}

export default function AdoptionsScreen() {
  const router = useRouter();
  const { t, isRTL, locale } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    else setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/adoption-listings?limit=80`);
      const parsed = await parseResponseJson<{ listings?: Listing[] }>(res);
      if (!parsed.ok) {
        setListings([]);
        setErr(t("adoptionIndex.loadError"));
        return;
      }
      setListings(parsed.data?.listings || []);
    } catch {
      setListings([]);
      setErr(t("adoptionIndex.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const rows = chunk(listings, 2);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.headRow, { flexDirection: rowDir }]}>
        <Text style={[styles.sectionTitle, { flex: 1, minWidth: 0, textAlign }]} numberOfLines={2}>
          {t("adoptionIndex.pageTitle")}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backChip} activeOpacity={0.85}>
          <Ionicons
            name={isRTL ? "arrow-forward-outline" : "arrow-back-outline"}
            size={16}
            color="#1EA9CF"
            style={{ marginHorizontal: 4 }}
          />
          <Text style={styles.backChipTxt}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#1EA9CF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load({ refresh: true })} tintColor="#1EA9CF" />
          }
        >
          {err ? (
            <Text style={[styles.banner, { textAlign }]}>{err}</Text>
          ) : null}
          {listings.length === 0 && !err ? (
            <Text style={[styles.empty, { textAlign }]}>{t("adoptionIndex.empty")}</Text>
          ) : null}

          {rows.map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={[styles.row, { flexDirection: rowDir }, rowIdx > 0 ? { marginTop: 4 } : null]}
            >
              {row.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.caseCard,
                    {
                      flex: 1,
                      minWidth: 0,
                    },
                  ]}
                >
                  <View style={[styles.caseTop, { flexDirection: rowDir }]}>
                    <Text style={[styles.urgentBadge, styles.badgeMuted]} numberOfLines={1}>
                      {locale === "ar" ? "متوفر" : "Available"}
                    </Text>
                    <Text style={[styles.distanceBadge]} numberOfLines={1}>
                      {item.species || "—"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.photoWrap}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/adoption/[id]", params: { id: String(item.id) } })}
                  >
                    <Image
                      source={{ uri: item.photo_url?.trim() || PLACEHOLDER }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                    <Text style={styles.bigEmoji}>{speciesEmoji(item.species)}</Text>
                  </TouchableOpacity>

                  <View style={styles.caseBody}>
                    <Text style={[styles.caseTitle, { textAlign }]} numberOfLines={2}>
                      {item.pet_name}
                    </Text>
                    <Text style={[styles.caseTime, { textAlign }]} numberOfLines={1}>
                      {[item.breed, item.age_label].filter(Boolean).join(" · ") || "—"}
                    </Text>
                    <Text style={[styles.caseDesc, { textAlign }]} numberOfLines={4}>
                      {item.description || ""}
                    </Text>
                    <View style={[styles.caseButtons, { flexDirection: rowDir }]}>
                      <TouchableOpacity
                        style={[styles.helpBtn, styles.helpBtnFlex]}
                        onPress={() =>
                          Alert.alert(
                            t("adoptionIdInfo.interestTitle"),
                            t("adoptionIdInfo.interestBody", { name: item.pet_name })
                          )
                        }
                        activeOpacity={0.88}
                      >
                        <Text style={styles.helpBtnText} numberOfLines={1}>
                          {t("adoptionIndex.adoptCta")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailsBtn, styles.detailsFlex]}
                        onPress={() => router.push({ pathname: "/adoption/[id]", params: { id: String(item.id) } })}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.detailsBtnText} numberOfLines={1}>
                          {t("adoptionIndex.detailsCta")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              {row.length === 1 ? <View style={styles.rowSpacer} /> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FFFC" },
  headRow: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 6 : 4,
    paddingBottom: 12,
    gap: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1EA9CF" },
  backChip: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F6FC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backChipTxt: { color: "#1EA9CF", fontWeight: "800", fontSize: 13 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 32 },
  banner: { color: "#b45309", marginBottom: 10, paddingHorizontal: 4, fontSize: 13 },
  empty: { color: "#64748b", textAlign: "center", paddingVertical: 24, paddingHorizontal: 12, fontSize: 15 },
  row: {
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  rowSpacer: { flex: 1, minWidth: 0 },
  caseCard: {
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#B0E7F3",
    overflow: "hidden",
  },
  caseTop: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
    alignItems: "center",
    gap: 6,
  },
  urgentBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    flexShrink: 1,
  },
  badgeMuted: { backgroundColor: "#e0f2fe", color: "#0369a1" },
  distanceBadge: {
    backgroundColor: "#E2F6F9",
    color: "#0A2239",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    flexShrink: 1,
    maxWidth: "48%",
  },
  photoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e2e8f0",
  },
  bigEmoji: {
    position: "absolute",
    fontSize: 28,
    opacity: 0.35,
  },
  caseBody: {
    padding: 12,
    backgroundColor: "#FCFFFD",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0A2239",
    marginBottom: 4,
  },
  caseTime: { fontSize: 12, color: "#41A09D", fontWeight: "600", marginBottom: 6 },
  caseDesc: { fontSize: 12, color: "#298475", lineHeight: 17, minHeight: 48 },
  caseButtons: { marginTop: 10, gap: 6, alignItems: "stretch" },
  helpBtn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#21E7D8",
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnFlex: { flex: 1, minWidth: 0 },
  helpBtnText: { color: "#0A2239", fontWeight: "800", fontSize: 12 },
  detailsBtn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#B0E7F3",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsFlex: { flex: 1, minWidth: 0 },
  detailsBtnText: { color: "#1EA9CF", fontWeight: "800", fontSize: 12 },
});
