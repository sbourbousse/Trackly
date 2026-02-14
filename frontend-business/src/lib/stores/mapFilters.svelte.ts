import { browser } from '$app/environment';

export type MarkerType = 'order' | 'delivery' | 'driver';
export type OrderStatus = 'pending' | 'planned' | 'inTransit' | 'delivered' | 'cancelled';
export type DeliveryStatus = 'pending' | 'inProgress' | 'completed' | 'failed';

export interface MapFilters {
	orders: {
		pending: boolean;
		planned: boolean;
		inTransit: boolean;
		delivered: boolean;
		cancelled: boolean;
	};
	deliveries: {
		pending: boolean;
		inProgress: boolean;
		completed: boolean;
		failed: boolean;
	};
	showDrivers: boolean;
}

const STORAGE_KEY = 'trackly_map_filters';

const defaultFilters: MapFilters = {
	orders: {
		pending: true,
		planned: true,
		inTransit: true,
		delivered: false,
		cancelled: false
	},
	deliveries: {
		pending: true,
		inProgress: true,
		completed: false,
		failed: false
	},
	showDrivers: true
};

function loadFilters(): MapFilters {
	if (!browser) return defaultFilters;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...defaultFilters, ...JSON.parse(stored) };
		}
	} catch {
		// Fallback to defaults
	}
	return defaultFilters;
}

function saveFilters(filters: MapFilters) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
	} catch {
		// Ignore storage errors
	}
}

// Create reactive store
let filters = $state<MapFilters>(loadFilters());

export const mapFilters = {
	get filters() {
		return filters;
	},
	
	toggleOrderStatus(status: OrderStatus) {
		filters.orders[status] = !filters.orders[status];
		saveFilters(filters);
	},
	
	toggleDeliveryStatus(status: DeliveryStatus) {
		filters.deliveries[status] = !filters.deliveries[status];
		saveFilters(filters);
	},
	
	toggleDrivers() {
		filters.showDrivers = !filters.showDrivers;
		saveFilters(filters);
	},
	
	showAll() {
		filters = {
			orders: { pending: true, planned: true, inTransit: true, delivered: true, cancelled: true },
			deliveries: { pending: true, inProgress: true, completed: true, failed: true },
			showDrivers: true
		};
		saveFilters(filters);
	},
	
	hideAll() {
		filters = {
			orders: { pending: false, planned: false, inTransit: false, delivered: false, cancelled: false },
			deliveries: { pending: false, inProgress: false, completed: false, failed: false },
			showDrivers: false
		};
		saveFilters(filters);
	},
	
	reset() {
		filters = defaultFilters;
		saveFilters(filters);
	}
};

// Helper to check if a marker should be visible
export function isMarkerVisible(
	type: MarkerType,
	status?: string,
	markerFilters = filters
): boolean {
	if (type === 'driver') {
		return markerFilters.showDrivers;
	}
	
	const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '');
	
	if (type === 'order') {
		if (normalizedStatus === 'enattente' || normalizedStatus === 'pending') {
			return markerFilters.orders.pending;
		}
		if (normalizedStatus === 'prevue' || normalizedStatus === 'planned') {
			return markerFilters.orders.planned;
		}
		if (normalizedStatus === 'encours' || normalizedStatus === 'intransit' || normalizedStatus === 'inprogress') {
			return markerFilters.orders.inTransit;
		}
		if (normalizedStatus === 'livree' || normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
			return markerFilters.orders.delivered;
		}
		if (normalizedStatus === 'annulee' || normalizedStatus === 'cancelled' || normalizedStatus === 'failed' || normalizedStatus === 'echouee') {
			return markerFilters.orders.cancelled;
		}
	}
	
	if (type === 'delivery') {
		if (normalizedStatus === 'enattente' || normalizedStatus === 'pending' || normalizedStatus === 'prevue') {
			return markerFilters.deliveries.pending;
		}
		if (normalizedStatus === 'encours' || normalizedStatus === 'inprogress' || normalizedStatus === 'intransit') {
			return markerFilters.deliveries.inProgress;
		}
		if (normalizedStatus === 'livree' || normalizedStatus === 'completed' || normalizedStatus === 'delivered') {
			return markerFilters.deliveries.completed;
		}
		if (normalizedStatus === 'echouee' || normalizedStatus === 'failed' || normalizedStatus === 'annulee' || normalizedStatus === 'cancelled') {
			return markerFilters.deliveries.failed;
		}
	}
	
	return true; // Show by default if status unknown
}
