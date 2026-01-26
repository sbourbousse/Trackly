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