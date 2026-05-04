import AsyncStorage from "@react-native-async-storage/async-storage";

/** Normalize base URL: trim slashes and strip accidental `/api` (paths add `/api/...`). */
function normalizeApiBaseUrl(raw: string): string {
  let u = String(raw || "").trim();
  if (!u) return "http://localhost:3000";
  u = u.replace(/\/+$/, "");
  if (/\/api$/i.test(u)) u = u.replace(/\/api$/i, "").replace(/\/+$/, "");
  return u || "http://localhost:3000";
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000");

/**
 * Read body as JSON. If the server returns HTML (404 page, wrong port, nginx), avoid JSON.parse
 * crashing and expose a clearer error.
 */
export async function parseResponseJson<T>(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  bodySnippet?: string;
  isProbablyHtml?: boolean;
}> {
  const text = await res.text();
  const trimmed = text.trim();
  const looksJson =
    trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith('"');
  const isProbablyHtml =
    trimmed.startsWith("<") || /^<!DOCTYPE/i.test(trimmed) || /<html[\s>]/i.test(trimmed.slice(0, 400));
  if (!looksJson) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      bodySnippet: trimmed.slice(0, 280),
      isProbablyHtml,
    };
  }
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) as T };
  } catch {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      bodySnippet: trimmed.slice(0, 280),
      isProbablyHtml,
    };
  }
}

export async function getAuthHeaders(json = true): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("token");
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...(await getAuthHeaders()), ...(init?.headers as Record<string, string>) },
  });
  const parsed = await parseResponseJson<T>(res);
  const data = (parsed.data ?? ({} as T)) as T;
  return { ok: parsed.ok, status: parsed.status, data };
}
