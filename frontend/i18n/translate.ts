import type { AppLocale } from "./translations";
import { translations } from "./translations";
import { screenTranslations } from "./screenTranslations";
import { extraScreenTranslations } from "./extraScreenTranslations";

function readPath(root: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc !== null && acc !== undefined && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, root);
}

/** Overlay string maps per namespace (e.g. extra `browseServices` keys without replacing the whole group). */
function mergeNamespaceOverlays(
  base: Record<string, unknown>,
  overlay: Record<string, Record<string, string>>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [ns, additions] of Object.entries(overlay)) {
    const prev = out[ns];
    const merged =
      prev && typeof prev === "object" && !Array.isArray(prev)
        ? { ...(prev as Record<string, string>), ...additions }
        : { ...additions };
    out[ns] = merged;
  }
  return out;
}

function localeRoot(locale: AppLocale): Record<string, unknown> {
  const shallow: Record<string, unknown> = {
    ...(translations[locale] as unknown as Record<string, unknown>),
    ...(screenTranslations[locale] as unknown as Record<string, unknown>),
  };
  const extra = extraScreenTranslations[locale];
  if (!extra) return shallow;
  return mergeNamespaceOverlays(shallow, extra);
}

function applyParams(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    const needle = `{{${k}}}`;
    out = out.split(needle).join(String(v));
  }
  return out;
}

/** Dot-path lookup with English fallback; optional `{{key}}` interpolation. */
export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  let raw = readPath(localeRoot(locale), key);
  if (typeof raw !== "string") {
    raw = readPath(localeRoot("en"), key);
  }
  if (typeof raw !== "string") return key;
  return applyParams(raw, params);
}
