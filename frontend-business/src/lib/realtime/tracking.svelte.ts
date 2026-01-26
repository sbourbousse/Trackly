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
		if (trackingState.isConnected || trackingState.isConnecting) return;

		trackingState.isConnecting = true;
		trackingState.lastError = null;

		try {
			connection = new HubConnectionBuilder()
				.withUrl(getHubUrl())
				.withAutomaticReconnect()
				.configureLogging(LogLevel.Warning)
				.build();

			connection.on('LocationUpdated', (lat: number, lng: number) => {
				trackingState.point = {
					lat,
					lng,
					updatedAt: new Date().toISOString()
				};
			});

			await connection.start();
			trackingState.isConnected = true;
		} catch (error) {
			trackingState.lastError = error instanceof Error ? error.message : 'Connexion echouee';
		} finally {
			trackingState.isConnecting = false;
		}
	},
	async disconnect() {
		if (!connection) return;
		try {
			await connection.stop();
		} finally {
			connection = null;
			trackingState.isConnected = false;
		}
	}
};
