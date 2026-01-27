import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const hubUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5257/hubs/tracking';

// État réactif
let connection = $state<ReturnType<typeof HubConnectionBuilder.prototype.build> | null>(null);
let isConnected = $state(false);
let isConnecting = $state(false);
let error = $state<string | null>(null);

export const trackingService = {
	get connection() { return connection; },
	get isConnected() { return isConnected; },
	get isConnecting() { return isConnecting; },
	get error() { return error; },

	async connect(deliveryId: string) {
		if (isConnected || isConnecting) return;

		isConnecting = true;
		error = null;

		try {
			connection = new HubConnectionBuilder()
				.withUrl(hubUrl)
				.withAutomaticReconnect()
				.configureLogging(LogLevel.Warning)
				.build();

			await connection.start();
			await connection.invoke('JoinDeliveryGroup', deliveryId);
			
			isConnected = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur de connexion';
		} finally {
			isConnecting = false;
		}
	},

	async disconnect() {
		if (!connection) return;

		try {
			await connection.stop();
		} finally {
			connection = null;
			isConnected = false;
		}
	},

	async updateLocation(deliveryId: string, lat: number, lng: number) {
		if (!connection || !isConnected) return;

		try {
			await connection.invoke('UpdateLocation', deliveryId, lat, lng);
		} catch (err) {
			console.error('Erreur envoi position:', err);
		}
	}
};
