import React from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from "./bottomNavBar";

// Use emoji icons for animal types instead of local images
const OFFERS = [
  {
    id: 1,
    title: "İlk Ziyarette %20 İndirim!",
    description: "Evcil dostunuzun ilk randevusunda klinik ve kuaförlerde %20 indirim fırsatı.",
    icon: "🐶", // Dog icon
    validUntil: "30 Haziran 2024",
  },
  {
    id: 2,
    title: "3 Al 2 Öde - Pet Kuaför Hizmetlerinde!",
    description: "Şimdi 3 adet yıkama-paketli randevuya sadece 2'si fiyatına sahip olun.",
    icon: "🐱", // Cat icon
    validUntil: "15 Temmuz 2024",
  },
  {
    id: 3,
    title: "Pet Otel Rezervasyonlarında %10 İndirim",
    description: "Yaz dönemi otel rezervasyonlarınızda %10 indirim cebinizde.",
    icon: "🐦", // Bird icon for variety
    validUntil: "31 Ağustos 2024",
  },
];

export default function OffersPage() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Kampanyalar & Teklifler</Text>
        <ScrollView contentContainerStyle={styles.offersContainer} showsVerticalScrollIndicator={false}>
          {OFFERS.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{offer.icon}</Text>
              </View>
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDesc}>{offer.description}</Text>
                <Text style={styles.offerValid}>Geçerlilik: {offer.validUntil}</Text>
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