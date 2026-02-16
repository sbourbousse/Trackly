import { browser } from '$app/environment';

export type MarkerType = 'order' | 'delivery' | 'driver';
export type OrderStatus = 'pending' | 'planned' | 'inTransit' | 'delivered' | 'cancelled';

export type RouteTraceStatus = 'planned' | 'inProgress' | 'completed';

export interface MapFilters {
	orders: {
		pending: boolean;
		planned: boolean;
		inTransit: boolean;
		delivered: boolean;
		cancelled: boolean;
	};
	showDrivers: boolean;
	/** Afficher les polygones isochrones (zone siège social). */
	showIsochrones: boolean;
	/** Afficher les tracés des tournées (itinéraires). */
	showRoutePolylines: boolean;
	/** Filtre par statut pour les tracés de tournées : planifiée, en cours, terminée. */
	routeTraces: {
		planned: boolean;
		inProgress: boolean;
		completed: boolean;
	};
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
	showDrivers: true,
	showIsochrones: false,
	showRoutePolylines: true,
	routeTraces: {
		planned: true,
		inProgress: true,
		completed: true
	}
};

function loadFilters(): MapFilters {
	if (!browser) return defaultFilters;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Record<string, unknown>;
			const { deliveries: _d, ...rest } = parsed;
			return { ...defaultFilters, ...rest } as MapFilters;
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
	
	toggleDrivers() {
		filters.showDrivers = !filters.showDrivers;
		saveFilters(filters);
	},

	toggleIsochrones() {
		filters.showIsochrones = !filters.showIsochrones;
		saveFilters(filters);
	},

	toggleRoutePolylines() {
		filters.showRoutePolylines = !filters.showRoutePolylines;
		saveFilters(filters);
	},

	toggleRouteTraceStatus(status: RouteTraceStatus) {
		filters.routeTraces[status] = !filters.routeTraces[status];
		saveFilters(filters);
	},

	showAll() {
		filters = {
			...defaultFilters,
			orders: { pending: true, planned: true, inTransit: true, delivered: true, cancelled: true },
			showDrivers: true,
			showIsochrones: filters.showIsochrones,
			showRoutePolylines: filters.showRoutePolylines,
			routeTraces: filters.routeTraces
		};
		saveFilters(filters);
	},

	hideAll() {
		filters = {
			...defaultFilters,
			orders: { pending: false, planned: false, inTransit: false, delivered: false, cancelled: false },
			showDrivers: false,
			showIsochrones: filters.showIsochrones,
			showRoutePolylines: filters.showRoutePolylines,
			routeTraces: filters.routeTraces
		};
		saveFilters(filters);
	},

	reset() {
		filters = { ...defaultFilters };
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
		return true; // Toujours afficher les marqueurs livraison (pas de filtre par statut)
	}

	return true; // Show by default if status unknown
}
