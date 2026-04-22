import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.name}>Ahmed</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.smallCircle}>
                <Text style={styles.smallIcon}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileCircle}>
                <Text style={styles.profileIcon}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.alertCard}>
            <View>
              <Text style={styles.alertTitle}>Found an injured pet?</Text>
              <Text style={styles.alertSubtitle}>Take a photo - we'll alert the nearest clinic</Text>
            </View>
            <TouchableOpacity style={styles.cameraCircle}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard}>
              <View style={[styles.quickIconWrap, { backgroundColor: "#DCECE6" }]}>
                <Text style={[styles.quickIcon, { color: "#2B9B7A" }]}>＋</Text>
              </View>
              <View>
                <Text style={styles.quickTitle}>Report case</Text>
                <Text style={styles.quickSub}>Send to clinic</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard}>
              <View style={[styles.quickIconWrap, { backgroundColor: "#E3EBF4" }]}>
                <Text style={[styles.quickIcon, { color: "#3F7AB8" }]}>⊕</Text>
              </View>
              <View>
                <Text style={styles.quickTitle}>Find clinic</Text>
                <Text style={styles.quickSub}>Nearby vets</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent cases near you</Text>

          <View style={styles.caseCard}>
            <View style={styles.caseTop}>
              <Text style={styles.urgentBadge}>Urgent</Text>
              <Text style={styles.distanceBadge}>1.2 km</Text>
            </View>
            <View style={styles.pawArea}>
              <Text style={styles.paw}>🐾</Text>
            </View>
            <View style={styles.caseBody}>
              <View style={styles.caseHeader}>
                <Text style={styles.caseTitle}>Injured cat - Kizilay</Text>
                <Text style={styles.caseTime}>5 min ago</Text>
              </View>
              <Text style={styles.caseDesc}>
                Found near the park entrance, limping on front leg. Seems scared but calm.
              </Text>
              <View style={styles.caseButtons}>
                <TouchableOpacity style={styles.helpBtn}>
                  <Text style={styles.helpBtnText}>I can help</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailsBtn}>
                  <Text style={styles.detailsBtnText}>View details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.caseCard, { backgroundColor: "#DEE8D6" }]}>
            <View style={styles.caseTop}>
              <Text style={styles.resolvedBadge}>Resolved</Text>
              <Text style={styles.distanceBadge}>3.4 km</Text>
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

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItemWrap}>
            <Text style={[styles.navIcon, styles.activeNav]}>⌂</Text>
            <Text style={[styles.navItem, styles.activeNav]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemWrap}>
            <Text style={styles.navIcon}>◎</Text>
            <Text style={styles.navItem}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.centerCam}>
            <Text style={styles.centerCamText}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItemWrap}>
            <Text style={styles.navIcon}>≡</Text>
            <Text style={styles.navItem}>Cases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemWrap}>
            <Text style={styles.navIcon}>◌</Text>
            <Text style={styles.navItem}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6E3D7",
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
    marginBottom: 14,
  },
  greeting: {
    fontSize: 14,
    color: "#5D5D5D",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginTop: -4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D7D2C2",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2F8E67",
    alignItems: "center",
    justifyContent: "center",
  },
  smallIcon: { fontSize: 14 },
  profileIcon: { fontSize: 14, color: "#fff" },
  alertCard: {
    backgroundColor: "#E54D4D",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  alertTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  alertSubtitle: { color: "#FFECEC", fontSize: 12, marginTop: 2, maxWidth: 220 },
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: { fontSize: 20, color: "#fff" },
  sectionTitle: { fontSize: 16, color: "#6A6A6A", marginBottom: 8, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#F4F2EC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCC5B6",
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
  },
  quickIcon: { fontSize: 20, fontWeight: "700" },
  quickTitle: { fontSize: 14, color: "#111", fontWeight: "600" },
  quickSub: { fontSize: 11, color: "#666", fontWeight : "300" },
  caseCard: {
    borderRadius: 14,
    backgroundColor: "#EFEDE4",
    borderWidth: 1,
    borderColor: "#CCC5B6",
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
    backgroundColor: "#E55353",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    overflow: "hidden",
    fontWeight: "700",
  },
  resolvedBadge: {
    backgroundColor: "#2B9B7A",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    overflow: "hidden",
    fontWeight: "700",
  },
  distanceBadge: {
    backgroundColor: "#D8D8D2",
    color: "#777",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    overflow: "hidden",
  },
  pawArea: { alignItems: "center", paddingVertical: 8 },
  paw: { fontSize: 36, color: "#BBB6AA" },
  caseBody: { backgroundColor: "#FBFBF9", padding: 12 },
  caseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  caseTitle: { fontSize: 18, color: "#111", fontWeight: "600", maxWidth: "72%" },
  caseTime: { fontSize: 11, color: "#888" },
  caseDesc: { fontSize: 13, color: "#525252", marginTop: 6, lineHeight: 18 },
  caseButtons: { flexDirection: "row", gap: 8, marginTop: 10 },
  helpBtn: {
    flex: 1,
    backgroundColor: "#2F8E67",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  helpBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  detailsBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0CCC1",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  detailsBtnText: { color: "#444", fontSize: 13 },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: "#F8F8F6",
    borderTopWidth: 1,
    borderTopColor: "#D6D0C3",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  navItemWrap: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navIcon: {
    color: "#8A8A8A",
    fontSize: 25,
    lineHeight: 28,
  },
  navItem: { color: "#8A8A8A", fontSize: 11, textAlign: "center" },
  activeNav: { color: "#2F8E67", fontWeight: "700" },
  centerCam: {
    width: 70,
    height: 70,
    borderRadius: 45,
    backgroundColor: "#2F8E67",
    borderWidth: 8,
    borderColor: "#E6E3D7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  centerCamText: { color: "#fff", fontSize: 30 },
});
