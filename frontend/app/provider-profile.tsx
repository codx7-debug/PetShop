import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, parseResponseJson, getAuthHeaders } from "../lib/api";
import { getProviderDashboardTheme } from "../components/org/providerDashboardTheme";
import { ServiceCardSkeleton } from "../components/ui/BookingSkeleton";

type OrgPublic = {
  id: number;
  display_name: string;
  org_type: string;
  description?: string | null;
  address_line?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating_average?: number | null;
  rating_count?: number;
  gallery_urls?: string[];
};

type ServiceRow = {
  id: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_cents?: number | null;
};

type PackageRow = {
  id: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  price_cents?: number | null;
};

type ReviewRow = {
  id: number;
  rating: number;
  title?: string | null;
  body?: string | null;
  reviewer_name?: string | null;
  created_at?: string;
  photo_urls?: string[];
};

function iconForOrgType(orgType: string): keyof typeof Ionicons.glyphMap {
  const k = orgType.trim().toLowerCase();
  if (k === "hotel") return "bed-outline";
  if (k === "salon") return "sparkles-outline";
  if (k === "rescue") return "heart-outline";
  if (k === "petshop") return "bag-handle-outline";
  if (k === "trainer") return "school-outline";
  if (k === "petsitter") return "home-outline";
  return "medkit-outline";
}

function StarRow({ value, size = 20 }: { value: number; size?: number }) {
  const v = Math.min(5, Math.max(0, value));
  return (
    <View style={starStyles.row}>
      {[0, 1, 2, 3, 4].map((i) => {
        const d = v - i;
        if (d >= 0.85) return <Ionicons key={i} name="star" size={size} color="#f59e0b" />;
        if (d >= 0.35) return <Ionicons key={i} name="star-half" size={size} color="#f59e0b" />;
        return <Ionicons key={i} name="star-outline" size={size} color="#cbd5e1" />;
      })}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
});

