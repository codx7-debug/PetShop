import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomNavBar from "./bottomNavBar";
import { useLanguage } from "../contexts/LanguageContext";

type ServiceKind = "salon" | "vet" | "hotel" | "rescue" | "petshop" | "trainer" | "petsitter";

type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kind: ServiceKind;
};

const DEFAULT_CENTER = { latitude: 39.9334, longitude: 32.8597 };

const PLACES: Place[] = [
  { id: "v1", name: "VetCare Clinic - Kızılay", address: "Atatürk Blv No:205, Ankara", latitude: 39.9225, longitude: 32.8545, kind: "vet" },
  { id: "v2", name: "Pet Health Clinic - Bahçelievler", address: "Bahçelievler 3. Cadde, Ankara", latitude: 39.925, longitude: 32.8501, kind: "vet" },
  { id: "v3", name: "Ankara Animal Hospital", address: "Tunali Hilmi Cd. No:89, Ankara", latitude: 39.9405, longitude: 32.8635, kind: "vet" },
  { id: "s1", name: "Paws & Shine Grooming", address: "Kızılay, Ankara", latitude: 39.921, longitude: 32.856, kind: "salon" },
  { id: "s2", name: "Fluffy Spa Pet Salon", address: "Çankaya, Ankara", latitude: 39.918, longitude: 32.862, kind: "salon" },
  { id: "s3", name: "TailWag Studio", address: "Bahçelievler, Ankara", latitude: 39.927, longitude: 32.848, kind: "salon" },
  { id: "h1", name: "PetComfort Hotel", address: "Tunali Hilmi, Ankara", latitude: 39.935, longitude: 32.861, kind: "hotel" },
  { id: "h2", name: "Paws Inn Pet Hotel", address: "Kolej, Ankara", latitude: 39.931, longitude: 32.868, kind: "hotel" },
  { id: "r1", name: "Ankara Animal Rescue Desk", address: "Ulus, Ankara", latitude: 39.938, longitude: 32.86, kind: "rescue" },
  { id: "ps1", name: "TailWags Pet Supply", address: "Kızılay, Ankara", latitude: 39.9205, longitude: 32.857, kind: "petshop" },
  { id: "tr1", name: "Paws Academy Training", address: "Çankaya, Ankara", latitude: 39.917, longitude: 32.859, kind: "trainer" },
  { id: "sit1", name: "HomeComfort Pet Sitting", address: "Bahçelievler, Ankara", latitude: 39.926, longitude: 32.849, kind: "petsitter" },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseKind(raw: string | string[] | undefined): ServiceKind | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "salon" || v === "vet" || v === "hotel" || v === "rescue" || v === "petshop" || v === "trainer" || v === "petsitter")
    return v;
  return "all";
}

function kindLabelKey(k: ServiceKind): string {
  const m: Record<ServiceKind, string> = {
    vet: "homeHub.serviceVet",
    salon: "homeHub.serviceSalon",
    hotel: "homeHub.serviceHotel",
    rescue: "homeHub.serviceRescue",
    petshop: "homeHub.servicePetshop",
    trainer: "homeHub.serviceTrainer",
    petsitter: "homeHub.servicePetsitter",
  };
  return m[k];
}

