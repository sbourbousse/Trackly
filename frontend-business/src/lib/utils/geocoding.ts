/**
 * Géocodage d'adresses en coordonnées GPS
 * Utilise Nominatim (OpenStreetMap) - Gratuit, limite 1 req/s
 *
 * Réduire les coûts / respecter les limites :
 * - Cache mémoire (session) + cache persistant (localStorage avec TTL)
 * - Rate limiting 1 req/s vers Nominatim
 * - Préférer l'API backend /api/geocode si disponible (centralise le cache côté serveur)
 */

export type GeocodingResult = {
	lat: number;
	lng: number;
	displayName: string;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** TTL du cache persistant (30 jours en ms). */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY = 'trackly-geocode-cache';
const CACHE_MAX_ENTRIES = 500;

/** Délai minimum entre deux appels Nominatim (1 req/s + marge). */
const NOMINATIM_MIN_INTERVAL_MS = 1100;
let lastNominatimCall = 0;
const rateLimitQueue: Array<() => void> = [];

function releaseNextInQueue() {
	if (rateLimitQueue.length > 0) {
		lastNominatimCall = Date.now();
		const next = rateLimitQueue.shift();
		if (next) {
			next();
			setTimeout(releaseNextInQueue, NOMINATIM_MIN_INTERVAL_MS);
		}
	}
}

/** Attend le prochain créneau (1 req/s) avant d'appeler Nominatim. */
function waitForRateLimit(): Promise<void> {
	return new Promise((resolve) => {
		const now = Date.now();
		const elapsed = now - lastNominatimCall;
		if (elapsed >= NOMINATIM_MIN_INTERVAL_MS && rateLimitQueue.length === 0) {
			lastNominatimCall = now;
			resolve();
			setTimeout(releaseNextInQueue, NOMINATIM_MIN_INTERVAL_MS);
			return;
		}
		rateLimitQueue.push(resolve);
		if (rateLimitQueue.length === 1) {
			const delay = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - elapsed);
			setTimeout(releaseNextInQueue, delay);
		}
	});
}

type CacheEntry = GeocodingResult & { cachedAt: number };

function loadPersistentCache(): Map<string, CacheEntry> {
	if (typeof window === 'undefined') return new Map();
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return new Map();
		const data = JSON.parse(raw) as Record<string, CacheEntry>;
		const now = Date.now();
		const map = new Map<string, CacheEntry>();
		for (const [key, entry] of Object.entries(data)) {
			if (entry?.cachedAt && now - entry.cachedAt < CACHE_TTL_MS && typeof entry.lat === 'number' && typeof entry.lng === 'number') {
				map.set(key, entry);
			}
		}
		return map;
	} catch {
		return new Map();
	}
}

function savePersistentCache(cache: Map<string, CacheEntry>) {
	if (typeof window === 'undefined') return;
	try {
		const entries = [...cache.entries()];
		if (entries.length > CACHE_MAX_ENTRIES) {
			const sorted = entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
			entries.length = 0;
			entries.push(...sorted.slice(-CACHE_MAX_ENTRIES));
		}
		const obj = Object.fromEntries(entries);
		localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
	} catch {
		// quota exceeded or private mode
	}
}

/** Cache mémoire (session). */
const memoryCache = new Map<string, GeocodingResult>();
/** Cache persistant (localStorage), chargé au premier usage. */
let persistentCache: Map<string, CacheEntry> | null = null;

/** Vide le cache géocode (localStorage + mémoire). À appeler au logout pour ne pas garder les données du tenant précédent. */
export function clearGeocodeCache(): void {
	memoryCache.clear();
	persistentCache = null;
	if (typeof window !== 'undefined') {
		try {
			localStorage.removeItem(CACHE_KEY);
		} catch {
			// ignore
		}
	}
}

function getPersistentCache(): Map<string, CacheEntry> {
	if (persistentCache === null) {
		persistentCache = loadPersistentCache();
	}
	return persistentCache;
}

function getFromPersistentCache(normalizedAddress: string): GeocodingResult | null {
	const entry = getPersistentCache().get(normalizedAddress);
	if (!entry) return null;
	return { lat: entry.lat, lng: entry.lng, displayName: entry.displayName };
}

function setPersistentCache(normalizedAddress: string, result: GeocodingResult) {
	const cache = getPersistentCache();
	cache.set(normalizedAddress, { ...result, cachedAt: Date.now() });
	savePersistentCache(cache);
}

/**
 * Convertit une adresse en coordonnées GPS (appel direct Nominatim, rate-limited 1 req/s).
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
	if (!address || !address.trim()) {
		return null;
	}

	await waitForRateLimit();

	try {
		const encodedAddress = encodeURIComponent(address.trim());
		const response = await fetch(
			`${NOMINATIM_URL}?q=${encodedAddress}&format=json&limit=1&addressdetails=1`,
			{
				headers: {
					'User-Agent': 'Trackly/1.0'
				}
			}
		);

		if (!response.ok) {
			console.warn('[Geocoding] Erreur HTTP:', response.status);
			return null;
		}

		const data = await response.json();

		if (!data || data.length === 0) {
			console.warn('[Geocoding] Aucun résultat pour:', address);
			return null;
		}

		const result = data[0];
		const out: GeocodingResult = {
			lat: parseFloat(result.lat),
			lng: parseFloat(result.lon),
			displayName: result.display_name || address
		};
		return out;
	} catch (error) {
		console.error('[Geocoding] Erreur:', error);
		return null;
	}
}

/**
 * Géocode une adresse avec cache (mémoire + localStorage TTL 30j) et rate limit 1 req/s.
 */
export async function geocodeAddressCached(address: string): Promise<GeocodingResult | null> {
	const normalizedAddress = address.trim().toLowerCase();
	if (!normalizedAddress) return null;

	// 1. Cache mémoire (session)
	if (memoryCache.has(normalizedAddress)) {
		return memoryCache.get(normalizedAddress)!;
	}

	// 2. Cache persistant (localStorage)
	const fromStorage = getFromPersistentCache(normalizedAddress);
	if (fromStorage) {
		memoryCache.set(normalizedAddress, fromStorage);
		return fromStorage;
	}

	// 3. Appel Nominatim (rate-limited)
	const result = await geocodeAddress(address);
	if (result) {
		memoryCache.set(normalizedAddress, result);
		setPersistentCache(normalizedAddress, result);
	}

	return result;
}
