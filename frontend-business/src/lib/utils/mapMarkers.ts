/**
 * Mapping statut → couleur hex et type → icône pour les marqueurs de la carte.
 * Aligné sur StatusBadge et OrdersChartContent (info=sky, warning=amber, success=emerald, destructive, outline=slate).
 */

export type MarkerType = 'order' | 'delivery' | 'driver';

type StatusVariant = 'info' | 'warning' | 'success' | 'destructive' | 'outline';

const VARIANT_HEX: Record<StatusVariant, string> = {
	info: '#0ea5e9',       // sky-500
	warning: '#f59e0b',     // amber-500
	success: '#10b981',     // emerald-500
	destructive: '#dc2626', // red-600
	outline: '#64748b'      // slate-500
};

/** Couleur dédiée pour le marqueur livreur (position temps réel). */
const DRIVER_COLOR_HEX = '#0d9488'; // teal-600, distinct des statuts

function orderStatusToVariant(status: string): StatusVariant {
	const s = (status ?? '').toLowerCase();
	if (s === 'pending' || s === 'en attente' || s === '0') return 'info';
	if (s === 'planned' || s === 'planifiée' || s === '1') return 'outline';
	if (s === 'intransit' || s === 'en transit' || s === 'en cours' || s === '2') return 'warning';
	if (s === 'delivered' || s === 'livrée' || s === 'livree' || s === '3') return 'success';
	if (s === 'cancelled' || s === 'annulée' || s === '4') return 'destructive';
	return 'outline';
}

function deliveryStatusToVariant(status: string): StatusVariant {
	const s = (status ?? '').toLowerCase();
	if (s === 'pending' || s === 'prévue' || s === 'prevue' || s === '0') return 'info';
	if (s === 'inprogress' || s === 'en cours' || s === '1') return 'warning';
	if (s === 'completed' || s === 'livrée' || s === 'livree' || s === '2') return 'success';
	if (s === 'failed' || s === 'échouée' || s === 'echouee' || s === 'retard' || s === 'échec' || s === '3') return 'destructive';
	return 'outline';
}

/** Couleur hex pour un marqueur commande selon son statut. */
export function getOrderStatusColorHex(status: string): string {
	return VARIANT_HEX[orderStatusToVariant(status)];
}

/** Couleur hex pour un marqueur tournée/livraison selon son statut. */
export function getDeliveryStatusColorHex(status: string): string {
	return VARIANT_HEX[deliveryStatusToVariant(status)];
}

/** Couleur hex pour le marqueur livreur (position temps réel). */
export function getDriverColorHex(): string {
	return DRIVER_COLOR_HEX;
}

/** Paths SVG Lucide (viewBox 0 0 24 24) pour package, truck, navigation. */
const ICON_PATHS: Record<MarkerType, string> = {
	order: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01 20.73 6.96 M12 22.08V12',
	delivery: 'M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11 M14 9h4l4 4v4c0 .6-.4 1-1 1h-2 M15 18H9 M19 18h2',
	driver: 'M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'
};

/**
 * Retourne le HTML pour un divIcon Leaflet : cercle avec couleur de fond et icône SVG blanche.
 */
export function getMarkerIconHtml(type: MarkerType, colorHex: string): string {
	const path = ICON_PATHS[type];
	const isDriver = type === 'driver';
	const size = isDriver ? 24 : 22;
	const iconSize = isDriver ? 12 : 10;
	return `<div class="map-typed-marker map-typed-marker-${type}" style="
		width: ${size}px; height: ${size}px;
		background-color: ${colorHex};
		border: 2px solid white;
		border-radius: 50%;
		box-shadow: 0 2px 6px rgba(0,0,0,0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	">
		<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="${path}"/>
		</svg>
	</div>`;
}
