import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import BottomNavBar from './bottomNavBar';
import { useLanguage } from "../contexts/LanguageContext";

function rtlAlign(rtl: boolean) {
  return {
    writingDirection: (rtl ? "rtl" : "ltr") as "rtl" | "ltr",
    textAlign: (rtl ? "right" : "left") as "auto" | "left" | "right" | "center",
  };
}

export default function HomeScreen() {
  const { t, isRTL } = useLanguage();
  const backgroundColor = "#F8FAFC";
  const ta = rtlAlign(isRTL);

  const SERVICES = React.useMemo(
    () =>
      [
        {
          id: "1",
          title: t("homeHub.serviceSalon"),
          icon: "✂️",
          color: "#FFF0ED",
          textColor: "#FF6F4E",
          orgType: "salon" as const,
        },
        {
          id: "2",
          title: t("homeHub.serviceVet"),
          icon: "🏥",
          color: "#E3FFF3",
          textColor: "#49A184",
          orgType: "vet" as const,
        },
        {
          id: "3",
          title: t("homeHub.serviceHotel"),
          icon: "🏨",
          color: "#FFF8E1",
          textColor: "#D4A017",
          orgType: "hotel" as const,
        },
        {
          id: "4",
          title: t("homeHub.servicePetshop"),
          icon: "🛍️",
          color: "#ECFDF5",
          textColor: "#15803d",
          orgType: "petshop" as const,
        },
        {
          id: "5",
          title: t("homeHub.serviceTrainer"),
          icon: "🎓",
          color: "#EEF2FF",
          textColor: "#4338ca",
          orgType: "trainer" as const,
        },
        {
          id: "6",
          title: t("homeHub.servicePetsitter"),
          icon: "🏠",
          color: "#F0FDFA",
          textColor: "#0f766e",
          orgType: "petsitter" as const,
        },
      ] as const,
    [t]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["top"]}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { direction: isRTL ? "rtl" : "ltr" }]}
        >
          <View
            style={[
              styles.headerRow,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                direction: "ltr",
              },
            ]}
          >
            <View style={[styles.logoTitleRow, { flex: 1 }]}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../components/logo2.png')}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.bellCircle}
              onPress={() => router.push("/notifications")}
              accessibilityRole="button"
              accessibilityLabel={t("notifications.title")}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: '#0F0D0D',
              borderRadius: 22,
              padding: 20,
              marginTop: 18,
              marginBottom: 20,
              marginHorizontal: 2,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: "#21E7D8",
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ marginBottom: 7 }}>
                <Text
                  style={{
                    backgroundColor: '#21E7D8',
                    color: '#0A2239',
                    fontWeight: 'bold',
                    borderRadius: 9,
                    fontSize: 12,
                    paddingHorizontal: 11,
                    paddingVertical: 3,
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                    letterSpacing: 1,
                    writingDirection: isRTL ? "rtl" : "ltr",
                  }}
                >
                  {t('homeHub.specialOffer')}
                </Text>
              </View>
              <Text
                style={{
                  color: '#FCFCFF',
                  fontWeight: 'bold',
                  fontSize: 22,
                  marginBottom: 10,
                  fontFamily: 'System',
                  textShadowColor: 'rgba(19,154,176,0.24)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                }}
              >
                {t('homeHub.offerTitle')}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#21E7D8',
                  borderRadius: 9,
                  alignSelf: isRTL ? "flex-end" : "flex-start",
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  marginTop: 4,
                }}
                activeOpacity={0.90}
                onPress={() => router.push('/Offers')}
              >
                <Text style={{
                  color: '#0A2239',
                  fontWeight: 'bold',
                  fontSize: 15,
                  writingDirection: isRTL ? "rtl" : "ltr",
                }}>{t('homeHub.offerCta')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: isRTL ? 0 : 18, marginRight: isRTL ? 18 : 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 60, marginTop: 8 }}>🐶</Text>
            </View>
          </View>
        
          {/* -- Quick Actions Section -- */}
          <View style={{ marginTop: 2, marginBottom: 21 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#173B3B',
                letterSpacing: 0.1,
                marginBottom: 4,
                paddingHorizontal: 2,
                ...ta,
              }}
            >
              {t('homeHub.quickActions')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#658C89',
                fontWeight: '400',
                marginBottom: 16,
                paddingHorizontal: 2,
                letterSpacing: 0.06,
                ...ta,
              }}
            >
              {t('homeHub.quickActionsSub')}
            </Text>
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                gap: 14,
                justifyContent: 'space-between',
                marginHorizontal: -2,
              }}
            >
              {/* Report Injured Animal (Primary, Emphasized) */}
              <TouchableOpacity
                onPress={() => router.push("/report")}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  marginRight: 7,
                  backgroundColor: '#F9FEFD',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 26,
                  paddingHorizontal: 2,
                  shadowColor: '#21E7D8',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.14,
                  shadowRadius: 28,
                  elevation: 4,
                  borderWidth: 1.5,
                  borderColor: '#C8F1EF', // Soft teal glass
                  overflow: 'hidden',
                  position: "relative",
                }}
              >
                {/* Primary CTA Pill border highlight */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 18,
                    right: 18,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#AEEADD',
                    opacity: 0.20,
                  }}
                />
                <View
                  style={{
                    backgroundColor: '#D0F4F7',
                    borderRadius: 15,
                    padding: 14,
                    marginBottom: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="alert-circle" size={30} color="#19A19B" />
                </View>
                <Text
                  style={{
                    fontSize: 16.5,
                    fontWeight: "bold",
                    color: "#158C92",
                    letterSpacing: 0.13,
                    marginBottom: 4,
                    textAlign: isRTL ? "right" : "center",
                    writingDirection: isRTL ? "rtl" : "ltr",
                    alignSelf: "stretch",
                    paddingHorizontal: 4,
                  }}
                >
                  {t('homeHub.reportAnimal')}
                </Text>
                <Text
                  style={{
                    fontSize: 13.7,
                    color: "#4B7A79",
                    fontWeight: '400',
                    textAlign: isRTL ? "right" : "center",
                    writingDirection: isRTL ? "rtl" : "ltr",
                    letterSpacing: 0.03,
                    alignSelf: "stretch",
                    paddingHorizontal: 4,
                  }}
                >
                  {t('homeHub.reportAnimalSub')}
                </Text>
              </TouchableOpacity>

              {/* Browse real providers & book */}
              <TouchableOpacity
                onPress={() => router.push("/map")}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 26,
                  paddingHorizontal: 2,
                  shadowColor: '#158C92',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.09,
                  shadowRadius: 20,
                  elevation: 2,
                  borderWidth: 1.3,
                  borderColor: '#D3ECDF',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    backgroundColor: '#E2F8F0',
                    borderRadius: 15,
                    padding: 14,
                    marginBottom: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="paw-outline" size={28} color="#26B491" />
                </View>
                <Text
                  style={{
                    fontSize: 16.5,
                    fontWeight: "bold",
                    color: "#20705A",
                    letterSpacing: 0.13,
                    marginBottom: 4,
                    textAlign: isRTL ? "right" : "center",
                    writingDirection: isRTL ? "rtl" : "ltr",
                    alignSelf: "stretch",
                    paddingHorizontal: 4,
                  }}
                >
                  {t('homeHub.browseProviders')}
                </Text>
                <Text
                  style={{
                    fontSize: 13.7,
                    color: "#5C8679",
                    fontWeight: '400',
                    textAlign: isRTL ? "right" : "center",
                    writingDirection: isRTL ? "rtl" : "ltr",
                    letterSpacing: 0.03,
                    alignSelf: "stretch",
                    paddingHorizontal: 4,
                  }}
                >
                  {t('homeHub.browseProvidersSub')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/reports")}
              activeOpacity={0.85}
              style={{
                marginTop: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#d0ebe4",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#20705a",
                  textAlign: isRTL ? "right" : "center",
                }}
              >
                {t("reportsFeed.title")} →
              </Text>
            </TouchableOpacity>
          </View>
          {/* --- More Uniform "Services" Horizontal Section --- */}
          <View
            style={{
              paddingVertical: 24,
              backgroundColor: '#FFFFFF',
              marginBottom: 16,
              borderRadius: 18,
              marginHorizontal: 0,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {/* Header Row */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 22,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 21,
                  fontWeight: '900',
                  color: '#247059',
                  letterSpacing: -0.5,
                  fontFamily: 'System',
                  ...ta,
                }}
              >
                {t('homeHub.services')}
              </Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  borderRadius: 14,
                  backgroundColor: '#E6F4EF',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                }}
                activeOpacity={0.85}
                onPress={() => router.push("/browse-services")}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#247059',
                  }}
                >
                  {t('homeHub.seeAll')}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Services Horizontal List */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: isRTL ? "row-reverse" : "row",
                paddingLeft: isRTL ? 8 : 22,
                paddingRight: isRTL ? 22 : 8,
                gap: 16,
              }}
            >
              {SERVICES.map((item, idx) => (
                <View key={item.id} style={{ alignItems: 'center', width: 85 }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 22,
                      backgroundColor: "#F4FDFB",
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 7,
                      ...(idx === 0
                        ? {
                            shadowColor: '#21E7D8',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.23,
                            shadowRadius: 18,
                            elevation: 14,
                          }
                        : {}),
                      transform: [{ scale: idx === 0 ? 1.07 : 1.0 }],
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/browse-services",
                        params: { orgType: item.orgType },
                      })
                    }
                  >
                    <Text style={{ fontSize: 36, color: "#247059" }}>{item.icon}</Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: idx === 0 ? '700' : '600',
                      color: "#247059",
                      textAlign: isRTL ? "right" : "center",
                      writingDirection: isRTL ? "rtl" : "ltr",
                      lineHeight: 19,
                      paddingHorizontal: 2,
                      opacity: 1,
                      alignSelf: "stretch",
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  
                  
                </View>
              ))}
            </ScrollView>
          </View>
          <Text style={[styles.sectionTitle, { color: "#1EA9CF" }, ta]}>
            {isRTL ? "حيوانات للتبني" : "Animals for Adoption"}
          </Text>

          <View style={[styles.caseCard, { backgroundColor: "#F8FAFC", borderColor: "#A0E5D6" }]}>
            <View style={[styles.caseTop, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" }]}>
              <Text style={[styles.urgentBadge, { backgroundColor: "#21E7D8", color: "#0A2239" }]}>
                {isRTL ? "متوفر" : "Available"}
              </Text>
              <Text style={[styles.distanceBadge, { backgroundColor: "#E2F6F9", color: "#0A2239" }]}>
                {isRTL ? "ذكر" : "Male"}
              </Text>
            </View>
            <View style={styles.pawArea}>
              <Text style={[styles.paw, { color: "#52C8A1", fontSize: 45 }]}>🐶</Text>
            </View>
            <View style={[styles.caseBody, { backgroundColor: "#FCFFFD" }]}>
              <View style={[styles.caseHeader, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" }]}>
                <Text style={[styles.caseTitle, { color: "#0A2239", marginRight: 10 }, ta]}>
                  {isRTL ? "روكي" : "Rocky"}
                </Text>
                <Text style={[styles.caseTime, { color: "#41A09D" }, ta]}>
                  {isRTL ? "3 سنوات" : "3 years"}
                </Text>
              </View>
              <Text style={[styles.caseDesc, { color: "#298475" }, ta]}>
                {isRTL
                  ? "كلب ودود نشيط، يحب اللعب ويحتاج إلى منزل محب"
                  : "Friendly, energetic dog. Loves to play and looking for a loving home."}
              </Text>
              <View style={[styles.caseButtons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: "#21E7D8" }]}>
                  <Text style={[styles.helpBtnText, { color: "#0A2239" }]}>
                    {isRTL ? "تقديم طلب تبني" : "Adopt"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: "#fff", borderColor: "#B0E7F3" }]}>
                  <Text style={[styles.detailsBtnText, { color: "#1EA9CF" }]}>
                    {isRTL ? "تفاصيل" : "Details"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.caseCard, { backgroundColor: "#FFF8E2", borderColor: "#EBD59D" }]}>
            <View style={[styles.caseTop, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" }]}>
              <Text style={[styles.urgentBadge, { backgroundColor: "#EBD59D", color: "#7A541D" }]}>
                {isRTL ? "متوفر" : "Available"}
              </Text>
              <Text style={[styles.distanceBadge, { backgroundColor: "#FEF3E5", color: "#7A541D" }]}>
                {isRTL ? "أنثى" : "Female"}
              </Text>
            </View>
            <View style={styles.pawArea}>
              <Text style={[styles.paw, { color: "#EBC46D", fontSize: 45 }]}>🐱</Text>
            </View>
            <View style={[styles.caseBody, { backgroundColor: "#FEFCF5" }]}>
              <View style={[styles.caseHeader, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" }]}>
                <Text style={[styles.caseTitle, { color: "#7A541D", marginRight: 10 }, ta]}>
                  {isRTL ? "بيلا" : "Bella"}
                </Text>
                <Text style={[styles.caseTime, { color: "#C48E31" }, ta]}>
                  {isRTL ? "سنة واحدة" : "1 year"}
                </Text>
              </View>
              <Text style={[styles.caseDesc, { color: "#C2995A" }, ta]}>
                {isRTL
                  ? "قطة هادئة وحنونة تبحث عن منزل دافئ"
                  : "Calm, affectionate cat looking for a warm family."}
              </Text>
              <View style={[styles.caseButtons, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: "#EBD59D" }]}>
                  <Text style={[styles.helpBtnText, { color: "#7A541D" }]}>
                    {isRTL ? "تقديم طلب تبني" : "Adopt"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: "#fff", borderColor: "#EBD59D" }]}>
                  <Text style={[styles.detailsBtnText, { color: "#7A541D" }]}>
                    {isRTL ? "تفاصيل" : "Details"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
     
        </ScrollView>
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F8FAFC", // Will be overridden by inline backgroundColor according to theme
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 96,
  },
  headerRow: {
    marginBottom: 8,
  },
  logoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 2,
    paddingRight: 2,
    // Ensures clean separation from rightmost icons
  },
  logoBox: {
    width: 44,
    height: 44,
    // borderRadius: 13,
    // backgroundColor: "#0A2239", // Monochrome deep blue for header simplicity
    alignItems: "center",
    justifyContent: "center",
    // shadowColor: "#21E7D8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    marginRight: 7,
    // Slightly bolder, more premium icon prominence
  },
  logoPaw: {
    fontSize: 28, // Larger & primary visual
    color: "#E9FBFA", // Simple, high contrast (monochrome effect is more premium)
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#EBFBFF", // light bluish-white, logo-inspired
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 8,
    position: "relative",
  },
  bellIcon: {
    fontSize: 21,
    color: "#1EA9CF", // blue shade from logo
    fontWeight: "bold",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#21E7D8", // teal from logo
    borderWidth: 1.5,
    borderColor: "#EBFBFF",
  },
  alertTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  alertSubtitle: { color: "#8DE1E1", fontSize: 12, marginTop: 2, maxWidth: 220 }, // teal tint for emphasis
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#c6f6fa", // subtle blue/teal with 20% opacity
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: { fontSize: 20, color: "#21E7D8" },
  sectionTitle: { fontSize: 16, color: "#1EA9CF", marginBottom: 8, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#EAF8FB", // soft blue off-white from logo
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B0E7F3", // light blue border shadow
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#21E7D8", // consistent accent
  },
  quickIcon: { fontSize: 20, fontWeight: "700", color: "#18243a" },
  quickTitle: { fontSize: 14, color: "#1EA9CF", fontWeight: "600" },
  quickSub: { fontSize: 11, color: "#5AC9E3", fontWeight : "300" }, // faded blue
  caseCard: {
    borderRadius: 14,
    backgroundColor: "#EAF8FB", // soft blue background for cards
    borderWidth: 1,
    borderColor: "#B0E7F3",
    marginBottom: 12,
    overflow: "hidden",
  },
  caseTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  urgentBadge: {
    backgroundColor: "#0A2239", // urgent as deep blue, not red, per logo palette
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    overflow: "hidden",
    fontWeight: "700",
  },
  resolvedBadge: {
    backgroundColor: "#21E7D8", // happy teal for resolved
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    overflow: "hidden",
    fontWeight: "700",
  },
  distanceBadge: {
    backgroundColor: "#B0E7F3", // lighter blue background
    color: "#0A2239", // deep blue text
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    overflow: "hidden",
  },
  pawArea: { alignItems: "center", paddingVertical: 8 },
  paw: { fontSize: 36, color: "#21E7D8" }, // main logo teal
  caseBody: { backgroundColor: "#F8FAFC", padding: 12 },
  caseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  caseTitle: { fontSize: 18, color: "#0A2239", fontWeight: "600", maxWidth: "72%" }, // deep blue
  caseTime: { fontSize: 11, color: "#5AC9E3" }, // lighter blue
  caseDesc: { fontSize: 13, color: "#1EA9CF", marginTop: 6, lineHeight: 18 },
  caseButtons: { flexDirection: "row", gap: 8, marginTop: 10 },
  helpBtn: {
    flex: 1,
    backgroundColor: "#21E7D8", // logo teal
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  helpBtnText: { color: "#0A2239", fontWeight: "700", fontSize: 13 }, // readable against teal
  detailsBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B0E7F3",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  detailsBtnText: { color: "#1EA9CF", fontSize: 13 },
 
});
