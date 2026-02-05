/**
 * Page de suivi d'une livraison
 * URL: /track/{deliveryId}
 */

'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { getDeliveryDetail } from '@/lib/api/deliveries';
import TrackingHeader from '@/components/TrackingHeader';
import DeliveryInfo from '@/components/DeliveryInfo';
import ActionButtons from '@/components/ActionButtons';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

// Charger la carte dynamiquement (pas de SSR)
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 flex items-center justify-center" style={{ height: '400px' }}>
      <LoadingSpinner />
    </div>
  ),
});

export default function TrackPage() {
  const params = useParams();
  const deliveryId = params.id as string;

  const fetchDelivery = useCallback(
    () => getDeliveryDetail(deliveryId),
    [deliveryId]
  );

  const { data: delivery, loading, error, refresh } = useAutoRefresh(
    fetchDelivery,
    30000 // Rafraîchir toutes les 30 secondes
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <TrackingHeader />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading && !delivery && <LoadingSpinner />}

        {error && (
          <ErrorMessage
            message={error.message || 'Impossible de charger les informations de livraison'}
            onRetry={refresh}
          />
        )}

        {delivery && (
          <>
            {/* Carte */}
            <DeliveryMap delivery={delivery} />

            {/* Informations de livraison */}
            <DeliveryInfo delivery={delivery} />

            {/* Boutons d'action */}
            <ActionButtons
              driverPhone="+33612345678"
              businessWhatsApp="33612345678"
              businessEmail="contact@trackly.app"
            />

            {/* Indicateur de rafraîchissement */}
            <div className="text-center text-sm text-stone-500">
              <p>🔄 Mise à jour automatique toutes les 30 secondes</p>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-stone-500">
        <p>Propulsé par <span className="font-semibold text-teal-600">Trackly</span></p>
        <p className="mt-1">Suivi de livraison en temps réel</p>
      </footer>
    </div>
  );
}
