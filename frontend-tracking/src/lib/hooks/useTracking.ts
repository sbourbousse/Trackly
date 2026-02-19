'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { getRuntimeConfig } from '@/lib/config';

const config = getRuntimeConfig();
const baseHubUrl = config.SIGNALR_URL || 'http://localhost:5257/hubs/tracking';

export interface DriverPosition {
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface TrackingState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  driverPosition: DriverPosition | null;
  deliveryStatus: string | null;
  estimatedArrival: Date | null;
}

export function useTracking(deliveryId: string, tenantId?: string) {
  const [state, setState] = useState<TrackingState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    driverPosition: null,
    deliveryStatus: null,
    estimatedArrival: null,
  });

  const connectionRef = useRef<ReturnType<typeof HubConnectionBuilder.prototype.build> | null>(null);

  const connect = useCallback(async () => {
    if (!deliveryId) return;
    if (!tenantId) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: false,
        error: "Lien de suivi invalide (tenant manquant)."
      }));
      return;
    }
    if (
      connectionRef.current &&
      (connectionRef.current.state === HubConnectionState.Connected ||
        connectionRef.current.state === HubConnectionState.Connecting)
    ) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Construit l'URL avec le tenantId si fourni
      const hubUrl = `${baseHubUrl}?tenantId=${encodeURIComponent(tenantId)}`;

      const conn = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delay = Math.min(10000, Math.pow(2, retryContext.previousRetryCount) * 1000);
            return delay;
          }
        })
        .configureLogging(LogLevel.Warning)
        .build();

      // Écoute les mises à jour de position
      conn.on('LocationUpdated', (receivedDeliveryId: string, lat: number, lng: number) => {
        if (receivedDeliveryId === deliveryId) {
          setState(prev => ({
            ...prev,
            driverPosition: { lat, lng, updatedAt: new Date().toISOString() },
          }));
        }
      });

      // Écoute les changements de statut
      conn.on('StatusUpdated', (receivedDeliveryId: string, status: string) => {
        if (receivedDeliveryId === deliveryId) {
          setState(prev => ({ ...prev, deliveryStatus: status }));
        }
      });

      conn.onreconnecting(() => {
        setState(prev => ({ ...prev, isConnected: false }));
      });

      conn.onreconnected(() => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        // Rejoint le groupe après reconnexion
        conn.invoke('JoinDeliveryGroup', deliveryId).catch(console.error);
      });

      conn.onclose((err) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: err ? `Connexion fermée: ${err.message}` : null,
        }));
      });

      await conn.start();
      
      // Rejoint le groupe de la livraison
      await conn.invoke('JoinDeliveryGroup', deliveryId);
      
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      connectionRef.current = conn;
      
      console.info(`[Tracking] Connecté au suivi de la livraison ${deliveryId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      setState(prev => ({ ...prev, isConnecting: false, error: errorMsg }));
      console.error('[Tracking] Erreur de connexion:', errorMsg);
    }
  }, [deliveryId, tenantId]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
      } catch (err) {
        console.error('[Tracking] Erreur lors de la déconnexion:', err);
      }
      connectionRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Calcule l'ETA si on a la position du driver et la destination
  const calculateETA = useCallback((destinationLat: number, destinationLng: number) => {
    if (!state.driverPosition) return null;
    
    const distance = calculateDistance(
      state.driverPosition.lat,
      state.driverPosition.lng,
      destinationLat,
      destinationLng
    );
    
    // Estimation: 25 km/h en moyenne pour un livreur
    const speedKmh = 25;
    const timeHours = distance / 1000 / speedKmh;
    const timeMinutes = Math.ceil(timeHours * 60);
    
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + timeMinutes);
    
    setState(prev => ({ ...prev, estimatedArrival: eta }));
    return { distance: Math.round(distance), timeMinutes };
  }, [state.driverPosition]);

  return {
    ...state,
    connect,
    disconnect,
    calculateETA,
  };
}

// Calcule la distance en mètres entre deux points GPS
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
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