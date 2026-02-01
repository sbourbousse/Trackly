import { apiFetch } from './client';
import { browser } from '$app/environment';
import { isOfflineMode, offlineConfig } from '../offline/config';

export type ApiOrder = {
	id: string;
	customerName: string;
	address: string;
	orderDate: string | null;
	status: string;
};

/** Filtres optionnels pour la liste des commandes (passés en query). */
export type OrdersListFilters = {
	dateFrom?: string;
	dateTo?: string;
	dateFilter?: 'CreatedAt' | 'OrderDate';
	search?: string;
};

export type ImportOrderRequest = {
	customerName: string;
	address: string;
	phoneNumber?: string | null;
	internalComment?: string | null;
	orderDate?: string | null;
};

export type ImportOrdersResponse = {
	created: number;
	errors: string[];
	orders: ApiOrder[];
};

function ordersQueryParams(filters?: OrdersListFilters | OrderStatsListFilters): string {
	if (!filters) return '';
	const entries = [
		filters.dateFrom && ['dateFrom', filters.dateFrom],
		filters.dateTo && ['dateTo', filters.dateTo],
		filters.dateFilter && ['dateFilter', filters.dateFilter],
		filters.search && ['search', filters.search]
	].filter((x): x is [string, string] => Boolean(x));
	if (entries.length === 0) return '';
	return `?${new URLSearchParams(Object.fromEntries(entries))}`;
}

export type OrderStatsListFilters = OrdersListFilters;

export type OrderStatsResponse = {
	byDay: { date: string; count: number }[];
	byHour: { hour: string; count: number }[];
};

export const getOrders = async (filters?: OrdersListFilters) => {
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.getOrders(filters);
	}
	const path = `/api/orders${ordersQueryParams(filters)}`;
	return await apiFetch<ApiOrder[]>(path);
};

export const getOrdersStats = async (filters?: OrderStatsListFilters) => {
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.getOrdersStats();
	}
	const path = `/api/orders/stats${ordersQueryParams(filters)}`;
	return await apiFetch<OrderStatsResponse>(path);
};

export type CreateOrderRequest = {
	customerName: string;
	address: string;
	phoneNumber?: string | null;
	internalComment?: string | null;
	orderDate?: string | null;
};

export const createOrder = async (request: CreateOrderRequest) => {
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.createOrder(request);
	}
	return await apiFetch<ApiOrder>('/api/orders', {
		method: 'POST',
		body: JSON.stringify({
			customerName: request.customerName,
			address: request.address,
			phoneNumber: request.phoneNumber || null,
			internalComment: request.internalComment || null,
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
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.getOrder(id);
	}
	return await apiFetch<ApiOrderDetail>(`/api/orders/${id}`);
};

export const importOrders = async (orders: ImportOrderRequest[]) => {
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.importOrders(orders);
	}
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
	if (browser && isOfflineMode()) {
		const { mockOrdersApi } = await import('../offline/mockApi');
		return await mockOrdersApi.deleteOrdersBatch(request);
	}
	return await apiFetch<DeleteOrdersBatchResponse>('/api/orders/batch/delete', {
		method: 'POST',
		body: JSON.stringify({
			ids: request.ids,
			forceDeleteDeliveries: request.forceDeleteDeliveries ?? false
		})
	});
};
