import { apiFetch } from './client';
import { isOfflineMode } from '../offline/config';

export type HeadquartersResponse = {
	address: string | null;
	lat: number | null;
	lng: number | null;
};

export type HeadquartersUpdateRequest = {
	address?: string | null;
	lat?: number | null;
	lng?: number | null;
};

export async function getHeadquarters(): Promise<HeadquartersResponse> {
	if (isOfflineMode()) {
		// Fallback localStorage en mode démo
		try {
			const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('trackly-settings') : null;
			if (raw) {
				const data = JSON.parse(raw) as { headquarters?: { lat?: number; lng?: number }; address?: string };
				const hq = data.headquarters;
				if (hq && typeof hq.lat === 'number' && typeof hq.lng === 'number') {
					return { address: data.address ?? null, lat: hq.lat, lng: hq.lng };
				}
			}
		} catch {
			// ignore
		}
		return { address: null, lat: null, lng: null };
	}
	return apiFetch<HeadquartersResponse>('/api/tenants/me/headquarters');
}

export async function updateHeadquarters(request: HeadquartersUpdateRequest): Promise<HeadquartersResponse> {
	if (isOfflineMode()) {
		const lat = request.lat ?? null;
		const lng = request.lng ?? null;
		const address = request.address ?? null;
		try {
			if (typeof localStorage !== 'undefined' && lat != null && lng != null) {
				localStorage.setItem(
					'trackly-settings',
					JSON.stringify({ headquarters: { lat, lng }, address })
				);
			}
		} catch {
			// ignore
		}
		return { address, lat, lng };
	}
	return apiFetch<HeadquartersResponse>('/api/tenants/me/headquarters', {
		method: 'PUT',
		body: JSON.stringify({
			address: request.address ?? null,
			lat: request.lat ?? null,
			lng: request.lng ?? null
		})
	});
}
