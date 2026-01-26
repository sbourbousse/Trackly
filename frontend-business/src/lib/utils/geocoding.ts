/**
 * Géocodage d'adresses en coordonnées GPS
 * Utilise Nominatim (OpenStreetMap) - Gratuit, limite 1 req/s
 */

export type GeocodingResult = {
	lat: number;
	lng: number;
	displayName: string;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Convertit une adresse en coordonnées GPS
 * @param address Adresse à géocoder
 * @returns Coordonnées GPS ou null si erreur
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
	if (!address || !address.trim()) {
		return null;
	}

	try {
		// Encoder l'adresse pour l'URL
		const encodedAddress = encodeURIComponent(address.trim());
		
		// Appel à Nominatim avec respect de la limite (1 req/s)
		const response = await fetch(
			`${NOMINATIM_URL}?q=${encodedAddress}&format=json&limit=1&addressdetails=1`,
			{
				headers: {
					'User-Agent': 'Trackly/1.0' // Requis par Nominatim
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
		return {
			lat: parseFloat(result.lat),
			lng: parseFloat(result.lon),
			displayName: result.display_name || address
		};
	} catch (error) {
		console.error('[Geocoding] Erreur:', error);
		return null;
	}
}

/**
 * Cache simple pour éviter les appels répétés
 */
const geocodingCache = new Map<string, GeocodingResult>();

/**
 * Géocode une adresse avec cache
 */
export async function geocodeAddressCached(address: string): Promise<GeocodingResult | null> {
	const normalizedAddress = address.trim().toLowerCase();
	
	// Vérifier le cache
	if (geocodingCache.has(normalizedAddress)) {
		return geocodingCache.get(normalizedAddress)!;
	}

	// Géocoder et mettre en cache
	const result = await geocodeAddress(address);
	if (result) {
		geocodingCache.set(normalizedAddress, result);
	}

	return result;
}
