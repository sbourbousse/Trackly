import { apiFetch } from './client';
import { browser } from '$app/environment';
import { isOfflineMode } from '../offline/config';

export type DeliveryStatusSummary = {
	pending: number;
	inProgress: number;
	completed: number;
	failed: number;
};

export type ApiRoute = {
	id: string;
	driverId: string;
	name: string | null;
	createdAt: string;
	plannedStartAt: string | null;
	deliveryCount: number;
	driverName: string;
	statusSummary: DeliveryStatusSummary;
};

/** Livraison dans le contexte d'une tournée (GET /api/routes/{id}). */
export type ApiDeliveryInRoute = {
	id: string;
	orderId: string;
	sequence: number | null;
	status: string;
	createdAt: string;
	completedAt: string | null;
	customerName: string;
	address: string;
};

/** Détail d'une tournée avec livraisons ordonnées par Sequence. */
export type ApiRouteDetail = {
	id: string;
	driverId: string;
	name: string | null;
	createdAt: string;
	plannedStartAt: string | null;
	driverName: string;
	deliveries: ApiDeliveryInRoute[];
};

export type RoutesListFilters = {
	dateFrom?: string;
	dateTo?: string;
	driverId?: string;
};

export type RoutesListResponse = {
	routes: ApiRoute[];
};

export const getRoutes = async (filters?: RoutesListFilters): Promise<ApiRoute[]> => {
	if (browser && isOfflineMode()) {
		const { mockRoutesApi } = await import('../offline/mockApi');
		return await mockRoutesApi.getRoutes(filters);
	}
	const params = new URLSearchParams();
	if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
	if (filters?.dateTo) params.set('dateTo', filters.dateTo);
	if (filters?.driverId) params.set('driverId', filters.driverId);
	const path = params.toString() ? `/api/routes?${params}` : '/api/routes';
	const res = await apiFetch<RoutesListResponse>(path);
	return res.routes ?? [];
};

export const getRoute = async (routeId: string): Promise<ApiRouteDetail> => {
	if (browser && isOfflineMode()) {
		const { mockRoutesApi } = await import('../offline/mockApi');
		return await mockRoutesApi.getRoute(routeId);
	}
	return await apiFetch<ApiRouteDetail>(`/api/routes/${routeId}`);
};

export type UpdateRouteRequest = {
	name?: string;
	plannedStartAt?: string | null;
};

export const updateRoute = async (
	routeId: string,
	request: UpdateRouteRequest
): Promise<{ message: string }> => {
	if (browser && isOfflineMode()) {
		return { message: 'OK' };
	}
	return await apiFetch<{ message: string }>(`/api/routes/${routeId}`, {
		method: 'PATCH',
		body: JSON.stringify(request)
	});
};

export const reorderRouteDeliveries = async (
	routeId: string,
	deliveryIds: string[]
): Promise<{ message: string }> => {
	if (browser && isOfflineMode()) {
		const { mockRoutesApi } = await import('../offline/mockApi');
		return await mockRoutesApi.reorderRouteDeliveries(routeId, deliveryIds);
	}
	return await apiFetch<{ message: string }>(`/api/routes/${routeId}/deliveries/order`, {
		method: 'PATCH',
		body: JSON.stringify({ deliveryIds })
	});
};

/** Géométrie d'un itinéraire (polyligne) pour la carte. Coordonnées [lng, lat]. */
export type ApiRouteGeometry = {
	coordinates: [number, number][];
	durationSeconds: number;
	distanceMeters: number;
	/** Segments (legs) entre étapes pour affichage par tronçon coloré. */
	legs?: { coordinates: [number, number][] }[];
};

export const getRouteGeometry = async (routeId: string): Promise<ApiRouteGeometry | null> => {
	if (browser && isOfflineMode()) return null;
	try {
		return await apiFetch<ApiRouteGeometry>(`/api/routes/${routeId}/route-geometry`);
	} catch {
		return null;
	}
};

/** Temps de trajet par segment + total. */
export type ApiRouteTravelTimes = {
	legs: { fromIndex: number; toIndex: number; durationSeconds: number; distanceMeters: number }[];
	totalDurationSeconds: number;
	totalDistanceMeters?: number;
};

/**
 * Matrice des temps entre tous les points (pointIds[0] = "depot", puis ids des livraisons).
 * Permet de calculer les temps pour n'importe quel ordre sans rappel API.
 */
export type ApiRouteTravelTimesMatrix = {
	pointIds: string[];
	durations: number[][];
	distances?: number[][];
	message?: string;
};

export const getRouteTravelTimesMatrix = async (
	routeId: string
): Promise<ApiRouteTravelTimesMatrix | null> => {
	if (browser && isOfflineMode()) return null;
	try {
		return await apiFetch<ApiRouteTravelTimesMatrix>(`/api/routes/${routeId}/travel-times-matrix`);
	} catch {
		return null;
	}
};

export const getRouteTravelTimes = async (routeId: string): Promise<ApiRouteTravelTimes | null> => {
	if (browser && isOfflineMode()) return null;
	try {
		return await apiFetch<ApiRouteTravelTimes>(`/api/routes/${routeId}/travel-times`);
	} catch {
		return null;
	}
};

/** Contour isochrone (minutes + polygone [lng, lat][]). */
export type ApiIsochroneContour = {
	minutes: number;
	coordinates: [number, number][];
};

export type ApiIsochronesResponse = {
	contours: ApiIsochroneContour[];
	message?: string;
};

export const getIsochrones = async (minutes?: string): Promise<ApiIsochronesResponse | null> => {
	if (browser && isOfflineMode()) return null;
	try {
		const path = minutes ? `/api/tenants/me/isochrones?minutes=${encodeURIComponent(minutes)}` : '/api/tenants/me/isochrones';
		return await apiFetch<ApiIsochronesResponse>(path);
	} catch {
		return null;
	}
};
