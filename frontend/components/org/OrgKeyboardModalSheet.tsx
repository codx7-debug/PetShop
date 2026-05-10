import React from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onRequestClose?: () => void;
  /** Backdrop tap dismisses (default: same as onRequestClose). */
  onBackdropPress?: () => void;
  animationType?: "none" | "slide" | "fade";
  children: React.ReactNode;
};

/**
 * Bottom-sheet style modal with keyboard-safe scrolling so TextInputs stay usable.
 */
export default function OrgKeyboardModalSheet({
  visible,
  onRequestClose,
  onBackdropPress,
  animationType = "slide",
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  const closeFromBackdrop = () => {
    Keyboard.dismiss();
    if (onBackdropPress) onBackdropPress();
    else onRequestClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
    >
      <View style={styles.root}>
        <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={closeFromBackdrop} />
        <View style={styles.lift} pointerEvents="box-none">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.kav}
            keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(insets.top, 8) : 0}
            pointerEvents="box-none"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
              keyboardDismissMode="interactive"
              pointerEvents="box-none"
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 8, paddingHorizontal: 14 },
              ]}
            >
              <View style={styles.sheetCard} pointerEvents="auto">
                {children}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(15,23,42,0.35)",
    zIndex: 0,
  },
  lift: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: "flex-end",
  },
  kav: {
    maxHeight: "92%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  sheetCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
});
