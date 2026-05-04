import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Platform } from "react-native";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

function ThemedApp() {
  const backgroundColor = "#E6E3D7";
  const { isRTL } = useLanguage();

  return (
    <View style={{
      flex: 1,
      backgroundColor: backgroundColor,
      paddingTop: Platform.OS === "android" ? 24 : 0,
      direction: isRTL ? "rtl" : "ltr",
    }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: backgroundColor },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: "card" }} />
        <Stack.Screen name="home" options={{ presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ presentation: "card" }} />
        <Stack.Screen name="search" options={{ presentation: "card" }} />
        <Stack.Screen name="org-services" options={{ presentation: "card" }} />
        <Stack.Screen name="org-pending" options={{ presentation: "card" }} />
        <Stack.Screen name="staff-calendar" options={{ presentation: "card" }} />
        <Stack.Screen name="org-dashboard" options={{ presentation: "card" }} />
        <Stack.Screen name="org-profile-settings" options={{ presentation: "card" }} />
        <Stack.Screen name="provider-catalog" options={{ presentation: "card" }} />
        <Stack.Screen name="map" options={{ presentation: "card" }} />
        <Stack.Screen name="browse-services" options={{ presentation: "card" }} />
        <Stack.Screen name="provider-profile" options={{ presentation: "card" }} />
        <Stack.Screen name="book-service" options={{ presentation: "card" }} />
        <Stack.Screen name="book-appointment" options={{ presentation: "card" }} />
        <Stack.Screen name="reports" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-edit" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-password" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-payments" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-address" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-notifications" options={{ presentation: "card" }} />
        <Stack.Screen name="profile-pets" options={{ presentation: "card" }} />
        <Stack.Screen name="org-reports" options={{ presentation: "card" }} />
        <Stack.Screen name="admin-dashboard" options={{ presentation: "card" }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={backgroundColor} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemedApp />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}