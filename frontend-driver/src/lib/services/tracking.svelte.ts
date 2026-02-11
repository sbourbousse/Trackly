import { HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { getRuntimeConfig } from '../config';
import { getTenantId } from '../api/client';

const config = getRuntimeConfig();
const baseHubUrl = config.SIGNALR_URL || 'http://localhost:5257/hubs/tracking';

console.info('[Driver Tracking] Configuration:');
console.info('[Driver Tracking] - SIGNALR_URL:', config.SIGNALR_URL || '(fallback to localhost)');
console.info('[Driver Tracking] - baseHubUrl used:', baseHubUrl);

// État réactif
let connection = $state<ReturnType<typeof HubConnectionBuilder.prototype.build> | null>(null);
let isConnected = $state(false);
let isConnecting = $state(false);
let isReconnecting = $state(false);
let error = $state<string | null>(null);
let lastError = $state<string | null>(null);

// Callbacks pour les événements de connexion
let onReconnectingCallback: (() => void) | null = null;
let onReconnectedCallback: (() => void) | null = null;
let onCloseCallback: (() => void) | null = null;

export const trackingService = {
	get connection() { return connection; },
	get isConnected() { return isConnected; },
	get isConnecting() { return isConnecting; },
	get isReconnecting() { return isReconnecting; },
	get error() { return error; },
	get lastError() { return lastError; },

	/**
	 * Définit les callbacks pour les événements de connexion
	 */
	onReconnecting(callback: () => void) {
		onReconnectingCallback = callback;
	},
	onReconnected(callback: () => void) {
		onReconnectedCallback = callback;
	},
	onClose(callback: () => void) {
		onCloseCallback = callback;
	},

	/**
	 * Connecte au hub SignalR et rejoint le groupe de la livraison
	 */
	async connect(deliveryId: string) {
		if (isConnected || isConnecting) {
			console.info('[Driver Tracking] Déjà connecté ou en cours de connexion');
			return;
		}

		isConnecting = true;
		error = null;

		try {
			// Récupère le tenantId depuis le cache ou l'API
			const tenantId = await getTenantId();
			if (!tenantId) {
				throw new Error('TenantId manquant. Veuillez vous connecter avec un driver ID valide.');
			}

			// Construit l'URL du hub avec le tenantId en query parameter
			const hubUrl = `${baseHubUrl}?tenantId=${encodeURIComponent(tenantId)}`;

			console.info(`[Driver Tracking] Connexion au hub: ${hubUrl}`);

			connection = new HubConnectionBuilder()
				.withUrl(hubUrl)
				.withAutomaticReconnect({
					nextRetryDelayInMilliseconds: (retryContext) => {
						// Backoff exponentiel : 0s, 2s, 4s, 8s, 10s (max)
						const delay = Math.min(10000, Math.pow(2, retryContext.previousRetryCount) * 1000);
						console.info(`[Driver Tracking] Tentative de reconnexion ${retryContext.previousRetryCount + 1} dans ${delay}ms...`);
						return delay;
					}
				})
				.configureLogging(LogLevel.Warning)
				.build();

			// Écoute les événements de connexion
			connection.onreconnecting((err) => {
				console.warn('[Driver Tracking] Reconnexion en cours...', err?.message);
				isReconnecting = true;
				isConnected = false;
				onReconnectingCallback?.();
			});

			connection.onreconnected(() => {
				console.info('[Driver Tracking] Reconnecté avec succès');
				isReconnecting = false;
				isConnected = true;
				lastError = null;
				// Rejoint à nouveau le groupe après reconnexion
				connection?.invoke('JoinDeliveryGroup', deliveryId).catch(err => {
					console.error('[Driver Tracking] Erreur rejoint groupe après reconnexion:', err);
				});
				onReconnectedCallback?.();
			});

			connection.onclose((err) => {
				console.error('[Driver Tracking] Connexion fermée', err?.message);
				isConnected = false;
				isReconnecting = false;
				isConnecting = false;
				if (err) {
					lastError = err.message;
				}
				onCloseCallback?.();
			});

			await connection.start();
			console.info('[Driver Tracking] Connecté au hub');

			await connection.invoke('JoinDeliveryGroup', deliveryId);
			console.info(`[Driver Tracking] Rejoint le groupe delivery-${deliveryId}`);
			
			isConnected = true;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
			console.error('[Driver Tracking] Erreur de connexion:', errorMsg);
			error = errorMsg;
			lastError = errorMsg;
		} finally {
			isConnecting = false;
		}
	},

	/**
	 * Déconnecte du hub SignalR
	 */
	async disconnect() {
		if (!connection) return;

		try {
			console.info('[Driver Tracking] Déconnexion du hub...');
			await connection.stop();
		} catch (err) {
			console.error('[Driver Tracking] Erreur lors de la déconnexion:', err);
		} finally {
			connection = null;
			isConnected = false;
			isReconnecting = false;
			isConnecting = false;
		}
	},

	/**
	 * Envoie la position actuelle au serveur
	 */
	async updateLocation(deliveryId: string, lat: number, lng: number) {
		if (!connection || !isConnected) {
			console.warn('[Driver Tracking] Pas connecté, position non envoyée');
			return;
		}

		try {
			await connection.invoke('UpdateLocation', deliveryId, lat, lng);
		} catch (err) {
			console.error('[Driver Tracking] Erreur envoi position:', err);
			// Ne pas throw pour éviter de casser le flux GPS
		}
	},

	/**
	 * Vérifie l'état de la connexion
	 */
	checkConnection(): boolean {
		return connection?.state === HubConnectionState.Connected;
	}
};
