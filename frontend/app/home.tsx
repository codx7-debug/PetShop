import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import BottomNavBar from './bottomNavBar';
import { push } from "expo-router/build/global-state/routing";
// Removed dark mode support

export default function HomeScreen() {
  // Dark mode removed: always use light colors
  const backgroundColor = "#F8FAFC"; // Main page background

  const SERVICES = [
    { id: '1', title: 'Salon', icon: '✂️', color: '#FFF0ED', textColor: '#FF6F4E', route: '/petkuafer' },
    { id: '2', title: 'Veteriner', icon: '🏥', color: '#E3FFF3', textColor: '#49A184', route: '/Pet_Clinic' },
    { id: '3', title: 'Otel', icon: '🏨', color: '#FFF8E1', textColor: '#D4A017', route: '/Hotel' },
    // { id: '4', title: 'Gezici', icon: '🚶', color: '#F0F2FF', textColor: '#5C6BC0' },
    // { id: '5', title: 'Mağaza', icon: '🛒', color: '#FFF0F5', textColor: '#D81B60' },
  ];

  const [location, setLocation] = React.useState("Beşiktaş, İstanbul");

  function handleLocationChange(newLocation: string) {
    setLocation(newLocation);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["top"]}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            {/* Logo + Title */}
            <View style={styles.logoTitleRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../components/logo2.png')}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoText}>
                <Text style={styles.logoTextMain}>Pet</Text>
                <Text style={styles.logoTextAccent}>ora.</Text>
              </Text>
            </View>
            {/* Icons */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.bellCircle}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.bellDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileCircle}>
                <Text style={styles.profileIcon}>🦁</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationLabel}>Konum: </Text>
            <Text style={styles.locationValue}>Beşiktaş, İstanbul</Text>
            <TouchableOpacity 
              style={styles.locationDropdown}
              onPress={() => {
                // Static for now
              }}
            >
              <Ionicons name="chevron-down" size={16} color="#858585" />
            </TouchableOpacity>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F6F8FA',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            paddingHorizontal: 18,
            paddingVertical: 12,
            marginTop: 18,
            marginBottom: 22,
            marginHorizontal: 2,
            minHeight: 54,
          }}>
            <Ionicons name="search" size={24} color="#6EC1E4" style={{ marginRight: 10 }} />
            <Text style={{ color: "#9CA3AF", fontSize: 17, flex: 1 }}>
              Salon, klinik veya otel ara...
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#FFF3ED",
                borderRadius: 11,
                paddingVertical: 5,
                paddingHorizontal: 18,
                marginLeft: 10,
              }}
              activeOpacity={0.8}
              onPress={() => {
                // Add your filter handler here
              }}
            >
              <Text style={{ color: "#080202", fontSize: 16, fontWeight: '700' }}>
                Filtre
              </Text>
            </TouchableOpacity>
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
              }}
            >
              Quick Actions
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#658C89',
                fontWeight: '400',
                marginBottom: 16,
                paddingHorizontal: 2,
                letterSpacing: 0.06,
              }}
            >
              Get help fast for animals in need
            </Text>
            <View
              style={{
                flexDirection: 'row',
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
                    textAlign: 'center',
                  }}
                >
                  Report Injured Animal
                </Text>
                <Text
                  style={{
                    fontSize: 13.7,
                    color: "#4B7A79",
                    fontWeight: '400',
                    textAlign: 'center',
                    letterSpacing: 0.03,
                  }}
                >
                  Start an emergency case now
                </Text>
              </TouchableOpacity>

              {/* Find Nearby Clinic (Secondary) */}
              <TouchableOpacity
                onPress={() => router.push("/map")}
                activeOpacity={0.82}
                style={{
                  flex: 1,
                  marginLeft: 7,
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
                    textAlign: 'center',
                  }}
                >
                  Find Nearby Clinic
                </Text>
                <Text
                  style={{
                    fontSize: 13.7,
                    color: "#5C8679",
                    fontWeight: '400',
                    textAlign: 'center',
                    letterSpacing: 0.03,
                  }}
                >
                  Discover trusted local vets
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#0F0D0D',
              borderRadius: 22,
              padding: 20,
              marginBottom: 20,
              marginHorizontal: 2,
              flexDirection: 'row',
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
                    alignSelf: 'flex-start',
                    letterSpacing: 1,
                  }}
                >
                  {"✨  ÖZEL TEKLİF"}
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
                }}
              >
                İlk randevunda{'\n'}%20 indirim kazan!
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#21E7D8',
                  borderRadius: 9,
                  alignSelf: 'flex-start',
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
                  fontSize: 15
                }}>Hemen Keşfet →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 60, marginTop: 8 }}>🐶</Text>
            </View>
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
                flexDirection: 'row',
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
                }}
              >
                Hizmetler
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
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#247059',
                  }}
                >
                  Tümü
                </Text>
              </TouchableOpacity>
            </View>
            {/* Services Horizontal List */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 22,
                paddingRight: 8,
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
                    onPress={() => router.push(item.route as any)}
                  >
                    <Text style={{ fontSize: 36, color: "#247059" }}>{item.icon}</Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: idx === 0 ? '700' : '600',
                      color: "#247059",
                      textAlign: 'center',
                      lineHeight: 19,
                      paddingHorizontal: 2,
                      opacity: 1,
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
          <Text style={[styles.sectionTitle, { color: "#1EA9CF" }]}>Recent cases near you</Text>
          <View style={[styles.caseCard, { backgroundColor: "#EAF8FB", borderColor: "#B0E7F3" }]}>
            <View style={styles.caseTop}>
              <Text style={[styles.urgentBadge, { backgroundColor: "#0A2239", color: "#fff" }]}>Urgent</Text>
              <Text style={[styles.distanceBadge, { backgroundColor: "#B0E7F3", color: "#0A2239" }]}>1.2 km</Text>
            </View>
            <View style={styles.pawArea}>
              <Text style={[styles.paw, { color: "#21E7D8" }]}>🐾</Text>
            </View>
            <View style={[styles.caseBody, { backgroundColor: "#F8FAFC" }]}>
              <View style={styles.caseHeader}>
                <Text style={[styles.caseTitle, { color: "#0A2239" }]}>Injured cat - Kizilay</Text>
                <Text style={[styles.caseTime, { color: "#5AC9E3" }]}>5 min ago</Text>
              </View>
              <Text style={[styles.caseDesc, { color: "#1EA9CF" }]}>
                Found near the park entrance, limping on front leg. Seems scared but calm.
              </Text>
              <View style={styles.caseButtons}>
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: "#21E7D8" }]}>
                  <Text style={[styles.helpBtnText, { color: "#0A2239" }]}>I can help</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: "#fff", borderColor: "#B0E7F3" }]}>
                  <Text style={[styles.detailsBtnText, { color: "#1EA9CF" }]}>View details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={[styles.caseCard, { backgroundColor: "#DEE8D6", borderColor: "#DEE8D6" }]}>
            <View style={styles.caseTop}>
              <Text style={[styles.resolvedBadge, { backgroundColor: "#21E7D8" }]}>Resolved</Text>
              <Text style={[styles.distanceBadge, { backgroundColor: "#B0E7F3", color: "#0A2239" }]}>3.4 km</Text>
            </View>
            <View style={styles.pawArea}>
              <Text style={[styles.paw, { color: "#9EBB8B" }]}>🐾</Text>
            </View>
            <View style={styles.caseBody}>
              <View style={styles.caseHeader}>
                <Text style={styles.caseTitle}>Dog rescued - Cankaya</Text>
                <Text style={styles.caseTime}>2 hrs ago</Text>
              </View>
              <Text style={styles.caseDesc}>
                Taken to PetCare Clinic. Thanks to 3 volunteers who responded.
              </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  logoText: {
    fontSize: 19, // Smaller, more understated than logo
    fontWeight: "600", // Softer weight for premium feel
    color: "#1EA9CF",
    marginLeft: -10,
    marginTop: 20,
    letterSpacing: 0.2,
    fontFamily: "System",
    opacity: 0.93, // Slightly muted for elegance
    lineHeight: 22,
    // Removes extra flourish; keep a clean one-line look
  },
  logoTextMain: {
    fontWeight: "400",
    color: "#1EA9CF", // Blue from the logo gradient
    fontSize: 20,
    letterSpacing: 0,
    fontFamily: "System",
  },
  logoTextAccent: {
    fontWeight: "600",
    color: "#20D2C5", // Slightly softer teal for accent, less saturated than highlight
    fontSize: 19,
    letterSpacing: -0.5,
    fontFamily: "System",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#EBFBFF", // light bluish-white, logo-inspired
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
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
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#18243a", // matching dark logo shadow
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    fontSize: 23,
    color: "#46f1e2", // lightened teal from the logo
    fontWeight: "bold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 4,
    marginLeft: 2,
    gap: 3,
  },
  locationPin: {
    fontSize: 16,
    marginRight: 2,
    marginTop: 2,
  },
  locationLabel: {
    color: "#34364b", // blend between dark and blue from logo
    fontWeight: "400",
    fontSize: 15,
  },
  locationValue: {
    color: "#1EA9CF", // main logo blue
    fontWeight: "bold",
    fontSize: 16,
  },
  locationDropdown: {
    marginLeft: 2,
    marginBottom: -1,
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
