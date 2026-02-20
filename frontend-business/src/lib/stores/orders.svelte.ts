import {
	buildQueryCacheKey,
	clearQueryCache,
	getQueryCache,
	invalidateQueryCachePrefix,
	isCacheFresh,
	runQueryDeduped,
	setQueryCache
} from '$lib/stores/queryCache.svelte';

/** Statuts possibles (API = Pending, Planned, InTransit, Delivered, Cancelled ; affichage FR = En attente, etc.). */
export type OrderStatus = 'En attente' | 'En cours' | 'Livree' | 'Pending' | 'Planned' | 'InTransit' | 'Delivered' | 'Cancelled';

export type OrderItem = {
	id: string;
	ref: string;
	client: string;
	address: string;
	phoneNumber?: string | null;
	internalComment?: string | null;
	orderDate: string | null;
	status: OrderStatus;
	deliveries: number;
};

export let ordersState = $state({
	items: [] as OrderItem[],
	lastSyncAt: '09:18',
	loading: false,
	error: null as string | null
});

const ORDERS_STALE_TIME_MS = 30_000;
const ORDERS_CACHE_TIME_MS = 10 * 60_000;
let ordersLoadRequestId = 0;
let ordersAbortController: AbortController | null = null;
let ordersActiveCacheKey: string | null = null;

export const ordersActions = {
	/** Vide la liste des commandes. À appeler au logout. */
	reset() {
		ordersState.items = [];
		ordersState.lastSyncAt = '--:--';
		ordersState.error = null;
		ordersLoadRequestId = 0;
		ordersActiveCacheKey = null;
		if (ordersAbortController) {
			ordersAbortController.abort();
			ordersAbortController = null;
		}
		clearQueryCache();
	},
	setOrders(items: OrderItem[]) {
		ordersState.items = items;
	},
	addOrder(order: OrderItem) {
		ordersState.items = [order, ...ordersState.items];
	},
	setLoading(loading: boolean) {
		ordersState.loading = loading;
	},
	setLastSyncAt(time: string) {
		ordersState.lastSyncAt = time;
	},
	/** Permet d'invalider explicitement le cache des listes commandes. */
	invalidateCache() {
		// Prefix scope + ":" pour ne toucher que les clés liste commandes.
		invalidateQueryCachePrefix('orders:list:');
	},
	async loadOrders(filters?: import('$lib/api/orders').OrdersListFilters) {
		const requestId = ++ordersLoadRequestId;
		ordersState.error = null;

		try {
			const { getOrders } = await import('$lib/api/orders');
			const { getListFilters } = await import('$lib/stores/dateRange.svelte');
			const base = getListFilters();
			const payload = filters ? { ...base, ...filters } : base;
			const cacheKey = buildQueryCacheKey('orders:list', payload);
			const cached = getQueryCache<OrderItem[]>(cacheKey);

			if (cached) {
				ordersState.items = cached.data;
				ordersState.lastSyncAt = new Date(cached.updatedAt).toLocaleTimeString('fr-FR', {
					hour: '2-digit',
					minute: '2-digit'
				});
				if (isCacheFresh(cached)) {
					ordersState.loading = false;
					return;
				}
			}

			ordersState.loading = !cached;

			if (ordersAbortController && ordersActiveCacheKey && ordersActiveCacheKey !== cacheKey) {
				ordersAbortController.abort();
			}
			ordersAbortController = new AbortController();
			ordersActiveCacheKey = cacheKey;

			const orders = await runQueryDeduped(cacheKey, async () => {
				const items = await getOrders(payload, { signal: ordersAbortController?.signal });
				return items.map((order) => ({
					id: order.id,
					ref: order.id.slice(0, 8).toUpperCase(),
					client: order.customerName,
					address: order.address,
					phoneNumber: order.phoneNumber ?? null,
					internalComment: order.internalComment ?? null,
					orderDate: order.orderDate ?? null,
					status: order.status as OrderStatus,
					deliveries: order.deliveryCount ?? 0
				}));
			});

			const saved = setQueryCache(cacheKey, orders, {
				staleTimeMs: ORDERS_STALE_TIME_MS,
				cacheTimeMs: ORDERS_CACHE_TIME_MS
			});
			if (requestId !== ordersLoadRequestId) return;
			ordersState.items = saved.data;
			ordersState.lastSyncAt = new Date(saved.updatedAt).toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;
			if (requestId !== ordersLoadRequestId) return;
			console.error('[Orders] Erreur lors du chargement:', error);
			ordersState.error = error instanceof Error 
				? error.message 
				: 'Erreur lors du chargement des commandes';
			// Garde les données existantes en cas d'erreur
		} finally {
			if (requestId !== ordersLoadRequestId) return;
			ordersState.loading = false;
			ordersAbortController = null;
			ordersActiveCacheKey = null;
		}
	}
};
