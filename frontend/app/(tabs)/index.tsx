import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.topImages}>
          <View style={styles.pandaWrapper}>
            <Image
              source={{
                uri: "https://images.pexels.com/photos/674574/pexels-photo-674574.jpeg?auto=compress&w=100&h=100&fit=crop",
              }}
              style={styles.pandaImage}
              resizeMode="cover"
            />
          </View>
          <Image
            source={{
              uri: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&w=100&h=100&fit=crop",
            }}
            style={styles.catImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.avatarCircle}>
          <Image
            source={{
              uri: "https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg?auto=compress&w=300&h=300&fit=crop",
            }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.badge}>PetAid Rescue</Text>
          <Text style={styles.headline}>
            Yarali bir <Text style={styles.boldColor}>dosta</Text> hemen yardim et
          </Text>
          <Text style={styles.description}>
            Vaka bildir, en yakin klinigi bul ve hayatin kurtarilmasi icin hizli
            adimlari tek ekrandan yonet.
          </Text>
        </View>
      </View>

      <View style={styles.featureRow}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🚑</Text>
          <Text style={styles.featureTitle}>Acil Bildirim</Text>
          <Text style={styles.featureText}>Tek dokunusla vaka olustur</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={styles.featureTitle}>Yakin Klinik</Text>
          <Text style={styles.featureText}>Konumuna gore hizli yonlendirme</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginButtonText}>Acil yardim baslat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signUpBtn}>
        <Text style={styles.signUpText}>Bakim adimlarini goruntule</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3FAF84",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingHorizontal: 14,
  },
  heroCard: {
    width: "100%",
    backgroundColor: "#4EB890",
    borderRadius: 30,
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  topImages: {
    position: "relative",
    width,
    height: 110,
    marginBottom: 10,
  },
  pandaWrapper: {
    position: "absolute",
    top: 0,
    left: 32,
    zIndex: 2,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 1, height: 2 },
  },
  pandaImage: {
    width: 76,
    height: 62,
    borderRadius: 18,
  },
  catImage: {
    position: "absolute",
    top: 5,
    right: 36,
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: "#4EB890",
    backgroundColor: "#fff",
  },
  avatarCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatar: {
    width: 156,
    height: 156,
    borderRadius: 78,
  },
  textSection: {
    width: "86%",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#EFFFF7",
    fontSize: 11,
    marginBottom: 10,
    overflow: "hidden",
  },
  headline: {
    fontSize: 29,
    lineHeight: 36,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
  },
  boldColor: {
    color: "#D8FF8A",
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
  },
  featureRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#E9FFF6",
    borderRadius: 16,
    padding: 12,
    minHeight: 92,
  },
  featureIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  featureTitle: {
    color: "#145D46",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 3,
  },
  featureText: {
    color: "#357865",
    fontSize: 12,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  loginButtonText: {
    color: "#197B5B",
    fontSize: 17,
    fontWeight: "700",
  },
  signUpBtn: {
    paddingVertical: 8,
  },
  signUpText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});