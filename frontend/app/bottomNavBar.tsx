import React from 'react';
import { Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 55 : 40}
      tint="systemUltraThinMaterialLight"
      style={styles.bottomNav}
    >
      <TouchableOpacity
        style={styles.navItemWrap}
        onPress={() => {
          if (pathname !== '/home' && pathname !== '/') {
            router.push('/home');
          }
        }}
      >
        <Ionicons
          name="home"
          size={22}
          color={pathname === '/home' || pathname === '/' ? "#3b6811" : "rgba(60,60,50,0.45)"}
        />
        <Text
          style={[
            styles.navItem,
            (pathname === '/home' || pathname === '/') && styles.activeNav,
          ]}
        >
          {t('nav.home')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemWrap}
        onPress={() => {
          if (pathname !== '/search') {
            router.push('/search');
          }
        }}
      >
        <Ionicons
          name="search-outline"
          size={22}
          color={pathname === '/search' ? "#3b6811" : "rgba(60,60,50,0.45)"}
        />
        <Text
          style={[
            styles.navItem,
            pathname === '/search' && styles.activeNav,
          ]}
        >
          {t('nav.search')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerCam}
        onPress={() => {
          if (pathname !== '/camera') {
            router.push('/camera');
          }
        }}
      >
        <Ionicons name="camera" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemWrap}
        onPress={() => {
          if (pathname !== '/cases') {
            router.push('/cases');
          }
        }}
      >
        <Ionicons
          name="list-outline"
          size={22}
          color={pathname === '/cases' ? "#3b6811" : "rgba(60,60,50,0.45)"}
        />
        <Text
          style={[
            styles.navItem,
            pathname === '/cases' && styles.activeNav,
          ]}
        >
          {t('nav.cases')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItemWrap}
        onPress={() => {
          if (pathname !== '/profile') {
            router.push('/profile');
          }
        }}
      >
        <Ionicons
          name="person-outline"
          size={22}
          color={pathname === '/profile' ? "#3b6811" : "rgba(60,60,50,0.45)"}
        />
        <Text
          style={[
            styles.navItem,
            pathname === '/profile' && styles.activeNav,
          ]}
        >
          {t('nav.profile')}
        </Text>
      </TouchableOpacity>
    </BlurView>
    
  );
}

// Extracted home.tsx bottom navigation bar relevant styles
const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 360,
    height: 72,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    // Glass border
    borderWidth: 1.5,
    borderColor: "rgba(42, 77, 87, 0.09)", // logo blue, light glass effect
    // Shadow
    // shadowColor: "#158C92", // deep teal, inspired by logo shadows
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 34,
    elevation: 18,
    // backgroundColor: 'rgba(33,231,216,0.13)', // light translucent logo teal
    zIndex: 10,
    // paddingBottom is handled above by bottom: 40 (from original)
  },
  navItemWrap: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navItem: {
    color: "#21A9CF", // blue from the logo gradient (darker for icons)
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.15,
  },
  activeNav: {
    color: "#21E7D8", // vibrant teal from the logo
    fontWeight: "900",
    textShadowColor: "#1EA9CF55",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerCam: {
    width: 50,
    height: 50,
    borderRadius: 45,
    backgroundColor: "#1C2030", // blue from logo
    borderWidth: 8,
    borderColor: "#080C12", // lighter teal (from the gradient/edge highlight)
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
    shadowColor: "#1EA9CF",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});