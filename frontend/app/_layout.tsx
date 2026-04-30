import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Platform } from "react-native";

// Dark mode removed: always use light theme
function ThemedApp() {
  const backgroundColor = "#E6E3D7"; // light color

  return (
    <View style={{
      flex: 1,
      backgroundColor: backgroundColor,
      paddingTop: Platform.OS === "android" ? 24 : 0,
    }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: backgroundColor },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: "card" }} />
        <Stack.Screen name="sign" options={{ presentation: "card" }} />
        <Stack.Screen name="home" options={{ presentation: "card" }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={backgroundColor} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemedApp />
    </SafeAreaProvider>
  );
}