import { browser } from '$app/environment';

// Types de statuts pour les filtres
type OrderStatus = 'pending' | 'planned' | 'inTransit' | 'delivered' | 'cancelled';
type DeliveryStatus = 'pending' | 'inProgress' | 'completed' | 'failed';

interface MapFilters {
	orders: Record<OrderStatus, boolean>;
	deliveries: Record<DeliveryStatus, boolean>;
	showDrivers: boolean;
}

const STORAGE_KEY = 'trackly_map_filters';

// Valeurs par défaut
const defaultFilters: MapFilters = {
	orders: {
		pending: true,
		planned: true,
		inTransit: true,
		delivered: true,
		cancelled: true
	},
	deliveries: {
		pending: true,
		inProgress: true,
		completed: true,
		failed: true
	},
	showDrivers: true
};

// État réactif
let filters = $state<MapFilters>(loadFilters());

function loadFilters(): MapFilters {
	if (!browser) return defaultFilters;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...defaultFilters, ...JSON.parse(stored) };
		}
	} catch {
		// Ignorer les erreurs de parsing
	}
	return defaultFilters;
}

function saveFilters() {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

// Actions
export const mapFiltersActions = {
	toggleOrderStatus(status: OrderStatus) {
		filters.orders[status] = !filters.orders[status];
		saveFilters();
	},
	
	toggleDeliveryStatus(status: DeliveryStatus) {
		filters.deliveries[status] = !filters.deliveries[status];
		saveFilters();
	},
	
	toggleDrivers() {
		filters.showDrivers = !filters.showDrivers;
		saveFilters();
	},
	
	showAll() {
		Object.keys(filters.orders).forEach((key) => {
			filters.orders[key as OrderStatus] = true;
		});
		Object.keys(filters.deliveries).forEach((key) => {
			filters.deliveries[key as DeliveryStatus] = true;
		});
		filters.showDrivers = true;
		saveFilters();
	},
	
	hideAll() {
		Object.keys(filters.orders).forEach((key) => {
			filters.orders[key as OrderStatus] = false;
		});
		Object.keys(filters.deliveries).forEach((key) => {
			filters.deliveries[key as DeliveryStatus] = false;
		});
		filters.showDrivers = false;
		saveFilters();
	},
	
	reset() {
		filters = { ...defaultFilters };
		saveFilters();
	}
};

// État dérivé pour les compteurs
export const mapFiltersState = {
	get filters() {
		return filters;
	},
	
	get activeOrderCount() {
		return Object.values(filters.orders).filter(Boolean).length;
	},
	
	get activeDeliveryCount() {
		return Object.values(filters.deliveries).filter(Boolean).length;
	},
	
	get totalActive() {
		return this.activeOrderCount + this.activeDeliveryCount + (filters.showDrivers ? 1 : 0);
	},
	
	get isDefault() {
		return JSON.stringify(filters) === JSON.stringify(defaultFilters);
	}
};

// Helper pour vérifier si un statut est visible
export function isOrderStatusVisible(status: string): boolean {
	const normalized = status.toLowerCase();
	if (normalized.includes('en attente') || normalized.includes('pending')) {
		return filters.orders.pending;
	}
	if (normalized.includes('prévue') || normalized.includes('planned')) {
		return filters.orders.planned;
	}
	if (normalized.includes('en cours') || normalized.includes('intransit') || normalized.includes('in transit')) {
		return filters.orders.inTransit;
	}
	if (normalized.includes('livrée') || normalized.includes('delivered')) {
		return filters.orders.delivered;
	}
	if (normalized.includes('annulée') || normalized.includes('cancelled')) {
		return filters.orders.cancelled;
	}
	return true;
}

export function isDeliveryStatusVisible(status: string): boolean {
	const normalized = status.toLowerCase();
	if (normalized.includes('en attente') || normalized.includes('pending') || normalized.includes('prévue')) {
		return filters.deliveries.pending;
	}
	if (normalized.includes('en cours') || normalized.includes('inprogress') || normalized.includes('in progress')) {
		return filters.deliveries.inProgress;
	}
	if (normalized.includes('livrée') || normalized.includes('completed') || normalized.includes('terminée')) {
		return filters.deliveries.completed;
	}
	if (normalized.includes('échouée') || normalized.includes('failed') || normalized.includes('annulée')) {
		return filters.deliveries.failed;
	}
	return true;
}
