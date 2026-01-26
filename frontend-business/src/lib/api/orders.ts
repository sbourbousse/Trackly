import { apiFetch } from './client';

export type ApiOrder = {
	id: string;
	customerName: string;
	address: string;
	status: string;
};

export type ImportOrderRequest = {
	customerName: string;
	address: string;
};

export type ImportOrdersResponse = {
	created: number;
	errors: string[];
	orders: ApiOrder[];
};

export const getOrders = async () => {
	return await apiFetch<ApiOrder[]>('/api/orders');
};

export const importOrders = async (orders: ImportOrderRequest[]) => {
	return await apiFetch<ImportOrdersResponse>('/api/orders/import', {
		method: 'POST',
		body: JSON.stringify({ orders })
	});
};
