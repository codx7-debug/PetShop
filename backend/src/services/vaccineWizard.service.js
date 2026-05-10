/** Heuristic vaccination ideas for the in-app wizard (not medical advice — educational only). */
export function wizardSuggestions(speciesRaw, ageMonthsRaw) {
  const ageMonths = Math.max(0, Math.min(480, Number(ageMonthsRaw) || 12));
  const s = String(speciesRaw || "dog").trim().toLowerCase();

  const isDog = /\b(dog|canine)\b|^k9|köpek|cão\b|пёс|\bсобак/i.test(s);
  const isCat = /\b(cat|feline)\b|^kat\b|kot\b|pisica\b|pisică|chat\b|gato\b|\bkot\b/i.test(s);

  /** @type {{ vaccine_name: string; rationale: string; hint_next_visit_months?: number }[]} */
  const list = [];

  if (isCat) {
    if (ageMonths < 4) list.push({
      vaccine_name: "Core kitten — FVRCP (combined)",
      rationale: "Typical schedule for kittens; exact timing follows your clinician.",
      hint_next_visit_months: 4,
    });
    list.push({
      vaccine_name: "Rabies (local rules apply)",
      rationale: "Compliance depends on municipality; clinic will confirm cadence.",
    });
    if (ageMonths >= 12) list.push({
      vaccine_name: "Adult booster check",
      rationale: "Annual or triennial booster plans vary by antigen and practitioner.",
      hint_next_visit_months: 12,
    });
  }

  const dogOrDefault = !isCat || (!isDog && !isCat) ? true : isDog;

  if (dogOrDefault || isDog || list.length === 0) {
    if (ageMonths < 16) list.push({
      vaccine_name: "DHPP/DAPP puppy series",
      rationale: "Core distemper/parvo family boosters spaced per protocol.",
      hint_next_visit_months: 5,
    });
    list.push({
      vaccine_name: "Rabies (local rules)",
      rationale: "Mandatory timing differs by jurisdiction.",
    });
    if (ageMonths >= 6 && ageMonths < 36) list.push({
      vaccine_name: "Lifestyle vaccines (Lepto / Bordetella / Lyme)",
      rationale: "Only if geography and boarding/daycare dictate — discuss with veterinarian.",
      hint_next_visit_months: 12,
    });
    if (ageMonths >= 12) list.push({
      vaccine_name: "Annual wellness & booster review",
      rationale: "Titer or revaccinate based on clinician choice.",
      hint_next_visit_months: 12,
    });
  }

  return list;
}
