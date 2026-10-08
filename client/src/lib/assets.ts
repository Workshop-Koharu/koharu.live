const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "");

export function resolveAssetUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (!apiBaseUrl) return value;
  try {
    return new URL(value, apiBaseUrl).toString();
  } catch {
    return value;
  }
}
