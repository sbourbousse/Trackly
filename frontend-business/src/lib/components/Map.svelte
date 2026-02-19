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
	let headquartersMarker: any = null;
	let trackingMarker: any = null;
	let trackingCircle: any = null;
	let routePolylinesLayer: any[] = [];
	let routeConnectorsLayer: any[] = [];
	let routeStepLabelsLayer: any[] = [];
	let isochronePolygonsLayer: any[] = [];
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
		/** Siège social : marqueur distinct sur la carte (paramètres). */
		headquarters?: { lat: number; lng: number } | null;
		/** Polylignes d'itinéraires (coordonnées [lng, lat] par point). */
		routePolylines?: { coordinates: [number, number][]; color?: string }[];
		/** Numéros d'étape à afficher sur le tracé (ordre du trajet : 1 = départ, 2, 3, …). */
		routeStepLabels?: { lat: number; lng: number; step: number | string }[];
		/** Polygones isochrones (coordonnées [lng, lat] par point, contour en minutes). */
		isochronePolygons?: { coordinates: [number, number][]; minutes?: number }[];
		/** Segments de liaison route → marqueur (fin de tronçon vers point de livraison). [lng, lat][] par segment. */
		routeConnectors?: { coordinates: [number, number][] }[];
		/** Vue verrouillée : pas de pan ni zoom, cadrage auto sur l’ensemble des points (marqueurs, siège, tracé). */
		lockView?: boolean;
		/** En vue verrouillée : zoom max (min = plus dézoomé) lors du fitBounds. Ex. 11 = ne pas dézoomer au-delà du niveau 11 (commande dans une autre ville). */
		fitBoundsMaxZoom?: number;
	}

	let {
		center = [48.8566, 2.3522],
		zoom = 13,
		height = '400px',
		markers: typedMarkers = [],
		deliveryMarkers = [],
		trackPosition = null,
		followTracking = true,
		headquarters = null,
		routePolylines = [],
		routeStepLabels = [],
		isochronePolygons = [],
		routeConnectors = [],
		lockView = false,
		fitBoundsMaxZoom
	}: Props = $props();

	let DefaultIcon: any = null;
	let createTrackingIcon: ((color?: string) => any) | null = null;

	/** Zoom piloté par le slider en vue verrouillée (entre min et max). */
	const zoomSliderMin = $derived(fitBoundsMaxZoom ?? 11);
	const zoomSliderMax = 18;
	let zoomSliderValue = $state(13);

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
			zoomControl: false,
			attributionControl: true
		}).setView(center, zoom);

		if (!lockView) {
			L.control.zoom({ position: 'topleft' }).addTo(map);
		}

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
			subdomains: ['a', 'b', 'c'],
			keepBuffer: 2
		}).addTo(map);

		updateMarkers();
		updateHeadquartersMarker();
		updateTrackingMarker();
		updateRoutePolylines();
		updateRouteConnectors();
		updateRouteStepLabels();
		updateIsochronePolygons();
		if (lockView) {
			applyLockView();
		}
	});

	$effect(() => {
		if (map && center && zoom != null && !lockView) {
			map.setView(center, zoom);
		}
	});

	function getColorHexForTypedMarker(m: TypedMapMarker): string {
		if (m.type === 'order') return getOrderStatusColorHex(m.status ?? '');
		if (m.type === 'delivery') return getDeliveryStatusColorHex(m.status ?? '');
		return getDriverColorHex();
	}

	/** Marqueur siège social : icône bâtiment, couleur indigo. */
	function updateHeadquartersMarker() {
		if (!L || !map || !createTrackingIcon) return;
		if (headquartersMarker) {
			headquartersMarker.remove();
			headquartersMarker = null;
		}
		if (headquarters) {
			const icon = L.divIcon({
				className: 'headquarters-marker-wrap',
				html: `<div style="
					width: 28px; height: 28px;
					background-color: #6366f1;
					border: 2px solid white;
					border-radius: 6px;
					box-shadow: 0 2px 6px rgba(0,0,0,0.3);
					display: flex; align-items: center; justify-content: center;
				">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
						<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
						<path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
						<path d="M10 12h4"/>
					</svg>
				</div>`,
				iconSize: [28, 28],
				iconAnchor: [14, 14]
			});
			headquartersMarker = L.marker([headquarters.lat, headquarters.lng], { icon, zIndexOffset: 500 }).addTo(map);
			headquartersMarker.bindPopup('<b>Siège social</b>');
		}
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

		if (markers.length > 0 && map && L && !lockView) {
			if (markers.length === 1) {
				const pos = markers[0].getLatLng();
				map.setView([pos.lat, pos.lng], map.getZoom());
			} else {
				const group = new L.FeatureGroup(markers);
				map.fitBounds(group.getBounds().pad(0.1));
			}
		}
	}

	/** Bounds englobant marqueurs, siège, polylignes et connecteurs (pour cadrage en vue verrouillée). */
	function getContentBounds(): any {
		if (!L || !map) return null;
		const latLngs: [number, number][] = [];
		effectiveMarkers.forEach((m) => latLngs.push([m.lat, m.lng]));
		if (headquarters?.lat != null && headquarters?.lng != null) {
			latLngs.push([headquarters.lat, headquarters.lng]);
		}
		for (const route of routePolylines) {
			for (const [lng, lat] of route.coordinates ?? []) {
				latLngs.push([lat, lng]);
			}
		}
		for (const conn of routeConnectors) {
			for (const [lng, lat] of conn.coordinates ?? []) {
				latLngs.push([lat, lng]);
			}
		}
		for (const contour of isochronePolygons) {
			for (const [lng, lat] of contour.coordinates ?? []) {
				latLngs.push([lat, lng]);
			}
		}
		if (trackPosition) {
			latLngs.push([trackPosition.lat, trackPosition.lng]);
		}
		if (latLngs.length === 0) return null;
		const bounds = L.latLngBounds(latLngs);
		return bounds.pad(0.2);
	}

	/** Désactive déplacement et zoom, puis centre sur tout le contenu. */
	function applyLockView() {
		if (!map || !L) return;
		map.dragging.disable();
		map.scrollWheelZoom.disable();
		map.doubleClickZoom.disable();
		map.touchZoom.disable();
		map.boxZoom.disable();
		map.keyboard.disable();
		const bounds = getContentBounds();
		if (bounds) {
			const options: { maxZoom?: number } = {};
			if (fitBoundsMaxZoom != null) options.maxZoom = fitBoundsMaxZoom;
			map.fitBounds(bounds, options);
			zoomSliderValue = Math.round(
				Math.max(zoomSliderMin, Math.min(zoomSliderMax, map.getZoom()))
			);
		}
	}

	function onZoomSliderInput(e: Event) {
		const v = Number((e.target as HTMLInputElement).value);
		zoomSliderValue = v;
		if (map) map.setZoom(v);
	}

	/** Convertit [lng, lat][] (API) en [[lat, lng], ...] pour Leaflet. */
	function toLeafletLatLngs(coords: [number, number][]): [number, number][] {
		return coords.map(([lng, lat]) => [lat, lng]);
	}

	function updateRoutePolylines() {
		if (!L || !map) return;
		routePolylinesLayer.forEach((layer) => layer.remove());
		routePolylinesLayer = [];
		for (const route of routePolylines) {
			if (!route.coordinates?.length) continue;
			const latLngs = toLeafletLatLngs(route.coordinates);
			const color = route.color ?? '#0d9488';
			const polyline = L.polyline(latLngs, {
				color,
				weight: 5,
				opacity: 0.7
			}).addTo(map);
			routePolylinesLayer.push(polyline);
		}
	}

	function updateRouteConnectors() {
		if (!L || !map) return;
		routeConnectorsLayer.forEach((layer) => layer.remove());
		routeConnectorsLayer = [];
		for (const conn of routeConnectors) {
			if (!conn.coordinates?.length) continue;
			const latLngs = toLeafletLatLngs(conn.coordinates);
			const polyline = L.polyline(latLngs, {
				color: '#64748b',
				weight: 2,
				opacity: 0.8,
				dashArray: '6, 6'
			}).addTo(map);
			routeConnectorsLayer.push(polyline);
		}
	}

	function updateRouteStepLabels() {
		if (!L || !map) return;
		routeStepLabelsLayer.forEach((layer) => layer.remove());
		routeStepLabelsLayer = [];
		const color = routePolylines[0]?.color ?? '#0d9488';
		for (const point of routeStepLabels) {
			const icon = L.divIcon({
				className: 'route-step-label-wrap',
				html: `<div style="
					min-width: 24px; height: 24px;
					background-color: ${color};
					color: white;
					border: 2px solid white;
					border-radius: 50%;
					box-shadow: 0 1px 4px rgba(0,0,0,0.3);
					display: flex; align-items: center; justify-content: center;
					font-size: 12px; font-weight: 700; line-height: 1;
				">${point.step}</div>`,
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});
			const marker = L.marker([point.lat, point.lng], { icon, zIndexOffset: 300 }).addTo(map);
			routeStepLabelsLayer.push(marker);
		}
	}

	function updateIsochronePolygons() {
		if (!L || !map) return;
		isochronePolygonsLayer.forEach((layer) => layer.remove());
		isochronePolygonsLayer = [];
		const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];
		for (let i = 0; i < isochronePolygons.length; i++) {
			const contour = isochronePolygons[i];
			if (!contour.coordinates?.length) continue;
			const latLngs = toLeafletLatLngs(contour.coordinates);
			const color = colors[i % colors.length];
			const polygon = L.polygon(latLngs, {
				color,
				fillColor: color,
				fillOpacity: 0.2,
				weight: 2
			}).addTo(map);
			if (contour.minutes != null) {
				polygon.bindPopup(`${contour.minutes} min`);
			}
			isochronePolygonsLayer.push(polygon);
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

			if (followTracking && !lockView) {
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
		if (map && L && createTrackingIcon && headquarters !== undefined) {
			updateHeadquartersMarker();
		}
	});

	$effect(() => {
		if (map && L && createTrackingIcon && trackPosition) {
			updateTrackingMarker();
		}
	});

	$effect(() => {
		if (map && L) {
			const _ = routePolylines;
			updateRoutePolylines();
		}
	});

	$effect(() => {
		if (map && L) {
			const _ = routeConnectors;
			updateRouteConnectors();
		}
	});

	$effect(() => {
		if (map && L) {
			const _ = routeStepLabels;
			updateRouteStepLabels();
		}
	});

	$effect(() => {
		if (map && L) {
			const _ = isochronePolygons;
			updateIsochronePolygons();
		}
	});

	/** En vue verrouillée, recadrer dès que le contenu change (ex. itinéraire chargé, isochrones). */
	$effect(() => {
		if (!map || !L || !lockView) return;
		const _ = [effectiveMarkers, headquarters, routePolylines, routeConnectors, isochronePolygons, trackPosition];
		applyLockView();
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		markers = [];
		headquartersMarker = null;
		trackingMarker = null;
		trackingCircle = null;
		routePolylinesLayer.forEach((l) => l.remove());
		routePolylinesLayer = [];
		routeConnectorsLayer.forEach((l) => l.remove());
		routeConnectorsLayer = [];
		routeStepLabelsLayer.forEach((l) => l.remove());
		routeStepLabelsLayer = [];
		isochronePolygonsLayer.forEach((l) => l.remove());
		isochronePolygonsLayer = [];
	});
