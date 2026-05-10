import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Platform, ActivityIndicator } from "react-native";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";

/** Avoid one frame (or more) of wrong language when device locale ≠ saved Settings locale. */
function LanguageReadyGate({ children }: { children: React.ReactNode }) {
  const { ready, isRTL } = useLanguage();
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#E6E3D7",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <ActivityIndicator size="large" color="#2B9B7A" />
      </View>
    );
  }
  return <>{children}</>;
}

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
        <Stack.Screen name="Offers" options={{ presentation: "card" }} />
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
        <Stack.Screen name="org-offers" options={{ presentation: "card" }} />
        <Stack.Screen name="org-operations" options={{ presentation: "card" }} />
        <Stack.Screen name="org-visitors" options={{ presentation: "card" }} />
        <Stack.Screen name="org-interviews" options={{ presentation: "card" }} />
        <Stack.Screen name="org-lodging" options={{ presentation: "card" }} />
        <Stack.Screen name="org-appointment-track" options={{ presentation: "card" }} />
        <Stack.Screen name="org-vaccinations" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-hub" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-patients" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-pet-docs" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-customers" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-customer-docs" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-inspections" options={{ presentation: "card" }} />
        <Stack.Screen name="org-clinic-consents" options={{ presentation: "card" }} />
        <Stack.Screen name="org-customer-mobile-info" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-hub" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-ledger" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-purchases" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-till" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-sales" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-barcode" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-debt" options={{ presentation: "card" }} />
        <Stack.Screen name="org-accounting-statement" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-hub" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-simple" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-periodical" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-distancing" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-busiest" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-bestsellers" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-bonus" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-advanced" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-leaves" options={{ presentation: "card" }} />
        <Stack.Screen name="org-insights-weights" options={{ presentation: "card" }} />
        <Stack.Screen name="pet-documents" options={{ presentation: "card" }} />
        <Stack.Screen name="pet-vaccinations" options={{ presentation: "card" }} />
        <Stack.Screen name="vaccine-wizard" options={{ presentation: "card" }} />
        <Stack.Screen name="admin-dashboard" options={{ presentation: "card" }} />
        <Stack.Screen name="admin-accounts" options={{ presentation: "card" }} />
        <Stack.Screen name="admin-accounter-users" options={{ presentation: "card" }} />
        <Stack.Screen name="accounter" options={{ presentation: "card" }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={backgroundColor} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <LanguageReadyGate>
          <ThemedApp />
        </LanguageReadyGate>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}