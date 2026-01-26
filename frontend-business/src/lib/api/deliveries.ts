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
