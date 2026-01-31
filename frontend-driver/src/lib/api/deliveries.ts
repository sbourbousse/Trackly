import { apiFetch } from './client';

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
	return await apiFetch<ApiDelivery[]>('/api/deliveries');
};

export const getDelivery = async (id: string) => {
	return await apiFetch<ApiDeliveryDetail>(`/api/deliveries/${id}`);
};

/** Passe la livraison en "en cours" (InProgress). À appeler quand le chauffeur clique sur "Démarrer suivi". */
export const startDelivery = async (id: string) => {
	return await apiFetch<ApiDelivery>(`/api/deliveries/${id}/start`, {
		method: 'PATCH'
	});
};

export const completeDelivery = async (id: string) => {
	return await apiFetch(`/api/deliveries/${id}/complete`, {
		method: 'PATCH'
	});
};
