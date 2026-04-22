import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Platform } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{
        flex: 1,
        backgroundColor: "#E6E3D7",
        paddingTop: Platform.OS === "android" && "ios"? 24 : 0,
      }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#E6E3D7" },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: "card" }} />
          <Stack.Screen name="sign" options={{ presentation: "card" }} />
          <Stack.Screen name="home" options={{presentation : "card"}} />
          
        </Stack>  
        <StatusBar style="dark" backgroundColor="#E6E3D7" />
      </View>
    </SafeAreaProvider>
  );
}
