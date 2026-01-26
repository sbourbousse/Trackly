import { apiFetch } from './client';

export type ApiDelivery = {
	id: string;
	orderId: string;
	driverId: string;
	status: string;
	completedAt: string | null;
};

export const getDeliveries = async () => {
	return await apiFetch<ApiDelivery[]>('/api/deliveries');
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