'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTracking } from '@/lib/hooks/useTracking';
import { getDeliveryPublic, DeliveryDetail } from '@/lib/api';

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
  params: Promise<{ deliveryId: string }>;
}

// Fonction pour obtenir le tenantId depuis l'URL
function getTenantIdFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get('tenantId') || undefined;
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { deliveryId } = React.use(params);
  const tenantId = getTenantIdFromUrl();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const {
    isConnected,
    isConnecting,
    driverPosition,
    deliveryStatus,
    estimatedArrival,
    error: trackingError,
  } = useTracking(deliveryId, tenantId);

  // Charge les détails de la livraison
  useEffect(() => {
    async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
      try {
        const q = encodeURIComponent(address.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
        if (!res.ok) return null;
        const data = await res.json() as Array<{ lat: string; lon: string }>;
        if (!data?.length) return null;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng };
      } catch {
        return null;
      }
    }

    async function loadDelivery() {
      try {
        const data = await getDeliveryPublic(deliveryId);
        setDelivery(data);

        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
          setDestinationCoords({ lat: data.lat, lng: data.lng });
        } else if (data.address) {
          const geocoded = await geocodeAddress(data.address);
          setDestinationCoords(geocoded);
        } else {
          setDestinationCoords(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    
    loadDelivery();
  }, [deliveryId]);

  // Formate le statut pour l'affichage
  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      'Pending': 'En attente',
      'InProgress': 'En cours',
      'Completed': 'Livrée',
      'Failed': 'Non livrée',
    };
    return labels[status || ''] || status || 'Inconnu';
  };

  // Formate l'heure d'arrivée estimée
  const formatETA = (date: Date | null) => {
    if (!date) return 'Calcul en cours...';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <p className="text-red-600 font-medium mb-2">⚠️ {error}</p>
          <p className="text-gray-600 text-sm">Vérifiez le lien ou contactez l'expéditeur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold">Suivi de livraison</h1>
          <p className="text-sm text-gray-600">#{deliveryId.slice(0, 8).toUpperCase()}</p>
        </div>
      </header>
      
      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <p className={`text-lg font-semibold ${
                deliveryStatus === 'Completed' ? 'text-green-600' :
                deliveryStatus === 'InProgress' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {getStatusLabel(deliveryStatus || delivery?.status || null)}
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' :
                isConnecting ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'En direct' :
                 isConnecting ? 'Connexion...' :
                 'Déconnecté'}
              </span>
            </div>
          </div>
          
          {/* ETA */}
          {deliveryStatus === 'InProgress' && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-600">Arrivée estimée</p>
              <p className="text-xl font-bold text-blue-600">{formatETA(estimatedArrival)}</p>
            </div>
          )}
        </div>
        
        {/* Delivery Info */}
        {delivery && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold mb-2">📦 Détails</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Client:</span> {delivery.customerName}</p>
              <p><span className="text-gray-600">Adresse:</span> {delivery.address}</p>
              {delivery.driverName && (
                <p><span className="text-gray-600">Livreur:</span> {delivery.driverName}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '400px' }}>
          {destinationCoords ? (
            <TrackingMap
              key={`tracking-map-${deliveryId}`}
              destination={{
                lat: destinationCoords.lat,
                lng: destinationCoords.lng,
                label: delivery?.address || 'Destination'
              }}
              driverPosition={driverPosition ? {
                lat: driverPosition.lat,
                lng: driverPosition.lng,
                label: delivery?.driverName || 'Livreur',
              } : undefined}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 px-6 text-center">
              Position de destination indisponible pour cette livraison.
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {trackingError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ {trackingError}
          </div>
        )}
        
        {/* Last Update */}
        {driverPosition && (
          <p className="text-center text-xs text-gray-500">
            Dernière mise à jour: {new Date(driverPosition.updatedAt).toLocaleTimeString('fr-FR')}
          </p>
        )}
      </main>
    </div>
  );
}