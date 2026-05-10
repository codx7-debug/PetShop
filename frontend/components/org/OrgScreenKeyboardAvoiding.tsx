import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Wrap org screen body (below custom headers) so ScrollView forms stay above the keyboard.
 */
export default function OrgScreenKeyboardAvoiding({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const offset = Platform.OS === "ios" ? Math.min(insets.top + 52, 100) : 0;
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
