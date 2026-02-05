/**
 * Informations de livraison
 */

'use client';

import { motion } from 'framer-motion';
import type { DeliveryDetailResponse } from '@/lib/types/api';
import { formatDateTime } from '@/lib/utils/status';
import StatusBadge from './StatusBadge';

interface DeliveryInfoProps {
  delivery: DeliveryDetailResponse;
}

export default function DeliveryInfo({ delivery }: DeliveryInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 space-y-6"
    >
      {/* Statut */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-stone-200">
        <StatusBadge status={delivery.status} />
        {delivery.completedAt && (
          <p className="text-sm text-stone-500">
            Livrée le {formatDateTime(delivery.completedAt)}
          </p>
        )}
      </div>

      {/* Informations client */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-stone-500 uppercase mb-1">
            Destinataire
          </h3>
          <p className="text-lg font-semibold text-stone-900">
            {delivery.customerName}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium text-stone-500 uppercase mb-1">
            Adresse de livraison
          </h3>
          <p className="text-base text-stone-700">
            {delivery.address}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium text-stone-500 uppercase mb-1">
            Livreur
          </h3>
          <p className="text-base text-stone-700">
            {delivery.driverName}
          </p>
        </div>

        {delivery.sequence !== null && (
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase mb-1">
              Arrêt
            </h3>
            <p className="text-base text-stone-700">
              Arrêt n°{delivery.sequence + 1}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
