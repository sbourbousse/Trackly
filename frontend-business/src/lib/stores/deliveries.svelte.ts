/** Statuts possibles (API = Pending, InProgress, Completed, Failed ; affichage FR = Prévue, En cours, Livrée, Échec). */
export type DeliveryStatus = 'Prevue' | 'En cours' | 'Livree' | 'Retard' | 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export type DeliveryRoute = {
	id: string;
	route: string;
	driver: string;
	stops: number;
	status: DeliveryStatus;
	eta: string;
};

export type DeliveryStop = {
	id: string;
	name: string;
	address: string;
	status: 'Prevu' | 'En cours' | 'Livre';
	eta: string;
};

export let deliveriesState = $state({
	routes: [] as DeliveryRoute[],
	activeRouteId: null as string | null,
	stops: [] as DeliveryStop[],
	lastUpdateAt: '10:18',
	loading: false,
	error: null as string | null
});

export const deliveriesActions = {
	setRoutes(routes: DeliveryRoute[]) {
		deliveriesState.routes = routes;
	},
	setActiveRoute(routeId: string | null) {
		deliveriesState.activeRouteId = routeId;
	},
	setStops(stops: DeliveryStop[]) {
		deliveriesState.stops = stops;
	},
	setLastUpdateAt(time: string) {
		deliveriesState.lastUpdateAt = time;
	},
	async loadDeliveries(filters?: import('$lib/api/deliveries').DeliveriesListFilters) {
		deliveriesState.loading = true;
		deliveriesState.error = null;
		
		try {
			const { getDeliveries } = await import('$lib/api/deliveries');
			const { getListFilters } = await import('$lib/stores/dateRange.svelte');
			const payload = filters ?? getListFilters();
			const deliveries = await getDeliveries(payload);

			deliveriesState.routes = deliveries.map((delivery) => ({
				id: delivery.id,
				route: `Tournee ${delivery.id.slice(0, 4).toUpperCase()}`,
				driver: delivery.driverId || 'Non assigne',
				stops: 1,
				status: delivery.status as DeliveryStatus,
				eta: '11:40'
			}));
			deliveriesState.lastUpdateAt = new Date().toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('[Deliveries] Erreur lors du chargement:', error);
			deliveriesState.error = error instanceof Error 
				? error.message 
				: 'Erreur lors du chargement des tournees';
			// Garde les données existantes en cas d'erreur
		} finally {
			deliveriesState.loading = false;
		}
	}
};
