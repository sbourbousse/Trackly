import { apiFetch } from './client';
import { offlineConfig } from '../offline/config';
import { mockDeliveriesApi } from '../offline/mockApi';

export type ApiDelivery = {
	id: string;
	orderId: string;
	driverId: string;
	status: string;
	completedAt: string | null;
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

export const getDeliveries = async () => {
	if (offlineConfig.enabled) {
		return await mockDeliveriesApi.getDeliveries();
	}
	return await apiFetch<ApiDelivery[]>('/api/deliveries');
};

export const getDelivery = async (id: string) => {
	if (offlineConfig.enabled) {
		return await mockDeliveriesApi.getDelivery(id);
	}
	return await apiFetch<ApiDeliveryDetail>(`/api/deliveries/${id}`);
};

/** Passe la livraison en "en cours" (InProgress). À appeler quand le chauffeur clique sur "Démarrer suivi". */
export const startDelivery = async (id: string) => {
	if (offlineConfig.enabled) {
		return await mockDeliveriesApi.startDelivery(id);
	}
	return await apiFetch<ApiDelivery>(`/api/deliveries/${id}/start`, {
		method: 'PATCH'
	});
};

export const completeDelivery = async (id: string) => {
	if (offlineConfig.enabled) {
		await mockDeliveriesApi.completeDelivery(id);
		return;
	}
	return await apiFetch(`/api/deliveries/${id}/complete`, {
		method: 'PATCH'
	});
};
