import { apiFetch } from './client';
import { offlineConfig } from '../offline/config';
import { mockRoutesApi } from '../offline/mockApi';

/** Livraison dans le contexte d'une tournée (pour progress X/Y). */
export type ApiDeliveryInRoute = {
	id: string;
	orderId: string;
	sequence: number | null;
	status: string;
	createdAt: string;
	completedAt: string | null;
	customerName: string;
	address: string;
};

/** Détail tournée (pour afficher "X / Y livrées" dans l'app chauffeur). */
export type ApiRouteDetail = {
	id: string;
	driverId: string;
	name: string | null;
	createdAt: string;
	driverName: string;
	deliveries: ApiDeliveryInRoute[];
};

export const getRoute = async (routeId: string): Promise<ApiRouteDetail> => {
	if (offlineConfig.enabled) {
		return await mockRoutesApi.getRoute(routeId);
	}
	return await apiFetch<ApiRouteDetail>(`/api/routes/${routeId}`);
};
