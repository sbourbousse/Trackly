<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		getOrderStatusColorHex,
		getDeliveryStatusColorHex,
		getDriverColorHex,
		getMarkerIconHtml,
		type MarkerType
	} from '$lib/utils/mapMarkers';

	let mapContainer: HTMLDivElement;
	let map = $state<any>(null);
	let markers: any[] = [];
	let trackingMarker: any = null;
	let trackingCircle: any = null;
	let L: any = null;

	/** Marqueur typé (commande / tournée / livreur) avec couleur de statut et icône. */
	export type TypedMapMarker = {
		lat: number;
		lng: number;
		label?: string;
		type: MarkerType;
		status?: string;
		id?: string;
	};

	/** Ancien format : marqueurs plats (rétrocompatibilité). */
	export type LegacyMapMarker = {
		lat: number;
		lng: number;
		label?: string;
		color?: string;
	};

	interface Props {
		center?: [number, number];
		zoom?: number;
		height?: string;
		/** Marqueurs typés (ordre / livraison / livreur) avec couleurs de statut. Prioritaire si fourni et non vide. */
		markers?: TypedMapMarker[];
		/** Marqueurs au format legacy (pin ou cercle rouge). Utilisé si markers absent ou vide. */
		deliveryMarkers?: LegacyMapMarker[];
		trackPosition?: { lat: number; lng: number; accuracy?: number } | null;
		followTracking?: boolean;
	}

	let {
		center = [48.8566, 2.3522],
		zoom = 13,
		height = '400px',
		markers: typedMarkers = [],
		deliveryMarkers = [],
		trackPosition = null,
		followTracking = true
	}: Props = $props();

	let DefaultIcon: any = null;
	let createTrackingIcon: ((color?: string) => any) | null = null;

	/** Marqueurs effectifs : typés si fournis, sinon legacy. */
	const effectiveMarkers = $derived(
		typedMarkers.length > 0
			? typedMarkers.map((m) => ({ ...m, _typed: true as const }))
			: deliveryMarkers.map((m) => ({ ...m, _typed: false as const }))
	);

	onMount(async () => {
		if (!browser) return;

		const leaflet = await import('leaflet');
		L = leaflet.default;
		await import('leaflet/dist/leaflet.css');

		const icon = await import('leaflet/dist/images/marker-icon.png');
		const iconShadow = await import('leaflet/dist/images/marker-shadow.png');
		const iconRetina = await import('leaflet/dist/images/marker-icon-2x.png');

		DefaultIcon = L.icon({
			iconUrl: icon.default,
			iconRetinaUrl: iconRetina.default,
			shadowUrl: iconShadow.default,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize: [41, 41]
		});
		L.Marker.prototype.options.icon = DefaultIcon;

		createTrackingIcon = (color: string = 'red') => {
			return L.divIcon({
				className: 'tracking-marker',
				html: `<div style="
					width: 20px;
					height: 20px;
					background-color: ${color};
					border: 3px solid white;
					border-radius: 50%;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				"></div>`,
				iconSize: [20, 20],
				iconAnchor: [10, 10]
			});
		};

		map = L.map(mapContainer, {
			zoomControl: true,
			attributionControl: true
		}).setView(center, zoom);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
			subdomains: ['a', 'b', 'c'],
			keepBuffer: 2
		}).addTo(map);

		updateMarkers();
		updateTrackingMarker();
	});

	$effect(() => {
		if (map && center && zoom != null) {
			map.setView(center, zoom);
		}
	});

	function getColorHexForTypedMarker(m: TypedMapMarker): string {
		if (m.type === 'order') return getOrderStatusColorHex(m.status ?? '');
		if (m.type === 'delivery') return getDeliveryStatusColorHex(m.status ?? '');
		return getDriverColorHex();
	}

	function updateMarkers() {
		if (!L || !map || !DefaultIcon || !createTrackingIcon) return;
		const trackingIconFn = createTrackingIcon;

		markers.forEach((marker) => marker.remove());
		markers = [];

		effectiveMarkers.forEach((markerData) => {
			let icon: any;
			if (markerData._typed) {
				const m = markerData as TypedMapMarker & { _typed: true };
				const colorHex = getColorHexForTypedMarker(m);
				icon = L.divIcon({
					className: 'map-typed-marker-wrap',
					html: getMarkerIconHtml(m.type, colorHex),
					iconSize: [28, 28],
					iconAnchor: [14, 14]
				});
			} else {
				const leg = markerData as LegacyMapMarker & { _typed: false };
				icon =
					leg.color === 'red'
						? trackingIconFn('red')
						: DefaultIcon;
			}

			const marker = L.marker([markerData.lat, markerData.lng], { icon }).addTo(map);
			if (markerData.label) {
				marker.bindPopup(markerData.label);
			}
			markers.push(marker);
		});

		if (markers.length > 0 && map && L) {
			if (markers.length === 1) {
				const pos = markers[0].getLatLng();
				map.setView([pos.lat, pos.lng], map.getZoom());
			} else {
				const group = new L.FeatureGroup(markers);
				map.fitBounds(group.getBounds().pad(0.1));
			}
		}
	}

	function updateTrackingMarker() {
		if (!L || !map || !createTrackingIcon) return;

		if (trackingMarker) {
			trackingMarker.remove();
			trackingMarker = null;
		}
		if (trackingCircle) {
			trackingCircle.remove();
			trackingCircle = null;
		}

		if (trackPosition) {
			trackingMarker = L.marker([trackPosition.lat, trackPosition.lng], {
				icon: createTrackingIcon('#dc2626'),
				zIndexOffset: 1000
			}).addTo(map);

			if (trackPosition.accuracy && L) {
				trackingCircle = L.circle([trackPosition.lat, trackPosition.lng], {
					radius: trackPosition.accuracy,
					color: '#dc2626',
					fillColor: '#dc2626',
					fillOpacity: 0.2,
					weight: 2
				}).addTo(map);
			}

			if (followTracking) {
				map.setView([trackPosition.lat, trackPosition.lng], map.getZoom());
			}
		}
	}

	$effect(() => {
		if (map && L && DefaultIcon && createTrackingIcon) {
			updateMarkers();
		}
	});

	$effect(() => {
		if (map && L && createTrackingIcon && trackPosition) {
			updateTrackingMarker();
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		markers = [];
		trackingMarker = null;
		trackingCircle = null;
	});
</script>

<div bind:this={mapContainer} class="map-root" style="width: 100%; height: {height}; border-radius: 8px; overflow: hidden;"></div>

<style>
	.map-root,
	:global(.leaflet-container) {
		position: relative;
		z-index: 0;
	}
	:global(.tracking-marker),
	:global(.map-typed-marker-wrap) {
		background: transparent !important;
		border: none !important;
	}
</style>
