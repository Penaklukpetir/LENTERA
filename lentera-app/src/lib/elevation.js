const ELEVATION_ENDPOINT = 'https://api.open-meteo.com/v1/elevation';
const cache = new Map();

const cacheKey = (lat, lng) => `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;

export async function fetchElevation(lat, lng, signal) {
  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key);

  const res = await fetch(`${ELEVATION_ENDPOINT}?latitude=${lat}&longitude=${lng}`, { signal });
  if (!res.ok) throw new Error(`ELEVATION_HTTP_${res.status}`);

  const data = await res.json();
  const value = Number(Array.isArray(data.elevation) ? data.elevation[0] : NaN);
  if (!Number.isFinite(value)) throw new Error('ELEVATION_UNAVAILABLE');

  const rounded = Math.round(value);
  cache.set(key, rounded);
  return rounded;
}
