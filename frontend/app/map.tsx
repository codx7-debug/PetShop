import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, parseResponseJson } from "../lib/api";

const { width, height } = Dimensions.get("window");

type MapOrg = {
  id: number;
  display_name: string;
  latitude: number;
  longitude: number;
  address_line?: string | null;
  city?: string | null;
  country?: string | null;
  verified: boolean;
  verification_status: string;
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  function toRad(x: number) {
    return (x * Math.PI) / 180;
  }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ClinicStoreMap() {
  const { t } = useLanguage();
  const defaultLocation = { latitude: 39.9334, longitude: 32.8597 };
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [orgs, setOrgs] = useState<MapOrg[]>([]);
  const [loadOrgsError, setLoadOrgsError] = useState("");
  const [nearest, setNearest] = useState<MapOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return orgs;
    const lower = searchQuery.trim().toLowerCase();
    return orgs.filter((o) => {
      const addr = [o.address_line, o.city, o.country].filter(Boolean).join(" ");
      return (
        o.display_name.toLowerCase().includes(lower) || addr.toLowerCase().includes(lower)
      );
    });
  }, [orgs, searchQuery]);

  const loadProviders = useCallback(async () => {
    setLoadOrgsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/organizations/map`);
      const parsed = await parseResponseJson<{ organizations?: MapOrg[]; error?: string }>(res);
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.bodySnippet || "Bad response");
      }
      const list = (parsed.data.organizations || []).filter(
        (o) =>
          o &&
          Number.isFinite(Number(o.latitude)) &&
          Number.isFinite(Number(o.longitude))
      ) as MapOrg[];
      setOrgs(list);
    } catch {
      setLoadOrgsError(t("map.loadProvidersError"));
      setOrgs([]);
    }
  }, [t]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (userLocation) {
      let minDist = Number.POSITIVE_INFINITY;
      let best: MapOrg | null = null;
      for (const o of filtered) {
        const dist = getDistance(userLocation.latitude, userLocation.longitude, o.latitude, o.longitude);
        if (dist < minDist) {
          minDist = dist;
          best = o;
        }
      }
      setNearest(best);
    }
  }, [userLocation, filtered]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("map.locAlertTitle"), t("map.locAlertBody"));
          if (isMounted) setUserLocation(defaultLocation);
        } else {
          const loc = await Location.getCurrentPositionAsync({});
          if (isMounted && loc?.coords?.latitude && loc?.coords?.longitude) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                },
                800
              );
            }
          }
        }
      } catch {
        if (isMounted) setUserLocation(defaultLocation);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [t]);

  if (loading || !userLocation) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }]}>
        <ActivityIndicator size="large" color="#2B9B7A" />
        <Text style={{ marginTop: 14, color: "#2B9B7A", fontSize: 16 }}>{t("map.findingLocation")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={21} color="#88C6B1" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("map.searchProvidersPlaceholder")}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A3BFC9"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#B7D5BC" style={{ marginLeft: 9 }} />
          </TouchableOpacity>
        ) : null}
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker coordinate={userLocation} title={t("map.markerYou")} tracksViewChanges={false}>
          <View style={styles.userMarkerCore}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </Marker>
        {filtered.map((o) => {
          const isNear = nearest && o.id === nearest.id;
          const verified = Boolean(o.verified);
          return (
            <Marker
              key={o.id}
              coordinate={{ latitude: o.latitude, longitude: o.longitude }}
              title={o.display_name}
              description={verified ? t("map.verifiedPin") : t("map.unverifiedPin")}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.pin,
                  verified ? styles.pinVerified : styles.pinPending,
                  isNear ? styles.pinNearest : null,
                ]}
              >
                <Ionicons name="medkit" size={15} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={28} color="#3B6811" />
      </TouchableOpacity>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, styles.pinVerified]} />
          <Text style={styles.legendText}>{t("map.legendVerified")}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, styles.pinPending]} />
          <Text style={styles.legendText}>{t("map.legendPending")}</Text>
        </View>
      </View>

      <View style={styles.overlay}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t("map.nearestProviderTitle")}</Text>
          {loadOrgsError ? <Text style={styles.warn}>{loadOrgsError}</Text> : null}
          {nearest ? (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.storeName}>{nearest.display_name}</Text>
                <View style={[styles.badge, nearest.verified ? styles.badgeOk : styles.badgeWait]}>
                  <Text style={styles.badgeTxt}>
                    {nearest.verified ? t("map.verifiedBadge") : t("map.pendingBadge")}
                  </Text>
                </View>
              </View>
              <Text style={styles.addressTxt}>
                {[nearest.address_line, nearest.city].filter(Boolean).join(" · ") || "—"}
              </Text>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: nearest.latitude,
                      longitude: nearest.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    },
                    700
                  );
                }}
              >
                <Text style={styles.confirmBtnText}>{t("map.showOnMap")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.muted}>{orgs.length === 0 ? t("map.noProviders") : t("map.noClinics")}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3fcf8",
    borderRadius: 15,
    borderWidth: 1.6,
    borderColor: "#b2edd7",
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    marginHorizontal: 14,
    marginTop: Platform.OS === "ios" ? 58 : 34,
    marginBottom: 2,
    zIndex: 20,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 3,
    color: "#104B2E",
  },
  map: {
    width,
    height,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 128 : 72,
    left: 14,
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    zIndex: 12,
  },
  legend: {
    position: "absolute",
    top: Platform.OS === "ios" ? 186 : 128,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    zIndex: 11,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e2f4ec",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, fontWeight: "600", color: "#1e3d2f" },
  overlay: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#eef6f2",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3B6811",
    marginBottom: 8,
  },
  warn: { color: "#b45309", fontSize: 12, marginBottom: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  storeName: { fontWeight: "800", fontSize: 16, color: "#0f172a", flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeOk: { backgroundColor: "#dcfce7" },
  badgeWait: { backgroundColor: "#ffedd5" },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: "#14532d" },
  addressTxt: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
  },
  muted: { color: "#64748b", marginVertical: 6 },
  confirmBtn: {
    backgroundColor: "#2B9B7A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  userMarkerCore: {
    width: 32,
    height: 32,
    backgroundColor: "#2B9B7A",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  pinVerified: { backgroundColor: "#15803d" },
  pinPending: { backgroundColor: "#ea580c" },
  pinNearest: {
    transform: [{ scale: 1.15 }],
    borderWidth: 3,
    borderColor: "#fef08a",
  },
});
