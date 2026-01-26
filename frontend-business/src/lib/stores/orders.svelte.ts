export type OrderStatus = 'En attente' | 'En cours' | 'Livree';

export type OrderItem = {
	id: string;
	ref: string;
	client: string;
	address: string;
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
	async loadOrders() {
		ordersState.loading = true;
		ordersState.error = null;
		
		try {
			const { getOrders } = await import('$lib/api/orders');
			const orders = await getOrders();

			ordersState.items = orders.map((order) => ({
				id: order.id,
				ref: order.id.slice(0, 8).toUpperCase(),
				client: order.customerName,
				address: order.address,
				status: order.status as OrderStatus,
				deliveries: 1
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
