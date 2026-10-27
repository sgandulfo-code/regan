/**
 * Geocoding Service for Real Estate Properties (Argentina Context)
 * Provides cached, throttled geocoding with address cleaning and fallback.
 */

export const DEFAULT_MAP_CENTER: [number, number] = [-34.6037, -58.3816]; // Buenos Aires, Argentina

// Memory cache to prevent duplicate requests across views
const memoryCache = new Map<string, { lat: number; lng: number }>();

/**
 * Cleans an address string specifically for geocoding queries:
 * - Strips floor, apartment, unit numbers (e.g. "3° B", "Piso 4", "Depto 2B")
 * - Retains street numbers and intersections
 * - Appends regional context (Buenos Aires, Argentina) if not present
 */
export function cleanAddressForSearch(rawAddress: string): string {
  if (!rawAddress) return '';
  let clean = rawAddress.trim();

  // Remove floor / apartment / unit labels and their following values
  // e.g. "piso 3", "dpto 4b", "depto 2", "unidad 5", "uf 10", "pb", "planta baja"
  clean = clean.replace(/\b(piso|dpto|depto|departamento|unidad|uf|u\.f\.|pb|planta\s+baja|semipiso)\b[^,]+/gi, ' ');

  // Remove standalone apartment symbols like "3° B", "4to A", "2º", "3B" (where number is 1-2 digits)
  clean = clean.replace(/\b\d{1,2}\s*[°ºª]\s*([a-zA-Z])?\b/gi, ' ');
  clean = clean.replace(/\b\d{1,2}[a-zA-Z]\b(?!\d)/gi, ' ');

  // Normalize punctuation and whitespace
  clean = clean.replace(/\s{2,}/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();

  // Add geographic context if missing
  if (!/argentina/i.test(clean)) {
    if (!/buenos aires|caba|capital federal|la plata|mar del plata|rosario|cordoba|mendoza|san isidro|vicente lopez|quilmes|moron|tigre/i.test(clean)) {
      clean = `${clean}, Buenos Aires, Argentina`;
    } else {
      clean = `${clean}, Argentina`;
    }
  }

  return clean;
}

/**
 * Geocodes a single address query with caching and fallback.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = cleanAddressForSearch(address);
  if (!query || query.length < 4) return null;

  const cacheKey = query.toLowerCase();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Check sessionStorage if available
  try {
    const cached = sessionStorage.getItem(`geo_${cacheKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // sessionStorage not available or disabled
  }

  // 1. Try Photon (Komoot OpenStreetMap engine)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const result = { lat, lng };
          memoryCache.set(cacheKey, result);
          try {
            sessionStorage.setItem(`geo_${cacheKey}`, JSON.stringify(result));
          } catch { /* ignore */ }
          return result;
        }
      }
    }
  } catch (err) {
    // Photon timed out or errored, proceed to Nominatim fallback
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      const nomData = await resp.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const lat = parseFloat(nomData[0].lat);
        const lng = parseFloat(nomData[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const result = { lat, lng };
          memoryCache.set(cacheKey, result);
          try {
            sessionStorage.setItem(`geo_${cacheKey}`, JSON.stringify(result));
          } catch { /* ignore */ }
          return result;
        }
      }
    }
  } catch (err) {
    // Nominatim failed as well
  }

  return null;
}

/**
 * Batches a list of properties with rate-limiting throttling (sequential delays)
 * to prevent 429 Too Many Requests from public geocoders.
 */
export async function geocodePropertyList<T extends { lat?: number; lng?: number; exactAddress?: string; address?: string }>(
  items: T[]
): Promise<(T & { lat: number; lng: number; geocodeFailed?: boolean })[]> {
  const results: (T & { lat: number; lng: number; geocodeFailed?: boolean })[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // If property already has valid saved coordinates, use them directly!
    if (
      typeof item.lat === 'number' &&
      typeof item.lng === 'number' &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng) &&
      (item.lat !== 0 || item.lng !== 0)
    ) {
      results.push({ ...item, lat: item.lat, lng: item.lng, geocodeFailed: false });
      continue;
    }

    const query = item.exactAddress || item.address;
    if (!query) {
      results.push({ ...item, lat: 0, lng: 0, geocodeFailed: true });
      continue;
    }

    const coords = await geocodeAddress(query);
    if (coords) {
      results.push({ ...item, lat: coords.lat, lng: coords.lng, geocodeFailed: false });
    } else {
      results.push({ ...item, lat: 0, lng: 0, geocodeFailed: true });
    }

    // Polite delay between outbound network requests to satisfy rate limits (only if not already cached)
    if (i < items.length - 1) {
      await new Promise(res => setTimeout(res, 200));
    }
  }

  return results;
}
