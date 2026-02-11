'use client';

import { HubConnectionBuilder, LogLevel, HubConnectionState, type HubConnection } from '@microsoft/signalr';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5257';
const HUB_URL = `${API_URL}/hubs/tracking`;

// Types
export interface DriverLocation {
  driverId: string;
  deliveryId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Callbacks
export type LocationCallback = (location: DriverLocation) => void;
export type StatusCallback = (status: ConnectionStatus) => void;

/**
 * Service SignalR pour le tracking client
 * Écoute les mises à jour de position du livreur en temps réel
 */
class TrackingSignalRService {
  private connection: HubConnection | null = null;
  private status: ConnectionStatus = 'disconnected';
  private locationCallbacks: LocationCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private currentDeliveryId: string | null = null;

  /**
   * Obtient le statut actuel de la connexion
   */
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  /**
   * S'abonne aux mises à jour de position
   */
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux changements de statut de connexion
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Met à jour le statut interne et notifie les listeners
   */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach(cb => {
      try {
        cb(status);
      } catch (err) {
        console.error('[Tracking SignalR] Erreur dans le callback de statut:', err);
      }
    });
  }

  /**
   * Notifie les listeners d'une nouvelle position
   */
  private notifyLocationUpdate(location: DriverLocation): void {
    this.locationCallbacks.forEach(cb => {
      try {
        cb(location);
      } catch (err) {
        console.error('[Tracking SignalR] Erreur dans le callback de position:', err);
      }
    });
  }

  /**
   * Connecte au hub SignalR
   */
  async connect(deliveryId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      console.info('[Tracking SignalR] Déjà connecté');
      return;
    }

    if (this.connection?.state === HubConnectionState.Connecting) {
      console.info('[Tracking SignalR] Connexion déjà en cours');
      return;
    }

    this.currentDeliveryId = deliveryId;
    this.setStatus('connecting');

    try {
      console.info(`[Tracking SignalR] Connexion au hub: ${HUB_URL}`);

      this.connection = new HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Backoff exponentiel : 0s, 2s, 4s, 8s, 10s (max)
            const delay = Math.min(10000, Math.pow(2, retryContext.previousRetryCount) * 1000);
            console.info(`[Tracking SignalR] Tentative de reconnexion ${retryContext.previousRetryCount + 1} dans ${delay}ms...`);
            return delay;
          }
        })
        .configureLogging(LogLevel.Warning)
        .build();

      // Écoute les événements de connexion
      this.connection.onreconnecting(() => {
        console.warn('[Tracking SignalR] Reconnexion en cours...');
        this.setStatus('reconnecting');
      });

      this.connection.onreconnected(() => {
        console.info('[Tracking SignalR] Reconnecté avec succès');
        this.setStatus('connected');
        // Rejoint à nouveau le groupe après reconnexion
        if (this.currentDeliveryId) {
          this.joinDeliveryGroup(this.currentDeliveryId).catch(err => {
            console.error('[Tracking SignalR] Erreur lors du rejoint du groupe après reconnexion:', err);
          });
        }
      });

      this.connection.onclose((err) => {
        console.error('[Tracking SignalR] Connexion fermée', err);
        this.setStatus('disconnected');
      });

      // Écoute la mise à jour de position du livreur
      this.connection.on('LocationUpdated', (deliveryId: string, lat: number, lng: number, timestamp: string) => {
        console.info(`[Tracking SignalR] Position reçue: lat=${lat}, lng=${lng}`);
        this.notifyLocationUpdate({
          driverId: 'driver', // Le backend ne retourne pas driverId actuellement
          deliveryId,
          lat,
          lng,
          timestamp
        });
      });

      // Démarre la connexion
      await this.connection.start();
      console.info('[Tracking SignalR] Connecté au hub');

      // Rejoint le groupe de la livraison
      await this.joinDeliveryGroup(deliveryId);

      this.setStatus('connected');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[Tracking SignalR] Erreur de connexion:', errorMsg);
      this.setStatus('error');
      throw err;
    }
  }

  /**
   * Rejoint le groupe de tracking pour une livraison
   */
  private async joinDeliveryGroup(deliveryId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('Non connecté au hub');
    }

    try {
      await this.connection.invoke('JoinDeliveryGroup', deliveryId);
      console.info(`[Tracking SignalR] Rejoint le groupe delivery-${deliveryId}`);
    } catch (err) {
      console.error('[Tracking SignalR] Erreur lors du join du groupe:', err);
      throw err;
    }
  }

  /**
   * Quitte le groupe de tracking
   */
  async leaveDeliveryGroup(deliveryId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('LeaveDeliveryGroup', deliveryId);
      console.info(`[Tracking SignalR] Quitte le groupe delivery-${deliveryId}`);
    } catch (err) {
      console.error('[Tracking SignalR] Erreur lors du leave du groupe:', err);
    }
  }

  /**
   * Déconnecte du hub
   */
  async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      console.info('[Tracking SignalR] Déconnexion du hub...');
      if (this.currentDeliveryId) {
        await this.leaveDeliveryGroup(this.currentDeliveryId);
      }
      await this.connection.stop();
    } catch (err) {
      console.error('[Tracking SignalR] Erreur lors de la déconnexion:', err);
    } finally {
      this.connection = null;
      this.currentDeliveryId = null;
      this.setStatus('disconnected');
    }
  }
}

// Export singleton
export const trackingSignalR = new TrackingSignalRService();
