import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from "./bottomNavBar";
import { useLanguage } from "../contexts/LanguageContext";

export default function OffersPage() {
  const { t } = useLanguage();
  const OFFERS = React.useMemo(
    () => [
      { id: 1, title: t("offers.o1Title"), description: t("offers.o1Desc"), icon: "🐶", validUntil: t("offers.o1Valid") },
      { id: 2, title: t("offers.o2Title"), description: t("offers.o2Desc"), icon: "🐱", validUntil: t("offers.o2Valid") },
      { id: 3, title: t("offers.o3Title"), description: t("offers.o3Desc"), icon: "🐦", validUntil: t("offers.o3Valid") },
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{t("offers.pageTitle")}</Text>
        <ScrollView contentContainerStyle={styles.offersContainer} showsVerticalScrollIndicator={false}>
          {OFFERS.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{offer.icon}</Text>
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDesc}>{offer.description}</Text>
                <Text style={styles.offerValid}>{t("offers.validUntil")} {offer.validUntil}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    textAlign: "center",
  },
  offersContainer: {
    paddingHorizontal: 14,
    paddingBottom: 80,
    gap: 18,
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
    shadowOpacity: 0.10,
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