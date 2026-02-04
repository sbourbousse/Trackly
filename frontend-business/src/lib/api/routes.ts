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
