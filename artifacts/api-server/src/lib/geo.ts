// Best-effort IP geolocation for visit analytics. Never throws — returns null
// on any failure so visit recording is never blocked by a geo lookup.

const PRIVATE_OR_LOCAL =
  /^(10\.|127\.|0\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i;

export function clientIpFrom(
  xff: string | string[] | undefined,
  fallback?: string | null,
): string | null {
  const headerVal = Array.isArray(xff) ? xff[0] : xff;
  const fromHeader = (headerVal ?? "").split(",")[0]?.trim();
  const ip = (fromHeader || (fallback ?? "").trim()).replace(/^::ffff:/, "");
  return ip || null;
}

export async function lookupGeo(
  ip: string | null,
): Promise<{ country: string | null; city: string | null } | null> {
  if (!ip || PRIVATE_OR_LOCAL.test(ip)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const resp = await fetch(
      `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`,
      { signal: controller.signal },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      countryName?: string;
      cityName?: string;
    };
    return {
      country: data.countryName?.slice(0, 128) || null,
      city: data.cityName?.slice(0, 128) || null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