export default function ProviderProfileScreen() {
  const { t, isRTL } = useLanguage();
  const params = useLocalSearchParams<{ orgId: string; orgName?: string; orgType?: string }>();
  const orgId = params.orgId ? String(params.orgId) : "";
  const prefetchName = params.orgName;
  const prefetchType = String(params.orgType || "vet").toLowerCase();

  const [org, setOrg] = useState<OrgPublic | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const orgType = String(org?.org_type || prefetchType).toLowerCase();
  const theme = useMemo(() => getProviderDashboardTheme(orgType), [orgType]);
  const headerIcon = iconForOrgType(orgType);
  const rowDir = isRTL ? "row-reverse" : "row";

  const load = useCallback(
    async (fromPull?: boolean) => {
      if (!orgId) return;
      setErr("");
      if (fromPull) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/organizations/${encodeURIComponent(orgId)}`, {
          headers: { Accept: "application/json" },
        });
        const parsed = await parseResponseJson<{
          organization?: OrgPublic;
          services?: ServiceRow[];
          packages?: PackageRow[];
          error?: string;
        }>(res);
        if (parsed.data == null) {
          const msg = parsed.isProbablyHtml
            ? t("providerProfile.htmlResponseHint", { base: API_BASE_URL, status: String(parsed.status) })
            : (parsed.bodySnippet?.trim() || t("providerProfile.loadError"));
          throw new Error(msg);
        }
        const data = parsed.data;
        if (!parsed.ok) throw new Error(data.error || res.statusText);
        if (!data.organization) throw new Error("Missing organization.");
        setOrg(data.organization);
        setServices(Array.isArray(data.services) ? data.services : []);
        setPackages(Array.isArray(data.packages) ? data.packages : []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("providerProfile.loadError"));
        setOrg(null);
        setServices([]);
        setPackages([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orgId, t]
  );

  const loadReviews = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/organizations/${encodeURIComponent(orgId)}/reviews?limit=20`);
      const parsed = await parseResponseJson<{ reviews?: ReviewRow[] }>(res);
      if (parsed.ok && parsed.data?.reviews) setReviews(parsed.data.reviews);
      else setReviews([]);
    } catch {
      setReviews([]);
    }
  }, [orgId]);

  React.useEffect(() => {
    void load(false);
  }, [load]);

  React.useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          const tok = await AsyncStorage.getItem("token");
          if (!tok || !orgId) return;
          await fetch(`${API_BASE_URL}/api/organizations/${encodeURIComponent(orgId)}/recent-view`, {
            method: "POST",
            headers: await getAuthHeaders(false),
          });
        } catch {
          /* */
        }
      })();
    }, [orgId])
  );

  React.useEffect(() => {
    void (async () => {
      try {
        const tok = await AsyncStorage.getItem("token");
        if (!tok || !orgId) {
          setFavorited(false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/me/catalog/favorites`, { headers: await getAuthHeaders(false) });
        const parsed = await parseResponseJson<{ organizations?: { id: number }[] }>(res);
        const ids = (parsed.data?.organizations || []).map((o) => o.id);
        setFavorited(ids.includes(Number(orgId)));
      } catch {
        setFavorited(false);
      }
    })();
  }, [orgId, org?.id]);

  const toggleFavorite = async () => {
    try {
      const tok = await AsyncStorage.getItem("token");
      if (!tok || !orgId) {
        Alert.alert("", t("providerProfile.signInToFavorite"));
        return;
      }
      if (favorited) {
        const res = await fetch(`${API_BASE_URL}/api/me/catalog/favorites/${encodeURIComponent(orgId)}`, {
          method: "DELETE",
          headers: await getAuthHeaders(false),
        });
        if (res.ok) setFavorited(false);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/me/catalog/favorites`, {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ organization_id: Number(orgId) }),
        });
        if (res.ok) setFavorited(true);
      }
    } catch {
      Alert.alert("", t("providerProfile.favoriteUpdateFail"));
    }
  };

  const submitReview = async () => {
    try {
      const tok = await AsyncStorage.getItem("token");
      if (!tok) {
        Alert.alert("", t("providerProfile.signInToReview"));
        return;
      }
      setReviewBusy(true);
      const res = await fetch(`${API_BASE_URL}/api/organizations/${encodeURIComponent(orgId)}/reviews`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ rating: reviewStars, body: reviewText.trim() }),
      });
      const parsed = await parseResponseJson(res);
      if (!parsed.ok) throw new Error("—");
      setReviewText("");
      await load(false);
      await loadReviews();
    } catch {
      Alert.alert("", t("providerProfile.reviewSubmitFail"));
    } finally {
      setReviewBusy(false);
    }
  };

  const displayName = org?.display_name || prefetchName || "—";

  const openMaps = useCallback(() => {
    const lat = org?.latitude != null ? Number(org.latitude) : NaN;
    const lng = org?.longitude != null ? Number(org.longitude) : NaN;
    const parts = [org?.address_line, org?.city, org?.country].filter(Boolean) as string[];
    const addr = parts.join(", ");
    const query =
      Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : addr || displayName;
    if (!query) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    void Linking.openURL(url);
  }, [org, displayName]);

  const hasCoords = Number.isFinite(Number(org?.latitude)) && Number.isFinite(Number(org?.longitude));
  const hasAddress = Boolean(org?.address_line || org?.city || org?.country);
  const canOpenMaps = hasCoords || hasAddress;

  const gallery = org?.gallery_urls?.length ? org.gallery_urls : [];
  const showSkeleton = loading && !org;
  const ratingAvg = org?.rating_average != null && Number.isFinite(Number(org.rating_average)) ? Number(org.rating_average) : null;
  const ratingCount = Math.max(0, Number(org?.rating_count) || 0);
  const hasRatings = ratingAvg != null && ratingCount > 0;

  return (
    <View style={styles.shell}>
      <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBg} />
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn} hitSlop={12}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity style={styles.circleBtn} hitSlop={12} onPress={() => void toggleFavorite()}>
            <Ionicons name={favorited ? "heart" : "heart-outline"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} hitSlop={12} onPress={() => void load(true)}>
            <Ionicons name="refresh-outline" size={21} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.heroTitleBlock, { flexDirection: rowDir }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
            <Ionicons name={headerIcon} size={28} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.kicker} numberOfLines={1}>
              {t(theme.kickerKey)}
            </Text>
            <Text style={styles.headline} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !showSkeleton}
            onRefresh={() => void load(true)}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <View style={styles.sheet}>
          {err ? <Text style={styles.errBanner}>{err}</Text> : null}

          {showSkeleton ? (
            <View style={{ paddingTop: 4 }}>
              <ServiceCardSkeleton count={4} accentHue={theme.accent} />
            </View>
          ) : !org ? null : (
            <>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("providerProfile.about")}</Text>
              <View style={[styles.card, { borderLeftColor: theme.accent }]}>
                <Text style={[styles.bodyText, { textAlign: isRTL ? "right" : "left" }]}>
                  {org.description?.trim() ? org.description.trim() : t("providerProfile.aboutEmpty")}
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 22 }]}>
                {t("providerProfile.rating")}
              </Text>
              <View style={[styles.card, hasRatings ? styles.cardRating : null]}>
                {hasRatings && ratingAvg != null ? (
                  <>
                    <View style={[styles.ratingRow, { flexDirection: rowDir }]}>
                      <StarRow value={ratingAvg} />
                      <Text style={styles.ratingNum}>{ratingAvg.toFixed(1)}</Text>
                    </View>
                    <Text style={[styles.ratingSummary, { textAlign: isRTL ? "right" : "left" }]}>
                      {t("providerProfile.ratingSummary", { avg: ratingAvg.toFixed(1), count: ratingCount })}
                    </Text>
                  </>
                ) : (
                  <View style={[styles.mutedRow, { flexDirection: rowDir }]}>
                    <Ionicons name="star-outline" size={22} color="#94a3b8" />
                    <Text style={[styles.muted, { flex: 1, textAlign: isRTL ? "right" : "left" }]}>
                      {t("providerProfile.noRatingsYet")}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 22 }]}>{t("providerProfile.reviews")}</Text>
              <View style={[styles.card, { borderLeftColor: theme.accent }]}>
                {reviews.length === 0 ? (
                  <Text style={[styles.muted, { textAlign: isRTL ? "right" : "left" }]}>{t("providerProfile.noWrittenReviews")}</Text>
                ) : (
                  reviews.map((r) => (
                    <View key={r.id} style={{ marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e2e8f0", paddingBottom: 10 }}>
                      <View style={{ flexDirection: rowDir, justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontWeight: "800", color: "#0f172a" }}>{r.reviewer_name || "Customer"}</Text>
                        <StarRow value={Number(r.rating) || 5} size={16} />
                      </View>
                      {r.body ? (
                        <Text style={{ marginTop: 6, color: "#475569", textAlign: isRTL ? "right" : "left" }}>{r.body}</Text>
                      ) : null}
                    </View>
                  ))
                )}
                <Text style={[styles.muted, { marginTop: 8, marginBottom: 6 }]}>{t("providerProfile.yourReviewHint")}</Text>
                <View style={{ flexDirection: rowDir, gap: 8, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setReviewStars(n)}>
                      <Ionicons name={reviewStars >= n ? "star" : "star-outline"} size={24} color="#f59e0b" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={t("providerProfile.reviewPlaceholder")}
                  placeholderTextColor="#94a3b8"
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.mapsBtn, { backgroundColor: theme.accent, justifyContent: "center" }]}
                  onPress={() => void submitReview()}
                  disabled={reviewBusy}
                >
                  <Text style={[styles.mapsBtnTxt, { color: "#fff" }]}>
                    {reviewBusy ? t("providerProfile.sendingReview") : t("providerProfile.postReview")}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 22 }]}>
                {t("providerProfile.location")}
              </Text>
              <View style={[styles.card, { borderLeftColor: theme.accent }]}>
                {(() => {
                  const lines = [org.address_line, org.city, org.country].filter(Boolean) as string[];
                  return lines.length ? (
                    <Text style={[styles.bodyText, { textAlign: isRTL ? "right" : "left" }]}>{lines.join("\n")}</Text>
                  ) : (
                    <Text style={[styles.muted, { textAlign: isRTL ? "right" : "left" }]}>{t("providerProfile.locationEmpty")}</Text>
                  );
                })()}
                <TouchableOpacity
                  style={[styles.mapsBtn, { backgroundColor: theme.accentSoft, flexDirection: rowDir }]}
                  onPress={() => openMaps()}
                  disabled={!canOpenMaps}
                  activeOpacity={0.85}
                >
                  <Ionicons name="map-outline" size={20} color={theme.accent} />
                  <Text style={[styles.mapsBtnTxt, { color: theme.accent }]}>{t("providerProfile.openMaps")}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 22 }]}>
                {t("providerProfile.photos")}
              </Text>
              {gallery.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galScroller}>
                  {gallery.map((uri, idx) => (
                    <Image
                      key={`${idx}-${uri.slice(-24)}`}
                      source={{ uri }}
                      style={styles.galImg}
                      contentFit="cover"
                      transition={160}
                      recyclingKey={uri}
                    />
                  ))}
                </ScrollView>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galScroller}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.galPlaceholder, { backgroundColor: theme.accentSoft }]}>
                      <Ionicons name="image-outline" size={36} color={theme.accent} style={{ opacity: 0.45 }} />
                    </View>
                  ))}
                </ScrollView>
              )}
              {gallery.length === 0 ? (
                <Text style={[styles.photosHint, { textAlign: isRTL ? "right" : "left" }]}>{t("providerProfile.photosEmpty")}</Text>
              ) : null}

              {packages.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 26 }]}>{t("providerProfile.bundles")}</Text>
                  {packages.map((p) => (
                    <TouchableOpacity
                      key={`pkg-${p.id}`}
                      style={[styles.svcCard, { borderLeftColor: "#7c3aed" }]}
                      activeOpacity={0.92}
                      onPress={() =>
                        router.push({
                          pathname: "/book-appointment",
                          params: {
                            packageId: String(p.id),
                            serviceTitle: p.title,
                            durationMinutes:
                              p.duration_minutes != null ? String(p.duration_minutes) : "60",
                            orgName: displayName,
                            orgType,
                            orgId: String(orgId),
                          },
                        })
                      }
                    >
                      <View style={[styles.svcTop, { flexDirection: rowDir }]}>
                        <View style={[styles.svcIcon, { backgroundColor: "#f5f3ff" }]}>
                          <Ionicons name="layers-outline" size={21} color="#7c3aed" />
                        </View>
                        <View style={styles.svcBody}>
                          <Text style={[styles.svcTitle, { textAlign: isRTL ? "right" : "left" }]}>{p.title}</Text>
                          {p.price_cents != null ? (
                            <Text style={[styles.chipMutedTxt, { marginTop: 6 }]}>
                              {t("bookService.priceLabel", { price: (p.price_cents / 100).toFixed(2) })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={[styles.bookRow, { flexDirection: rowDir }]}>
                        <Text style={[styles.bookBtnTxt, { color: "#7c3aed" }]}>{t("providerProfile.book")}</Text>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color="#7c3aed" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : null}

              <Text style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left", marginTop: 26 }]}>
                {t("providerProfile.services")}
              </Text>
              {services.length === 0 ? (
                <View style={[styles.card, { alignItems: "center", paddingVertical: 22 }]}>
                  <Ionicons name="clipboard-outline" size={36} color="#94a3b8" />
                  <Text style={[styles.muted, { marginTop: 12, textAlign: "center" }]}>{t("bookService.noServices")}</Text>
                </View>
              ) : (
                services.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.svcCard, { borderLeftColor: theme.accent }]}
                    activeOpacity={0.92}
                    onPress={() =>
                      router.push({
                        pathname: "/book-appointment",
                        params: {
                          serviceId: String(item.id),
                          serviceTitle: item.title,
                          durationMinutes: item.duration_minutes != null ? String(item.duration_minutes) : "60",
                          orgName: displayName,
                          orgType,
                          orgId: String(orgId),
                        },
                      })
                    }
                  >
                    <View style={[styles.svcTop, { flexDirection: rowDir }]}>
                      <View style={[styles.svcIcon, { backgroundColor: theme.accentSoft }]}>
                        <Ionicons name={headerIcon} size={21} color={theme.accent} />
                      </View>
                      <View style={styles.svcBody}>
                        <Text style={[styles.svcTitle, { textAlign: isRTL ? "right" : "left" }]}>{item.title}</Text>
                        {item.description ? (
                          <Text style={[styles.svcDesc, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={3}>
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={[styles.chips, { flexDirection: rowDir }]}>
                          {item.duration_minutes != null ? (
                            <View style={[styles.chip, { backgroundColor: theme.accentSoft }]}>
                              <Text style={[styles.chipTxt, { color: theme.accent }]}>
                                {t("bookService.durationMin", { n: item.duration_minutes })}
                              </Text>
                            </View>
                          ) : null}
                          {item.price_cents != null ? (
                            <View style={styles.chipMuted}>
                              <Text style={styles.chipMutedTxt}>
                                {t("bookService.priceLabel", { price: (item.price_cents / 100).toFixed(2) })}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <View style={[styles.bookRow, { flexDirection: rowDir }]}>
                      <Text style={[styles.bookBtnTxt, { color: theme.accent }]}>{t("providerProfile.book")}</Text>
                      <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.accent} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#f8fafc" },
  heroBg: { position: "absolute", left: 0, right: 0, top: 0, height: Platform.OS === "android" ? 220 : 200 },
  safeTop: { zIndex: 2 },
  topBar: {
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "android" ? 6 : 0,
    alignItems: "center",
  },
  topBarSpacer: { flex: 1 },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroTitleBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 14,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.4)",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginTop: 8,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sheet: {
    marginTop: -16,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 22,
    paddingBottom: 8,
    minHeight: 400,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(226,232,240,0.95)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  errBanner: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#fecaca",
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.2,
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  card: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2f6",
    borderLeftWidth: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardRating: { gap: 8 },
  bodyText: { fontSize: 15, color: "#334155", lineHeight: 23 },
  muted: { fontSize: 14, color: "#64748b", lineHeight: 21 },
  mutedRow: { alignItems: "center", gap: 12 },
  ratingRow: { alignItems: "center", gap: 12 },
  ratingNum: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  ratingSummary: { fontSize: 13, color: "#64748b", fontWeight: "600", marginTop: 4 },
  reviewInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
    fontSize: 15,
    color: "#0f172a",
    textAlignVertical: "top",
  },
  mapsBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  mapsBtnTxt: { fontSize: 14, fontWeight: "900" },
  galScroller: { paddingHorizontal: 18, gap: 12, paddingBottom: 4 },
  galImg: {
    width: 208,
    height: 132,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  galPlaceholder: {
    width: 208,
    height: 132,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  photosHint: { fontSize: 12, color: "#94a3b8", paddingHorizontal: 22, marginTop: 8, fontWeight: "500" },
  svcCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2f6",
    borderLeftWidth: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  svcTop: { alignItems: "flex-start", gap: 12 },
  svcIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  svcBody: { flex: 1, minWidth: 0 },
  svcTitle: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  svcDesc: { fontSize: 14, color: "#475569", marginTop: 6, lineHeight: 21 },
  chips: { flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipTxt: { fontSize: 12, fontWeight: "800" },
  chipMuted: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  chipMutedTxt: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  bookRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookBtnTxt: { fontSize: 15, fontWeight: "900" },
});
