/**
 * Badge de statut animé
 */

'use client';

import { motion } from 'framer-motion';
import type { DeliveryStatus } from '@/lib/types/api';
import { getStatusInfo } from '@/lib/utils/status';

interface StatusBadgeProps {
  status: DeliveryStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const info = getStatusInfo(status);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${info.bgColor} ${info.color} font-medium text-sm`}
    >
      <span className="text-lg">{info.icon}</span>
      <span>{info.label}</span>
    </motion.div>
  );
}