</script>

<div class="map-wrap">
	<div bind:this={mapContainer} class="map-root" style="width: 100%; height: {height}; border-radius: 8px; overflow: hidden;"></div>
	{#if lockView}
		<div class="zoom-slider-wrap" title="Zoom">
			<input
				type="range"
				min={zoomSliderMin}
				max={zoomSliderMax}
				step={0.5}
				value={zoomSliderValue}
				oninput={onZoomSliderInput}
				class="zoom-slider"
				aria-label="Niveau de zoom"
			/>
			<div class="zoom-slider-track">
				<div class="zoom-slider-fill" style="height: {((zoomSliderValue - zoomSliderMin) / (zoomSliderMax - zoomSliderMin)) * 100}%"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.map-wrap {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.map-root,
	:global(.leaflet-container) {
		position: relative;
		z-index: 0;
	}
	:global(.tracking-marker),
	:global(.map-typed-marker-wrap),
	:global(.headquarters-marker-wrap),
	:global(.route-step-label-wrap) {
		background: transparent !important;
		border: none !important;
	}

	.zoom-slider-wrap {
		position: absolute;
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
		z-index: 1000;
		width: 28px;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.zoom-slider-track {
		position: absolute;
		left: 50%;
		top: 0;
		transform: translateX(-50%);
		width: 6px;
		height: 120px;
		background: rgba(0, 0, 0, 0.15);
		border-radius: 3px;
		pointer-events: none;
	}
	.zoom-slider-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 3px;
		transition: height 0.1s ease-out;
		pointer-events: none;
	}
	.zoom-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 120px;
		height: 24px;
		margin: 0;
		transform: rotate(-90deg);
		transform-origin: center center;
		background: transparent;
		cursor: ns-resize;
		position: relative;
		z-index: 1;
	}
	.zoom-slider::-webkit-slider-runnable-track {
		height: 6px;
		background: transparent;
		border-radius: 3px;
	}
	.zoom-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: grab;
		margin-top: -6px;
		transition: transform 0.1s ease;
	}
	.zoom-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}
	.zoom-slider::-moz-range-track {
		height: 6px;
		background: transparent;
		border-radius: 3px;
	}
	.zoom-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: grab;
	}
</style>
