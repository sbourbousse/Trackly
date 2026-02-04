import { apiFetch } from './client';
import { browser } from '$app/environment';
import { isOfflineMode } from '../offline/config';

export type ApiRoute = {
	id: string;
	driverId: string;
	name: string | null;
	createdAt: string;
	deliveryCount: number;
	driverName: string;
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
