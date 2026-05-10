export type OrgTypeKey = "vet" | "salon" | "hotel" | "rescue" | string;

export type ProviderDashboardTheme = {
  key: OrgTypeKey;
  /** Hero gradient (3 stops) */
  gradient: [string, string, string];
  accent: string;
  accentSoft: string;
  icon:
    | "medkit-outline"
    | "sparkles-outline"
    | "bed-outline"
    | "heart-outline"
    | "bag-handle-outline"
    | "school-outline"
    | "home-outline";
  kickerKey: string;
};

const DEFAULT: ProviderDashboardTheme = {
  key: "vet",
  gradient: ["#0c4c5c", "#1a7a6c", "#2B9B7A"],
  accent: "#2B9B7A",
  accentSoft: "#d1fae5",
  icon: "medkit-outline",
  kickerKey: "orgDashboard.typeVet",
};

const THEMES: Record<string, ProviderDashboardTheme> = {
  vet: {
    key: "vet",
    gradient: ["#0b3d5c", "#1565a8", "#0d9488"],
    accent: "#0d9488",
    accentSoft: "#ccfbf1",
    icon: "medkit-outline",
    kickerKey: "orgDashboard.typeVet",
  },
  salon: {
    key: "salon",
    gradient: ["#4c1d95", "#7c3aed", "#c026d3"],
    accent: "#a21caf",
    accentSoft: "#fae8ff",
    icon: "sparkles-outline",
    kickerKey: "orgDashboard.typeSalon",
  },
  hotel: {
    key: "hotel",
    gradient: ["#1e3a5f", "#b45309", "#f59e0b"],
    accent: "#d97706",
    accentSoft: "#fff7ed",
    icon: "bed-outline",
    kickerKey: "orgDashboard.typeHotel",
  },
  rescue: {
    key: "rescue",
    gradient: ["#7f1d1d", "#b91c1c", "#ea580c"],
    accent: "#dc2626",
    accentSoft: "#fee2e2",
    icon: "heart-outline",
    kickerKey: "orgDashboard.typeRescue",
  },
  petshop: {
    key: "petshop",
    gradient: ["#14532d", "#15803d", "#22c55e"],
    accent: "#16a34a",
    accentSoft: "#dcfce7",
    icon: "bag-handle-outline",
    kickerKey: "orgDashboard.typePetshop",
  },
  trainer: {
    key: "trainer",
    gradient: ["#312e81", "#4f46e5", "#818cf8"],
    accent: "#4f46e5",
    accentSoft: "#e0e7ff",
    icon: "school-outline",
    kickerKey: "orgDashboard.typeTrainer",
  },
  petsitter: {
    key: "petsitter",
    gradient: ["#0f766e", "#0d9488", "#5eead4"],
    accent: "#0f766e",
    accentSoft: "#ccfbf1",
    icon: "home-outline",
    kickerKey: "orgDashboard.typePetsitter",
  },
};

export function getProviderDashboardTheme(orgType: string | null | undefined): ProviderDashboardTheme {
  const k = String(orgType || "vet")
    .trim()
    .toLowerCase();
  return THEMES[k] ?? DEFAULT;
}
