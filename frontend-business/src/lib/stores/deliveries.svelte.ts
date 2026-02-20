import {
	buildQueryCacheKey,
	clearQueryCache,
	getQueryCache,
	invalidateQueryCachePrefix,
	isCacheFresh,
	runQueryDeduped,
	setQueryCache
} from '$lib/stores/queryCache.svelte';

/** Statuts possibles (API = Pending, InProgress, Completed, Failed ; affichage FR = Prévue, En cours, Livrée, Échec). */
export type DeliveryStatus = 'Prevue' | 'En cours' | 'Livree' | 'Retard' | 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export type DeliveryRoute = {
	id: string;
	route: string;
	driver: string;
	stops: number;
	status: DeliveryStatus;
	/** ISO date string pour le graphique par période (ex. 2025-02-04T10:00:00Z). */
	createdAt?: string | null;
};

export type DeliveryStop = {
	id: string;
	name: string;
	address: string;
	status: 'Prevu' | 'En cours' | 'Livre';
};

export let deliveriesState = $state({
	routes: [] as DeliveryRoute[],
	activeRouteId: null as string | null,
	stops: [] as DeliveryStop[],
	lastUpdateAt: '10:18',
	loading: false,
	error: null as string | null
});

const DELIVERIES_STALE_TIME_MS = 30_000;
const DELIVERIES_CACHE_TIME_MS = 10 * 60_000;
let deliveriesLoadRequestId = 0;
let deliveriesAbortController: AbortController | null = null;
let deliveriesActiveCacheKey: string | null = null;

export const deliveriesActions = {
	/** Vide les tournées et arrêts. À appeler au logout. */
	reset() {
		deliveriesState.routes = [];
		deliveriesState.activeRouteId = null;
		deliveriesState.stops = [];
		deliveriesState.lastUpdateAt = '--:--';
		deliveriesState.error = null;
		deliveriesLoadRequestId = 0;
		deliveriesActiveCacheKey = null;
		if (deliveriesAbortController) {
			deliveriesAbortController.abort();
			deliveriesAbortController = null;
		}
		clearQueryCache();
	},
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
	/** Permet d'invalider explicitement le cache des listes livraisons. */
	invalidateCache() {
		invalidateQueryCachePrefix('deliveries:list:');
	},
	async loadDeliveries(filters?: import('$lib/api/deliveries').DeliveriesListFilters) {
		const requestId = ++deliveriesLoadRequestId;
		deliveriesState.error = null;

		try {
			const { getDeliveries } = await import('$lib/api/deliveries');
			const { getListFilters } = await import('$lib/stores/dateRange.svelte');
			const payload = filters ?? getListFilters();
			const cacheKey = buildQueryCacheKey('deliveries:list', payload);
			const cached = getQueryCache<DeliveryRoute[]>(cacheKey);

			if (cached) {
				deliveriesState.routes = cached.data;
				deliveriesState.lastUpdateAt = new Date(cached.updatedAt).toLocaleTimeString('fr-FR', {
					hour: '2-digit',
					minute: '2-digit'
				});
				if (isCacheFresh(cached)) {
					deliveriesState.loading = false;
					return;
				}
			}

			deliveriesState.loading = !cached;

			if (deliveriesAbortController && deliveriesActiveCacheKey && deliveriesActiveCacheKey !== cacheKey) {
				deliveriesAbortController.abort();
			}
			deliveriesAbortController = new AbortController();
			deliveriesActiveCacheKey = cacheKey;

			const deliveries = await runQueryDeduped(cacheKey, async () => {
				const items = await getDeliveries(payload, { signal: deliveriesAbortController?.signal });
				return items.map((delivery) => ({
					id: delivery.id,
					route: `${delivery.id.slice(0, 8).toUpperCase()}`,
					driver: delivery.driverId || 'Non assigne',
					stops: 1,
					status: delivery.status as DeliveryStatus,
					eta: delivery.sequence != null ? `Arrêt ${delivery.sequence + 1}` : '–',
					createdAt: delivery.createdAt ?? null
				}));
			});

			const saved = setQueryCache(cacheKey, deliveries, {
				staleTimeMs: DELIVERIES_STALE_TIME_MS,
				cacheTimeMs: DELIVERIES_CACHE_TIME_MS
			});
			if (requestId !== deliveriesLoadRequestId) return;
			deliveriesState.routes = saved.data;
			deliveriesState.lastUpdateAt = new Date(saved.updatedAt).toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;
			if (requestId !== deliveriesLoadRequestId) return;
			console.error('[Deliveries] Erreur lors du chargement:', error);
			deliveriesState.error = error instanceof Error 
				? error.message 
				: 'Erreur lors du chargement des livraisons';
			// Garde les données existantes en cas d'erreur
		} finally {
			if (requestId !== deliveriesLoadRequestId) return;
			deliveriesState.loading = false;
			deliveriesAbortController = null;
			deliveriesActiveCacheKey = null;
		}
	}
};
