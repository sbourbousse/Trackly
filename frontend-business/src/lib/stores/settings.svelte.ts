/**
 * Paramètres applicatifs (siège social, etc.).
 * Chargés depuis le serveur (API tenants/me/headquarters), avec fallback localStorage en mode démo.
 */

import { browser } from '$app/environment';
import { getHeadquarters, updateHeadquarters } from '$lib/api/headquarters';

const STORAGE_KEY = 'trackly-settings';

export type HeadquartersPosition = { lat: number; lng: number };

export type HeadquartersFull = {
	address: string | null;
	lat: number | null;
	lng: number | null;
};

function getDefaultState(): { headquarters: HeadquartersPosition | null; headquartersAddress: string | null } {
	return { headquarters: null, headquartersAddress: null };
}

function loadFromStorage(): { headquarters: HeadquartersPosition | null; headquartersAddress: string | null } {
	if (!browser) return getDefaultState();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return getDefaultState();
		const data = JSON.parse(raw) as {
			headquarters?: { lat?: number; lng?: number } | null;
			headquartersAddress?: string | null;
		};
		if (data.headquarters != null && typeof data.headquarters.lat === 'number' && typeof data.headquarters.lng === 'number') {
			return {
				headquarters: { lat: data.headquarters.lat, lng: data.headquarters.lng },
				headquartersAddress: data.headquartersAddress ?? null
			};
		}
		return getDefaultState();
	} catch {
		return getDefaultState();
	}
}

export let settingsState = $state(loadFromStorage());

export const settingsUI = $state({ ready: false });

function persistToStorage() {
	if (!browser) return;
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				headquarters: settingsState.headquarters,
				headquartersAddress: settingsState.headquartersAddress
			})
		);
	} catch {
		// ignore
	}
}

export const settingsActions = {
	/** Met à jour le siège social (adresse et/ou coordonnées) et enregistre côté serveur. */
	async setHeadquarters(value: HeadquartersFull | { address?: string | null; lat?: number | null; lng?: number | null }) {
		const address = 'address' in value ? value.address : null;
		const lat = 'lat' in value ? value.lat : null;
		const lng = 'lng' in value ? value.lng : null;
		const response = await updateHeadquarters({ address, lat, lng });
		settingsState.headquartersAddress = response.address ?? null;
		settingsState.headquarters =
			response.lat != null && response.lng != null ? { lat: response.lat, lng: response.lng } : null;
		persistToStorage();
	},
	/** Efface le siège social côté serveur. */
	async clearHeadquarters() {
		await updateHeadquarters({ address: null, lat: null, lng: null });
		settingsState.headquarters = null;
		settingsState.headquartersAddress = null;
		persistToStorage();
	},
	/** Réinitialise le state (siège social à null). À appeler au logout. */
	reset() {
		settingsState.headquarters = null;
		settingsState.headquartersAddress = null;
		if (browser) {
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// ignore
			}
		}
	},
	/** Restaure depuis le serveur (ou localStorage en démo). */
	async restoreFromStorage() {
		if (!browser) return;
		try {
			const response = await getHeadquarters();
			settingsState.headquartersAddress = response.address ?? null;
			settingsState.headquarters =
				response.lat != null && response.lng != null ? { lat: response.lat, lng: response.lng } : null;
			persistToStorage();
		} catch {
			// Fallback localStorage
			const loaded = loadFromStorage();
			settingsState.headquarters = loaded.headquarters;
			settingsState.headquartersAddress = loaded.headquartersAddress;
			persistToStorage();
		}
		settingsUI.ready = true;
	}
};
