import { apiFetch } from './client';

export type ApiOrder = {
	id: string;
	customerName: string;
	address: string;
	status: string;
};

export const getOrders = async () => {
	return await apiFetch<ApiOrder[]>('/api/orders');
};
