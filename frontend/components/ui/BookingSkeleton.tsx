import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

function Bar({ width, height = 14, style }: { width: `${number}%` | number; height?: number; style?: ViewStyle }) {
  return <View style={[{ height, width, borderRadius: 8, backgroundColor: "#e2e8f0", opacity: 0.92 }, style]} />;
}

export function OrgCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.orgCard}>
          <View style={styles.orgRow}>
            <View style={styles.orgAvatar} />
            <View style={styles.orgTextCol}>
              <Bar width="70%" height={16} />
              <Bar width="45%" height={12} style={{ marginTop: 10 }} />
              <Bar width="100%" height={10} style={{ marginTop: 12 }} />
            </View>
          </View>
          <Bar width="40%" height={11} style={{ marginTop: 14, alignSelf: "flex-start" }} />
        </View>
      ))}
    </>
  );
}

export function ServiceCardSkeleton({ count = 4, accentHue = "#2B9B7A" }: { count?: number; accentHue?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.serviceCard}>
          <View style={styles.serviceRow}>
            <View style={[styles.serviceIcon, { backgroundColor: `${accentHue}22` }]} />
            <View style={{ flex: 1 }}>
              <Bar width="75%" height={15} />
              <Bar width="90%" height={11} style={{ marginTop: 10 }} />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Bar width={72} height={26} />
                <Bar width={56} height={26} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

export function InlineDotLoader() {
  return (
    <View style={inline.row}>
      <View style={[inline.dot, inline.d1]} />
      <View style={[inline.dot, inline.d2]} />
      <View style={[inline.dot, inline.d3]} />
    </View>
  );
}

/** Placeholder chips while pets load — matches pet chip sizing */
export function PetChipSkeletonRow({ count = 4 }: { count?: number }) {
  const widths = [68, 84, 52, 72];
  return (
    <View style={petSkin.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[petSkin.chip, { width: widths[i % widths.length] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orgCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#edf2f7",
    shadowColor: "#64748b",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  orgRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  orgAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eef2f6",
  },
  orgTextCol: { flex: 1 },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eef4",
  },
  serviceRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
});

const inline = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, paddingVertical: 8, justifyContent: "center" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#94a3b8",
    opacity: 0.85,
  },
  d1: { opacity: 0.55 },
  d2: { opacity: 0.75 },
  d3: { opacity: 0.95 },
});

const petSkin = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", paddingVertical: 6 },
  chip: {
    height: 42,
    borderRadius: 999,
    backgroundColor: "#dce6ee",
    opacity: 0.85,
  },
});
