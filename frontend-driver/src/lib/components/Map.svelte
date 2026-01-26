<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let mapContainer: HTMLDivElement;
	let map: any = null;
	let destinationMarker: any = null;
	let currentPositionMarker: any = null;
	let accuracyCircle: any = null;
	let L: any = null;

	interface Props {
		center?: [number, number];
		zoom?: number;
		height?: string;
		destination?: { lat: number; lng: number; label?: string } | null;
		currentPosition?: { lat: number; lng: number; accuracy?: number } | null;
		followPosition?: boolean;
	}

	let {
		center = [48.8566, 2.3522],
		zoom = 15,
		height = '400px',
		destination = null,
		currentPosition = null,
		followPosition = true
	}: Props = $props();

	let DefaultIcon: any = null;
	let createCurrentPositionIcon: (() => any) | null = null;
	let createDestinationIcon: (() => any) | null = null;

	onMount(async () => {
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

		// Icône bleue pour la position actuelle
		createCurrentPositionIcon = () => {
			return L.divIcon({
				className: 'current-position-marker',
				html: `<div style="
					width: 24px;
					height: 24px;
					background-color: #2563eb;
					border: 3px solid white;
					border-radius: 50%;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				"></div>`,
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});
		};

		// Icône rouge pour la destination
		createDestinationIcon = () => {
			return L.divIcon({
				className: 'destination-marker',
				html: `<div style="
					width: 32px;
					height: 32px;
					background-color: #dc2626;
					border: 3px solid white;
					border-radius: 50%;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 18px;
					color: white;
				">📍</div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 16]
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

		// Ajouter les markers
		updateMarkers();
	});

	function updateMarkers() {
		if (!L || !map || !DefaultIcon || !createCurrentPositionIcon || !createDestinationIcon) return;

		// Supprimer les anciens markers
		if (destinationMarker) {
			destinationMarker.remove();
			destinationMarker = null;
		}
		if (currentPositionMarker) {
			currentPositionMarker.remove();
			currentPositionMarker = null;
		}
		if (accuracyCircle) {
			accuracyCircle.remove();
			accuracyCircle = null;
		}

		// Ajouter le marker de destination
		if (destination) {
			destinationMarker = L.marker([destination.lat, destination.lng], {
				icon: createDestinationIcon(),
				zIndexOffset: 1000
			}).addTo(map);

			if (destination.label) {
				destinationMarker.bindPopup(destination.label);
			}
		}

		// Ajouter le marker de position actuelle
		if (currentPosition) {
			currentPositionMarker = L.marker([currentPosition.lat, currentPosition.lng], {
				icon: createCurrentPositionIcon(),
				zIndexOffset: 2000
			}).addTo(map);

			// Ajouter un cercle de précision
			if (currentPosition.accuracy) {
				accuracyCircle = L.circle([currentPosition.lat, currentPosition.lng], {
					radius: currentPosition.accuracy,
					color: '#2563eb',
					fillColor: '#2563eb',
					fillOpacity: 0.2,
					weight: 2
				}).addTo(map);
			}

			// Centrer la carte sur la position actuelle
			if (followPosition) {
				map.setView([currentPosition.lat, currentPosition.lng], map.getZoom());
			}
		}

		// Ajuster la vue pour voir destination et position
		if (destination && currentPosition && map && L) {
			const bounds = L.latLngBounds(
				[destination.lat, destination.lng],
				[currentPosition.lat, currentPosition.lng]
			);
			map.fitBounds(bounds.pad(0.2));
		} else if (destination && map) {
			map.setView([destination.lat, destination.lng], zoom);
		} else if (currentPosition && map) {
			map.setView([currentPosition.lat, currentPosition.lng], zoom);
		}
	}

	// Réagir aux changements
	$effect(() => {
		if (map && L && DefaultIcon && createCurrentPositionIcon && createDestinationIcon) {
			updateMarkers();
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		destinationMarker = null;
		currentPositionMarker = null;
		accuracyCircle = null;
	});
</script>

<div bind:this={mapContainer} style="width: 100%; height: {height}; border-radius: 8px; overflow: hidden;"></div>

<style>
	:global(.current-position-marker),
	:global(.destination-marker) {
		background: transparent !important;
		border: none !important;
	}
</style>
