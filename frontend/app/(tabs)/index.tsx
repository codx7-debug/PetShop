import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions, 
  StatusBar, 
  ScrollView,
  SafeAreaView 
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from "../../contexts/LanguageContext";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <LinearGradient 
      colors={['#0D1C2B', '#0C3054']} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtle Background Decorator */}
          <View style={styles.topGlow} />

          {/* Hero Section */}
          <View style={styles.heroCard}>
            <View style={styles.topImages}>
              <View style={[styles.floatingPhoto, styles.pandaPos]}>
                <Image
                  source={{ uri: "https://images.pexels.com/photos/674574/pexels-photo-674574.jpeg?auto=compress&w=150" }}
                  style={styles.smallPhoto}
                />
              </View>
              <View style={[styles.floatingPhoto, styles.catPos]}>
                 <Image
                  source={{ uri: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&w=150" }}
                  style={styles.smallPhoto}
                />
              </View>
            </View>

            <View style={styles.avatarContainer}>
               <View style={styles.avatarOutline}>
                  <Image
                    source={{ uri: "https://images.pexels.com/photos/1181696/pexels-photo-1181696.jpeg?auto=compress&w=400" }}
                    style={styles.avatar}
                  />
               </View>
               <View style={styles.pulseContainer}>
                  <View style={styles.pulseInner} />
               </View>
            </View>

            <View style={styles.textSection}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{t("home.chip")}</Text>
              </View>
              
              <Text style={styles.headline}>
                {t("home.headlinePart1")}
                <Text style={styles.highlight}>{t("home.headlineHighlight")}</Text>
                {t("home.headlinePart2")}
              </Text>
              
              <Text style={styles.description}>
                {t("home.description")}
              </Text>
            </View>
          </View>

          {/* Feature Grid */}
          <View style={styles.featureRow}>
            <TouchableOpacity activeOpacity={0.9} style={styles.featureCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF0EE' }]}>
                <Text style={styles.emoji}>🚑</Text>
              </View>
              <Text style={styles.featureTitle}>{t("home.feature1Title")}</Text>
              <Text style={styles.featureSubtitle}>{t("home.feature1Subtitle")}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={styles.featureCard}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF7FF' }]}>
                <Text style={styles.emoji}>📍</Text>
              </View>
              <Text style={styles.featureTitle}>{t("home.feature2Title")}</Text>
              <Text style={styles.featureSubtitle}>{t("home.feature2Subtitle")}</Text>
            </TouchableOpacity>
          </View>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.mainBtn} 
              onPress={() => router.push("/login")}
            >
              <Text style={styles.mainBtnText}>{t("home.btnStart")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>{t("home.btnGuide")}</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 89, 202, 0.77)',
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 36,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  topImages: {
    position: 'absolute',
    top: -25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '110%',
  },
  floatingPhoto: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  pandaPos: { transform: [{ rotate: '-15deg' }], left: 10 },
  catPos: { transform: [{ rotate: '15deg' }], right: 10 },
  smallPhoto: { width: 45, height: 45, borderRadius: 10 },
  
  avatarContainer: {
    marginBottom: 15,
    zIndex: 10,
  },
  avatarOutline: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  pulseContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 3,
  },
  pulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D8FF8A',
  },
  textSection: {
    alignItems: 'center',
  },
  chip: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  chipText: {
    color: '#D8FF8A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
  highlight: {
    color: '#D8FF8A',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: { fontSize: 24 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A4D3B',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  mainBtn: {
    width: '100%',
    backgroundColor: '#DBDBDB',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#D8FF8A',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  mainBtnText: {
    color: '#1A4D3B',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryBtn: {
    marginTop: 15,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});