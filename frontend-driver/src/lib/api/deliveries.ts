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

export const getDelivery = async (id: string) => {
	// Pour l'instant, on récupère depuis la liste
	// TODO: Créer un endpoint GET /api/deliveries/{id} dans le backend
	const deliveries = await getDeliveries();
	const delivery = deliveries.find(d => d.id === id);
	if (!delivery) {
		throw new Error('Livraison introuvable');
	}
	return delivery;
};

export const completeDelivery = async (id: string) => {
	return await apiFetch(`/api/deliveries/${id}/complete`, {
		method: 'PATCH'
	});
};