export default function SearchScreen() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const { t, isRTL, locale } = useLanguage();
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<ServiceKind | "all">("all");
  const [userLoc, setUserLoc] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [locLoading, setLocLoading] = React.useState(true);
  const [hasGps, setHasGps] = React.useState(false);

  React.useEffect(() => {
    setKind(parseKind(service));
  }, [service]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!alive) return;
        if (status !== "granted") {
          setUserLoc(DEFAULT_CENTER);
          setHasGps(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        if (!alive) return;
        if (loc?.coords?.latitude != null && loc.coords.longitude != null) {
          setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setHasGps(true);
        } else {
          setUserLoc(DEFAULT_CENTER);
          setHasGps(false);
        }
      } catch {
        if (alive) {
          setUserLoc(DEFAULT_CENTER);
          setHasGps(false);
        }
      } finally {
        if (alive) setLocLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ta = {
    writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    textAlign: (isRTL ? "right" : "left") as "left" | "right",
  };

  const chips: { key: ServiceKind | "all"; label: string }[] = [
    { key: "all", label: t("searchPage.typeAll") },
    { key: "salon", label: t("homeHub.serviceSalon") },
    { key: "vet", label: t("homeHub.serviceVet") },
    { key: "hotel", label: t("homeHub.serviceHotel") },
    { key: "rescue", label: t("homeHub.serviceRescue") },
    { key: "petshop", label: t("homeHub.servicePetshop") },
    { key: "trainer", label: t("homeHub.serviceTrainer") },
    { key: "petsitter", label: t("homeHub.servicePetsitter") },
  ];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PLACES.filter((p) => kind === "all" || p.kind === kind);
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
      );
    }
    const origin = userLoc ?? DEFAULT_CENTER;
    return [...list].sort((a, b) => {
      if (!hasGps) return a.name.localeCompare(b.name, locale);
      const da = getDistanceKm(origin.latitude, origin.longitude, a.latitude, a.longitude);
      const db = getDistanceKm(origin.latitude, origin.longitude, b.latitude, b.longitude);
      return da - db;
    });
  }, [query, kind, userLoc, hasGps, locale]);

  const backBtnBg = "#e0f2f1";
  const backBtnColor = "#279b8f";
  const backLabelColor = "#028383";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingTop: 8,
        }}
      >
        <Text
          onPress={() => router.back()}
          style={{
            backgroundColor: backBtnBg,
            borderRadius: 99,
            padding: 9,
            paddingRight: 13,
            paddingLeft: 8,
            fontSize: 19,
            color: backBtnColor,
          }}
          suppressHighlighting
        >
          {isRTL ? "›" : "‹"}
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "500",
            marginHorizontal: 4,
            color: backLabelColor,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("common.back")}
        </Text>
      </View>

      <Text style={[styles.title, ta]}>{t("searchPage.title")}</Text>
      <Text style={[styles.subtitle, ta]}>{t("searchPage.subtitle")}</Text>

      <View style={[styles.searchRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Ionicons name="search" size={22} color="#6EC1E4" style={{ marginEnd: 10 }} />
        <TextInput
          style={[styles.input, ta]}
          placeholder={t("searchPage.placeholder")}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsScroll, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      >
        {chips.map((c) => {
          const on = kind === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => setKind(c.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {locLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#1EA9CF" />
          <Text style={[styles.loadingText, ta]}>{t("searchPage.findingLocation")}</Text>
        </View>
      ) : !hasGps ? (
        <Text style={[styles.hint, ta]}>{t("searchPage.locHint")}</Text>
      ) : (
        <Text style={[styles.hint, ta]}>{t("searchPage.sortedNearest")}</Text>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Text style={[styles.empty, ta]}>{t("searchPage.noResults")}</Text>
        ) : (
          filtered.map((p) => {
            const origin = userLoc ?? DEFAULT_CENTER;
            const km = getDistanceKm(origin.latitude, origin.longitude, p.latitude, p.longitude);
            const distLabel = t("searchPage.kmAway", { distance: km.toFixed(1) });
            return (
              <View key={p.id} style={styles.card}>
                <View style={[styles.cardTop, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.cardName, ta]}>{p.name}</Text>
                  <Text style={[styles.kindBadge, ta]}>{t(kindLabelKey(p.kind))}</Text>
                </View>
                <Text style={[styles.cardAddr, ta]}>{p.address}</Text>
                <View style={[styles.cardBottom, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.dist, ta]}>{distLabel}</Text>
                  <TouchableOpacity
                    style={styles.openBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/browse-services",
                        params: { orgType: p.kind },
                      })
                    }
                    activeOpacity={0.88}
                  >
                    <Text style={styles.openBtnText}>{t("searchPage.browseCategory")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#036672",
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#658C89",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    lineHeight: 20,
  },
  searchRow: {
    marginHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#F6F8FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 4,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0F2F1",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  chipOn: {
    backgroundColor: "#E0F2F1",
    borderColor: "#279b8f",
  },
  chipText: { fontSize: 14, fontWeight: "600", color: "#247059" },
  chipTextOn: { color: "#00695c" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  loadingText: { fontSize: 14, color: "#658C89" },
  hint: { fontSize: 13, color: "#658C89", paddingHorizontal: 18, paddingBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 10 },
  empty: { textAlign: "center", color: "#658C89", marginTop: 24, fontSize: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0f2f1",
    shadowColor: "#036672",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  cardName: { flex: 1, fontSize: 16, fontWeight: "800", color: "#00695c" },
  kindBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1EA9CF",
    backgroundColor: "#EAF8FB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardAddr: { fontSize: 13, color: "#374151", marginBottom: 10 },
  cardBottom: { alignItems: "center", justifyContent: "space-between" },
  dist: { fontSize: 13, fontWeight: "700", color: "#49A184" },
  openBtn: {
    backgroundColor: "#21E7D8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  openBtnText: { fontSize: 14, fontWeight: "800", color: "#0A2239" },
});
