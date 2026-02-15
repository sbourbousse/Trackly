import { apiFetch } from './client';
import { browser } from '$app/environment';
import { isOfflineMode } from '../offline/config';

export type ApiDelivery = {
	id: string;
	orderId: string;
	driverId: string;
	routeId?: string | null;
	sequence?: number | null;
	status: string;
	createdAt?: string;
	completedAt: string | null;
};

/** Filtres optionnels pour la liste des livraisons (passés en query). */
export type DeliveriesListFilters = {
	dateFrom?: string;
	dateTo?: string;
	dateFilter?: 'CreatedAt' | 'OrderDate';
	routeId?: string;
};

export const getDeliveries = async (filters?: DeliveriesListFilters) => {
	if (browser && isOfflineMode()) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.getDeliveries(filters);
	}
	const entries: [string, string][] = [];
	if (filters?.dateFrom) entries.push(['dateFrom', filters.dateFrom]);
	if (filters?.dateTo) entries.push(['dateTo', filters.dateTo]);
	if (filters?.dateFilter) entries.push(['dateFilter', filters.dateFilter]);
	if (filters?.routeId) entries.push(['routeId', filters.routeId]);
	const path = entries.length ? `/api/deliveries?${new URLSearchParams(entries)}` : '/api/deliveries';
	return await apiFetch<ApiDelivery[]>(path);
};

export type ApiDeliveryDetail = {
	id: string;
	orderId: string;
	driverId: string;
	sequence?: number | null;
	status: string;
	createdAt: string;
	completedAt: string | null;
	customerName: string;
	address: string;
	driverName: string;
};

export const getDelivery = async (id: string) => {
	if (browser && isOfflineMode()) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.getDelivery(id);
	}
	return await apiFetch<ApiDeliveryDetail>(`/api/deliveries/${id}`);
};

export const deleteDelivery = async (id: string) => {
	if (browser && isOfflineMode()) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.deleteDelivery(id);
	}
	return await apiFetch<{ message: string }>(`/api/deliveries/${id}`, {
		method: 'DELETE'
	});
};

export type DeleteDeliveriesBatchRequest = {
	ids: string[];
};

export type DeleteDeliveriesBatchResponse = {
	deleted: number;
	message: string;
};

export const deleteDeliveriesBatch = async (request: DeleteDeliveriesBatchRequest) => {
	if (browser && isOfflineMode()) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.deleteDeliveriesBatch(request);
	}
	return await apiFetch<DeleteDeliveriesBatchResponse>('/api/deliveries/batch/delete', {
		method: 'POST',
		body: JSON.stringify({ ids: request.ids })
	});
};

export type CreateDeliveriesBatchRequest = {
	driverId: string;
	orderIds: string[];
	name?: string;
	/** Heure de début prévue (ISO 8601) pour le calcul des ETA. */
	plannedStartAt?: string;
};

export type CreateDeliveriesBatchResponse = {
	created: number;
	deliveries: ApiDelivery[];
};

export const createDeliveriesBatch = async (request: CreateDeliveriesBatchRequest) => {
	if (browser && isOfflineMode()) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.createDeliveriesBatch(request);
	}
	return await apiFetch<CreateDeliveriesBatchResponse>('/api/deliveries/batch', {
		method: 'POST',
		body: JSON.stringify({
			driverId: request.driverId,
			orderIds: request.orderIds,
			...(request.name != null && request.name !== '' && { name: request.name }),
			...(request.plannedStartAt != null && request.plannedStartAt !== '' && { plannedStartAt: request.plannedStartAt })
		})
	});
};

export type DeliveryStatsResponse = {
	byDay: Array<{ date: string; count: number }>;
	byHour: Array<{ hour: string; count: number }>;
};

export const getDeliveriesStats = async (filters?: DeliveriesListFilters) => {
	const path = filters && (filters.dateFrom ?? filters.dateTo ?? filters.dateFilter)
		? `/api/deliveries/stats?${new URLSearchParams(
				Object.fromEntries(
					[
						filters.dateFrom && ['dateFrom', filters.dateFrom],
						filters.dateTo && ['dateTo', filters.dateTo],
						filters.dateFilter && ['dateFilter', filters.dateFilter]
					].filter((x): x is [string, string] => Boolean(x))
				)
			)}`
		: '/api/deliveries/stats';
	return await apiFetch<DeliveryStatsResponse>(path);
};