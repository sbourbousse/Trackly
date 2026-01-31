import { apiFetch } from './client';

export type GeocodeResponse = {
	lat: number | null;
	lng: number | null;
	displayName: string | null;
};

export const geocodeAddress = async (address: string): Promise<GeocodeResponse> => {
	if (!address?.trim()) return { lat: null, lng: null, displayName: null };
	const q = new URLSearchParams({ address: address.trim() });
	return await apiFetch<GeocodeResponse>(`/api/geocode?${q}`);
};
