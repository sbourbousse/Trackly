import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getRuntimeConfig } from '../config';

const config = getRuntimeConfig();
const hubUrl = config.SIGNALR_URL || 'http://localhost:5257/hubs/tracking';

console.info('[Driver] Configuration:');
console.info('[Driver] - SIGNALR_URL:', config.SIGNALR_URL || '(fallback to localhost)');
console.info('[Driver] - hubUrl used:', hubUrl);

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
