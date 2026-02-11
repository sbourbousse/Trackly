'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

export default function TrackingPage({ params }: TrackingPageProps) {
  const { deliveryId } = React.use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simule le chargement
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold">Suivi de livraison #{deliveryId}</h1>
      </header>
      
      <main className="p-4">
        <TrackingMap
          destination={{ lat: 43.6101, lng: 3.8764, label: 'Destination' }}
          driverPosition={{ lat: 43.6086, lng: 3.8796, label: 'Livreur' }}
        />
      </main>
    </div>
  );
}