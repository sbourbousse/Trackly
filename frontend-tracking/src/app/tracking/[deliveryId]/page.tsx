'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DeliveryInfo } from '@/lib/types';
import { trackingSignalR, type DriverLocation, type ConnectionStatus } from '@/lib/services/signalr';

// Import dynamique de la carte Leaflet (évite les erreurs SSR)
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Chargement de la carte...</p>
    </div>
  ),
});

interface TrackingPageProps {
  params: {
    deliveryId: string;
  };
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { deliveryId } = params;
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la position du livreur en temps réel
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Récupère les infos de livraison
  useEffect(() => {
    async function fetchDelivery() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/public/deliveries/${deliveryId}/tracking`);
        
        if (!response.ok) {
          throw new Error('Livraison introuvable');
        }
        
        const data = await response.json();
        setDelivery(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        // Mode mock pour démo si l'API n'est pas disponible
        setDelivery({
          id: deliveryId,
          status: 'InProgress',
          customerName: 'Client Exemple',
          address: '123 Rue de Paris, 75001 Paris',
          driverName: 'Jean Dupont',
          driverPhone: '+33 6 12 34 56 78',
          sequence: 1,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDelivery();
  }, [deliveryId]);

  // Gestionnaire de mise à jour de position
  const handleLocationUpdate = useCallback((location: DriverLocation) => {
    console.info('[Tracking Page] Nouvelle position reçue:', location);
    setDriverPosition({ lat: location.lat, lng: location.lng });
    setLastUpdate(new Date());
  }, []);

  // Gestionnaire de changement de statut de connexion
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    console.info('[Tracking Page] Statut connexion:', status);
    setConnectionStatus(status);
  }, []);

  // Connexion SignalR
  useEffect(() => {
    if (!deliveryId) return;

    // S'abonne aux événements
    const unsubscribeLocation = trackingSignalR.onLocationUpdate(handleLocationUpdate);
    const unsubscribeStatus = trackingSignalR.onStatusChange(handleStatusChange);

    // Connecte au hub
    trackingSignalR.connect(deliveryId).catch(err => {
      console.error('[Tracking Page] Erreur connexion SignalR:', err);
      setError('Impossible de se connecter au suivi en temps réel');
    });

    // Cleanup
    return () => {
      unsubscribeLocation();
      unsubscribeStatus();
      trackingSignalR.disconnect();
    };
  }, [deliveryId, handleLocationUpdate, handleStatusChange]);

  // Détermine le texte et la couleur du statut de connexion
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { text: 'En ligne', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
      case 'connecting':
        return { text: 'Connexion...', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500 animate-pulse' };
      case 'reconnecting':
        return { text: 'Reconnexion...', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500 animate-pulse' };
      case 'error':
        return { text: 'Erreur de connexion', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
      default:
        return { text: 'Hors ligne', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Suivi de livraison
          </h1>
          <p className="text-gray-600 mt-1">
            Commande #{deliveryId.slice(0, 8).toUpperCase()}
          </p>
        </header>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Statut livraison</p>
              <StatusBadge status={delivery?.status || 'Pending'} />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Statut tracking</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${statusDisplay.dot}`}></span>
                {statusDisplay.text}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Client</p>
              <p className="font-semibold text-gray-900">{delivery?.customerName}</p>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-3">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Position du livreur</h2>
          </div>
          <div className="h-96">
            <TrackingMap
              destination={{
                lat: 48.8566,
                lng: 2.3522,
                label: delivery?.address || 'Destination',
              }}
              driverPosition={driverPosition ? {
                lat: driverPosition.lat,
                lng: driverPosition.lng,
                label: delivery?.driverName || 'Livreur',
              } : undefined}
            />
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Détails de la livraison</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500 mb-1">Adresse de livraison</p>
              <p className="font-medium text-gray-900">{delivery?.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Livreur</p>
              <p className="font-medium text-gray-900">{delivery?.driverName}</p>
              {delivery?.driverPhone && (
                <a
                  href={`tel:${delivery.driverPhone}`}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  📞 {delivery.driverPhone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Trackly - Suivi de livraison en temps réel</p>
        </footer>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    Pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    InProgress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
    Completed: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
    Failed: { label: 'Échouée', color: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
