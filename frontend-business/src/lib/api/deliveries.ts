import { apiFetch } from './client';
import { browser } from '$app/environment';
import { offlineConfig } from '../offline/config';

export type ApiDelivery = {
	id: string;
	orderId: string;
	driverId: string;
	status: string;
	createdAt?: string;
	completedAt: string | null;
};

/** Filtres optionnels pour la liste des livraisons (passés en query). */
export type DeliveriesListFilters = {
	dateFrom?: string;
	dateTo?: string;
	dateFilter?: 'CreatedAt' | 'OrderDate';
};

export const getDeliveries = async (filters?: DeliveriesListFilters) => {
	if (browser && offlineConfig.enabled) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.getDeliveries(filters);
	}
	const path = filters && (filters.dateFrom ?? filters.dateTo ?? filters.dateFilter)
		? `/api/deliveries?${new URLSearchParams(
				Object.fromEntries(
					[
						filters.dateFrom && ['dateFrom', filters.dateFrom],
						filters.dateTo && ['dateTo', filters.dateTo],
						filters.dateFilter && ['dateFilter', filters.dateFilter]
					].filter((x): x is [string, string] => Boolean(x))
				)
			)}`
		: '/api/deliveries';
	return await apiFetch<ApiDelivery[]>(path);
};

export type ApiDeliveryDetail = {
	id: string;
	orderId: string;
	driverId: string;
	status: string;
	createdAt: string;
	completedAt: string | null;
	customerName: string;
	address: string;
	driverName: string;
};

export const getDelivery = async (id: string) => {
	if (browser && offlineConfig.enabled) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.getDelivery(id);
	}
	return await apiFetch<ApiDeliveryDetail>(`/api/deliveries/${id}`);
};

export const deleteDelivery = async (id: string) => {
	if (browser && offlineConfig.enabled) {
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
	if (browser && offlineConfig.enabled) {
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
};

export type CreateDeliveriesBatchResponse = {
	created: number;
	deliveries: ApiDelivery[];
};

export const createDeliveriesBatch = async (request: CreateDeliveriesBatchRequest) => {
	if (browser && offlineConfig.enabled) {
		const { mockDeliveriesApi } = await import('../offline/mockApi');
		return await mockDeliveriesApi.createDeliveriesBatch(request);
	}
	return await apiFetch<CreateDeliveriesBatchResponse>('/api/deliveries/batch', {
		method: 'POST',
		body: JSON.stringify({
			driverId: request.driverId,
			orderIds: request.orderIds
		})
	});
};