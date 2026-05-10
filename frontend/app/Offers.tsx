import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import BottomNavBar from "./bottomNavBar";
import { useLanguage } from "../contexts/LanguageContext";
import { API_BASE_URL, parseResponseJson } from "../lib/api";

type PublicOffer = {
  id: number;
  organization_id: number;
  title: string;
  description?: string | null;
  icon_emoji?: string | null;
  valid_until?: string | null;
  organization_display_name?: string;
};

export default function OffersPage() {
  const { t, isRTL } = useLanguage();
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (fromPull?: boolean) => {
    if (fromPull) setRefreshing(true);
    else setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/offers`);
      const parsed = await parseResponseJson<{ offers?: PublicOffer[]; error?: string }>(res);
      if (!parsed.ok) {
        const msg = parsed.data && typeof parsed.data === "object" && "error" in parsed.data
          ? String((parsed.data as { error?: string }).error || "")
          : "";
        throw new Error(msg || t("offers.loadError"));
      }
      setOffers(Array.isArray(parsed.data?.offers) ? parsed.data!.offers! : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("offers.loadError"));
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { textAlign: "center" }]}>{t("offers.pageTitle")}</Text>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {loading && offers.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#036672" />
        ) : (
          <ScrollView
            contentContainerStyle={styles.offersContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor="#036672"
              />
            }
          >
            {offers.length === 0 ? (
              <Text style={[styles.empty, { textAlign: isRTL ? "right" : "center" }]}>{t("offers.emptyLive")}</Text>
            ) : (
              offers.map((offer) => (
                <TouchableOpacity
                  key={offer.id}
                  style={styles.offerCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: "/provider-profile",
                      params: {
                        orgId: String(offer.organization_id),
                        orgName: offer.organization_display_name || "",
                        orgType: "",
                      },
                    })
                  }
                >
                  <View style={styles.iconWrap}>
                    <Text style={styles.icon}>{offer.icon_emoji?.trim() || "🎁"}</Text>
                  </View>
                  <View style={styles.offerInfo}>
                    <Text style={[styles.offerTitle, { textAlign: isRTL ? "right" : "left" }]}>
                      {offer.title}
                    </Text>
                    {offer.organization_display_name ? (
                      <Text style={[styles.partner, { textAlign: isRTL ? "right" : "left" }]}>
                        {t("offers.partner", { name: offer.organization_display_name })}
                      </Text>
                    ) : null}
                    {offer.description ? (
                      <Text style={[styles.offerDesc, { textAlign: isRTL ? "right" : "left" }]}>
                        {offer.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.offerValid, { textAlign: isRTL ? "right" : "left" }]}>
                      {offer.valid_until
                        ? `${t("offers.validUntil")} ${offer.valid_until}`
                        : t("offers.noExpiry")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#036672",
    marginTop: 32,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  offersContainer: {
    paddingHorizontal: 14,
    paddingBottom: 80,
    gap: 18,
  },
  err: {
    color: "#b91c1c",
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  empty: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: "#03667233",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#e0f2f1",
    gap: 15,
  },
  iconWrap: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: "#e0f2f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  icon: {
    fontSize: 38,
  },
  offerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  partner: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0d9488",
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#00695c",
    marginBottom: 5,
  },
  offerDesc: {
    fontSize: 14,
    color: "#02746b",
    marginBottom: 4,
  },
  offerValid: {
    fontSize: 12,
    color: "#4dd0e1",
    fontWeight: "600",
  },
});
