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

export const ordersActions = {
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
	async loadOrders(filters?: import('$lib/api/orders').OrdersListFilters) {
		ordersState.loading = true;
		ordersState.error = null;
		
		try {
			const { getOrders } = await import('$lib/api/orders');
			const { getListFilters } = await import('$lib/stores/dateRange.svelte');
			const base = getListFilters();
			const payload = filters ? { ...base, ...filters } : base;
			const orders = await getOrders(payload);

			ordersState.items = orders.map((order) => ({
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
			ordersState.lastSyncAt = new Date().toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('[Orders] Erreur lors du chargement:', error);
			ordersState.error = error instanceof Error 
				? error.message 
				: 'Erreur lors du chargement des commandes';
			// Garde les données existantes en cas d'erreur
		} finally {
			ordersState.loading = false;
		}
	}
};
