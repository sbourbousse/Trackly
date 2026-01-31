<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let mapContainer: HTMLDivElement;
	let map = $state<any>(null);
	let markers: any[] = [];
	let trackingMarker: any = null;
	let trackingCircle: any = null;
	let L: any = null;

	interface Props {
		center?: [number, number];
		zoom?: number;
		height?: string;
		deliveryMarkers?: Array<{ lat: number; lng: number; label?: string; color?: string }>;
		trackPosition?: { lat: number; lng: number; accuracy?: number } | null;
		followTracking?: boolean;
	}

	let {
		center = [48.8566, 2.3522],
		zoom = 13,
		height = '400px',
		deliveryMarkers = [],
		trackPosition = null,
		followTracking = true
	}: Props = $props();

	let DefaultIcon: any = null;
	let createTrackingIcon: ((color?: string) => any) | null = null;

	onMount(async () => {
		// Charger Leaflet uniquement côté client
		if (!browser) return;

		// Import dynamique de Leaflet
		const leaflet = await import('leaflet');
		L = leaflet.default;
		
		// Import du CSS
		await import('leaflet/dist/leaflet.css');

		// Fix pour les icônes Leaflet avec Vite
		const icon = await import('leaflet/dist/images/marker-icon.png');
		const iconShadow = await import('leaflet/dist/images/marker-shadow.png');
		const iconRetina = await import('leaflet/dist/images/marker-icon-2x.png');

		// Configuration des icônes par défaut
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

		// Icône rouge pour le tracking
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

		// Initialiser la carte
		map = L.map(mapContainer, {
			zoomControl: true,
			attributionControl: true
		}).setView(center, zoom);

		// Ajouter les tuiles OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
			subdomains: ['a', 'b', 'c']
		}).addTo(map);

		// Ajouter les markers de livraison
		updateDeliveryMarkers();

		// Ajouter le marker de suivi si disponible
		updateTrackingMarker();
	});

	// Recentrer la carte quand center ou zoom changent (ex. après géocodage)
	$effect(() => {
		if (map && center && zoom != null) {
			map.setView(center, zoom);
		}
	});

	// Mettre à jour les markers de livraison
	function updateDeliveryMarkers() {
		if (!L || !map || !DefaultIcon || !createTrackingIcon) return;
		const icon = DefaultIcon;
		const trackingIcon = createTrackingIcon;

		// Supprimer les anciens markers
		markers.forEach(marker => marker.remove());
		markers = [];

		// Ajouter les nouveaux markers
		deliveryMarkers.forEach((markerData) => {
			const marker = L.marker([markerData.lat, markerData.lng], {
				icon: markerData.color === 'red' 
					? trackingIcon('red')
					: icon
			}).addTo(map);

			if (markerData.label) {
				marker.bindPopup(markerData.label);
			}

			markers.push(marker);
		});

		// Recentrer la vue : un seul marqueur → setView ; plusieurs → fitBounds
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

	// Mettre à jour le marker de suivi
	function updateTrackingMarker() {
		if (!L || !map || !createTrackingIcon) return;

		// Supprimer l'ancien marker de suivi
		if (trackingMarker) {
			trackingMarker.remove();
			trackingMarker = null;
		}
		if (trackingCircle) {
			trackingCircle.remove();
			trackingCircle = null;
		}

		if (trackPosition) {
			// Créer le marker de suivi (point rouge animé)
			trackingMarker = L.marker([trackPosition.lat, trackPosition.lng], {
				icon: createTrackingIcon('#dc2626'),
				zIndexOffset: 1000
			}).addTo(map);

			// Ajouter un cercle de précision si disponible
			if (trackPosition.accuracy && L) {
				trackingCircle = L.circle([trackPosition.lat, trackPosition.lng], {
					radius: trackPosition.accuracy,
					color: '#dc2626',
					fillColor: '#dc2626',
					fillOpacity: 0.2,
					weight: 2
				}).addTo(map);
			}

			// Centrer la carte sur la position de suivi
			if (followTracking) {
				map.setView([trackPosition.lat, trackPosition.lng], map.getZoom());
			}
		}
	}

	// Réagir aux changements de markers
	$effect(() => {
		if (map && L && DefaultIcon && createTrackingIcon) {
			updateDeliveryMarkers();
		}
	});

	// Réagir aux changements de position de suivi
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

<div bind:this={mapContainer} style="width: 100%; height: {height}; border-radius: 8px; overflow: hidden;"></div>

<style>
	:global(.tracking-marker) {
		background: transparent !important;
		border: none !important;
	}
</style>
