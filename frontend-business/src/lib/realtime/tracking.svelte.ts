import { env } from '$env/dynamic/public';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

type TrackingPoint = {
	lat: number;
	lng: number;
	updatedAt: string;
};

export let trackingState = $state({
	isConnected: false,
	isConnecting: false,
	lastError: null as string | null,
	point: null as TrackingPoint | null
});

let connection: ReturnType<typeof HubConnectionBuilder.prototype.build> | null = null;

const getHubUrl = () => {
	return env.PUBLIC_SIGNALR_URL || 'http://localhost:5257/hubs/tracking';
};

export const trackingActions = {
	async connect() {
		if (trackingState.isConnected || trackingState.isConnecting) {
			return;
		}

		trackingState.isConnecting = true;
		trackingState.lastError = null;

		try {
			// Si une connexion existe déjà, la réutiliser
			if (connection && connection.state === 'Connected') {
				trackingState.isConnected = true;
				trackingState.isConnecting = false;
				return;
			}

			// Créer une nouvelle connexion si nécessaire
			if (!connection) {
				connection = new HubConnectionBuilder()
					.withUrl(getHubUrl())
					.withAutomaticReconnect()
					.configureLogging(LogLevel.Warning)
					.build();

				connection.on('LocationUpdated', (deliveryId: string, lat: number, lng: number, timestamp: string) => {
					trackingState.point = {
						lat,
						lng,
						updatedAt: timestamp || new Date().toISOString()
					};
				});

				connection.onclose(() => {
					trackingState.isConnected = false;
				});
			}

			// Démarrer la connexion seulement si elle n'est pas déjà démarrée
			if (connection.state === 'Disconnected') {
				await connection.start();
			}
			
			trackingState.isConnected = true;
		} catch (error) {
			console.error('[Tracking] Erreur de connexion:', error);
			trackingState.lastError = error instanceof Error ? error.message : 'Connexion echouee';
			trackingState.isConnected = false;
		} finally {
			trackingState.isConnecting = false;
		}
	},
	async disconnect() {
		if (!connection) return;
		try {
			if (connection.state !== 'Disconnected') {
				await connection.stop();
			}
		} catch (error) {
			console.error('[Tracking] Erreur lors de la déconnexion:', error);
		} finally {
			connection = null;
			trackingState.isConnected = false;
		}
	},
	async joinDeliveryGroup(deliveryId: string) {
		if (!connection || connection.state !== 'Connected') {
			console.warn('[Tracking] Impossible de rejoindre le groupe: connexion non établie');
			return;
		}
		try {
			await connection.invoke('JoinDeliveryGroup', deliveryId);
			console.log(`[Tracking] Rejoint le groupe pour la livraison ${deliveryId}`);
		} catch (error) {
			console.error('[Tracking] Erreur lors de la jointure du groupe:', error);
		}
	},
	async leaveDeliveryGroup(deliveryId: string) {
		if (!connection || connection.state !== 'Connected') {
			return;
		}
		try {
			await connection.invoke('LeaveDeliveryGroup', deliveryId);
		} catch (error) {
			console.error('[Tracking] Erreur lors de la sortie du groupe:', error);
		}
	}
};
