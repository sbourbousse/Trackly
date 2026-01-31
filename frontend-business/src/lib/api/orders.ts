import { apiFetch } from './client';

export type ApiOrder = {
	id: string;
	customerName: string;
	address: string;
	orderDate: string | null;
	status: string;
};

export type ImportOrderRequest = {
	customerName: string;
	address: string;
	orderDate?: string | null;
};

export type ImportOrdersResponse = {
	created: number;
	errors: string[];
	orders: ApiOrder[];
};

export const getOrders = async () => {
	return await apiFetch<ApiOrder[]>('/api/orders');
};

export type CreateOrderRequest = {
	customerName: string;
	address: string;
	orderDate?: string | null;
};

export const createOrder = async (request: CreateOrderRequest) => {
	return await apiFetch<ApiOrder>('/api/orders', {
		method: 'POST',
		body: JSON.stringify({
			customerName: request.customerName,
			address: request.address,
			orderDate: request.orderDate || null
		})
	});
};

export type ApiOrderDetail = {
	id: string;
	customerName: string;
	address: string;
	orderDate: string | null;
	status: string;
	createdAt: string;
	deliveries: ApiOrderDelivery[];
};

export type ApiOrderDelivery = {
	id: string;
	driverId: string;
	driverName?: string;
	status: string;
	createdAt: string;
	completedAt: string | null;
};

export const getOrder = async (id: string) => {
	return await apiFetch<ApiOrderDetail>(`/api/orders/${id}`);
};

export const importOrders = async (orders: ImportOrderRequest[]) => {
	return await apiFetch<ImportOrdersResponse>('/api/orders/import', {
		method: 'POST',
		body: JSON.stringify({ orders })
	});
};

export type DeleteOrdersBatchRequest = {
	ids: string[];
	forceDeleteDeliveries?: boolean;
};

export type DeleteOrdersBatchResponse = {
	deleted: number;
	deletedDeliveries: number;
	skipped: number;
	message: string;
};

export const deleteOrdersBatch = async (request: DeleteOrdersBatchRequest) => {
	return await apiFetch<DeleteOrdersBatchResponse>('/api/orders/batch/delete', {
		method: 'POST',
		body: JSON.stringify({
			ids: request.ids,
			forceDeleteDeliveries: request.forceDeleteDeliveries ?? false
		})
	});
};
