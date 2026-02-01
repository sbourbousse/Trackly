import { apiFetch } from './client';

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
	return await apiFetch<ApiDeliveryDetail>(`/api/deliveries/${id}`);
};

export const deleteDelivery = async (id: string) => {
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
	return await apiFetch<CreateDeliveriesBatchResponse>('/api/deliveries/batch', {
		method: 'POST',
		body: JSON.stringify({
			driverId: request.driverId,
			orderIds: request.orderIds
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