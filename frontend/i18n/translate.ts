import type { AppLocale } from "./translations";
import { translations } from "./translations";
import { screenTranslations } from "./screenTranslations";

function readPath(root: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc !== null && acc !== undefined && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, root);
}

function localeRoot(locale: AppLocale): Record<string, unknown> {
  return {
    ...(translations[locale] as unknown as Record<string, unknown>),
    ...(screenTranslations[locale] as unknown as Record<string, unknown>),
  };
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
