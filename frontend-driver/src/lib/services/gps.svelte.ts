import { trackingService } from './tracking.svelte';

type Position = {
	lat: number;
	lng: number;
	accuracy: number | null;
	timestamp: number;
};

type GpsState = {
	position: Position | null;
	isActive: boolean;
	error: string | null;
	watchId: number | null;
	isSending: boolean;
	lastSentAt: number | null;
};

// Configuration
const SEND_INTERVAL_MS = 5000; // Envoi toutes les 5 secondes
const MIN_DISTANCE_METERS = 10; // Distance minimale pour envoyer une mise à jour

// État réactif
let state = $state<GpsState>({
	position: null,
	isActive: false,
	error: null,
	watchId: null,
	isSending: false,
	lastSentAt: null
});

let sendInterval: ReturnType<typeof setInterval> | null = null;
let currentDeliveryId: string | null = null;

/**
 * Calcule la distance en mètres entre deux points GPS (formule de Haversine)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371e3; // Rayon de la Terre en mètres
	const φ1 = lat1 * Math.PI / 180;
	const φ2 = lat2 * Math.PI / 180;
	const Δφ = (lat2 - lat1) * Math.PI / 180;
	const Δλ = (lng2 - lng1) * Math.PI / 180;

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

/**
 * Envoie la position actuelle au serveur via SignalR
 */
async function sendPosition(): Promise<void> {
	if (!state.position || !currentDeliveryId || !trackingService.isConnected) {
		return;
	}

	// Vérifie si la position a suffisamment changé
	if (state.lastSentAt) {
		// Pour l'instant, on envoie toujours toutes les 5 secondes si connecté
		// On pourrait ajouter une logique de distance minimale ici
	}

	state.isSending = true;
	try {
		await trackingService.updateLocation(
			currentDeliveryId,
			state.position.lat,
			state.position.lng
		);
		state.lastSentAt = Date.now();
	} catch (err) {
		console.error('[GPS] Erreur envoi position:', err);
	} finally {
		state.isSending = false;
	}
}

/**
 * Démarre l'envoi périodique de la position
 */
function startSending(deliveryId: string): void {
	currentDeliveryId = deliveryId;
	
	// Envoi immédiat si on a déjà une position
	if (state.position) {
		sendPosition();
	}

	// Envoi périodique toutes les 5 secondes
	sendInterval = setInterval(() => {
		sendPosition();
	}, SEND_INTERVAL_MS);

	console.info(`[GPS] Envoi position activé pour livraison ${deliveryId} (toutes les ${SEND_INTERVAL_MS}ms)`);
}

/**
 * Arrête l'envoi périodique de la position
 */
function stopSending(): void {
	if (sendInterval) {
		clearInterval(sendInterval);
		sendInterval = null;
	}
	currentDeliveryId = null;
	state.lastSentAt = null;
	console.info('[GPS] Envoi position désactivé');
}

export const gpsService = {
	get position() { return state.position; },
	get isActive() { return state.isActive; },
	get error() { return state.error; },
	get watchId() { return state.watchId; },
	get isSending() { return state.isSending; },
	get lastSentAt() { return state.lastSentAt; },
	get currentDeliveryId() { return currentDeliveryId; },

	/**
	 * Démarre la surveillance GPS et l'envoi SignalR pour une livraison
	 */
	async start(deliveryId: string): Promise<void> {
		if (!navigator.geolocation) {
			state.error = 'Géolocalisation non supportée par ce navigateur';
			return;
		}

		state.error = null;

		// Demande la permission de géolocalisation
		try {
			const permission = await navigator.permissions?.query({ name: 'geolocation' });
			if (permission?.state === 'denied') {
				state.error = 'Permission de géolocalisation refusée. Veuillez l\'activer dans les paramètres de votre navigateur.';
				return;
			}
		} catch {
			// Certains navigateurs ne supportent pas permissions.query
		}

		// Démarre la surveillance GPS
		state.watchId = navigator.geolocation.watchPosition(
			(pos) => {
				state.position = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
					timestamp: Date.now()
				};
				state.isActive = true;
				state.error = null;
			},
			(err) => {
				let errorMsg = 'Erreur GPS';
				switch (err.code) {
					case err.PERMISSION_DENIED:
						errorMsg = 'Permission de géolocalisation refusée';
						break;
					case err.POSITION_UNAVAILABLE:
						errorMsg = 'Position non disponible';
						break;
					case err.TIMEOUT:
						errorMsg = 'Délai d\'attente GPS dépassé';
						break;
				}
				state.error = `${errorMsg}: ${err.message}`;
				state.isActive = false;
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 5000
			}
		);

		// Démarre l'envoi SignalR
		startSending(deliveryId);
	},

	/**
	 * Arrête la surveillance GPS et l'envoi SignalR
	 */
	stop(): void {
		// Arrête l'envoi SignalR
		stopSending();

		// Arrête la surveillance GPS
		if (state.watchId !== null) {
			navigator.geolocation.clearWatch(state.watchId);
			state.watchId = null;
		}
		state.isActive = false;
		state.position = null;
	},

	/**
	 * Force l'envoi immédiat de la position actuelle
	 */
	async sendNow(): Promise<void> {
		if (!state.position || !currentDeliveryId) {
			console.warn('[GPS] Pas de position ou de livraison active');
			return;
		}
		await sendPosition();
	}
};
