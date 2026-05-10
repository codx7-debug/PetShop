import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import type { AppLocale } from "../i18n/translations";
import { LOCALE_SHORT_LABELS, SUPPORTED_LOCALES } from "../i18n/translations";

export type LanguageShortcutsVariant = "login" | "surface" | "onDark" | "accent";

type Props = {
  locale: AppLocale;
  onSelect: (code: AppLocale) => void | Promise<void>;
  isRTL: boolean;
  disabled?: boolean;
  variant: LanguageShortcutsVariant;
  /** Used when variant is `"accent"` (org theme). */
  accentColor?: string;
};

const LOGIN_ACCENT = "#2B9B7A";
const SURFACE_ACCENT = "#036672";

export function LanguageShortcutsBar({
  locale,
  onSelect,
  isRTL,
  disabled = false,
  variant,
  accentColor = "#2B9B7A",
}: Props) {
  return (
    <View
      style={[
        styles.track,
        variant === "login" && styles.trackLogin,
        variant === "surface" && styles.trackSurface,
        variant === "onDark" && styles.trackOnDark,
        variant === "accent" && styles.trackAccent,
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollInner,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {(SUPPORTED_LOCALES as readonly AppLocale[]).map((code) => {
          const active = code === locale;
          const label = LOCALE_SHORT_LABELS[code];

          let chipBg: object = {};
          let chipExtra: object = {};
          if (active) {
            if (variant === "onDark") chipExtra = styles.chipActiveOnDark;
            else if (variant === "login") chipBg = { backgroundColor: LOGIN_ACCENT };
            else if (variant === "surface") chipBg = { backgroundColor: SURFACE_ACCENT };
            else chipBg = { backgroundColor: accentColor };
          } else if (variant === "onDark") {
            chipExtra = styles.chipInactiveOnDark;
          } else if (variant === "login") {
            chipExtra = styles.chipGhostLogin;
          }

          const textStyle =
            variant === "onDark"
              ? active
                ? styles.chipTextOnDarkActive
                : styles.chipTextOnDarkInactive
              : active
                ? styles.chipTextLightActive
                : styles.chipTextLightInactive;

          return (
            <TouchableOpacity
              key={code}
              disabled={disabled}
              onPress={() => void onSelect(code)}
              activeOpacity={0.88}
              style={[
                styles.chip,
                chipBg,
                chipExtra,
                active && variant === "accent" && styles.chipActiveAccentShadow,
              ]}
            >
              <Text style={[styles.chipText, textStyle]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  trackLogin: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(43, 155, 122, 0.22)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  trackSurface: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  trackOnDark: {
    backgroundColor: "rgba(15,23,42,0.42)",
    borderColor: "rgba(255,255,255,0.32)",
  },
  trackAccent: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  scrollInner: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipGhostLogin: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  chipInactiveOnDark: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  chipActiveOnDark: {
    backgroundColor: "#ffffff",
    borderWidth: 0,
  },
  chipActiveAccentShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  chipTextLightInactive: {
    color: "#0f172a",
    opacity: 0.55,
  },
  chipTextLightActive: {
    color: "#ffffff",
  },
  chipTextOnDarkInactive: {
    color: "#f8fafc",
    opacity: 0.98,
  },
  chipTextOnDarkActive: {
    color: "#0f172a",
  },
});
