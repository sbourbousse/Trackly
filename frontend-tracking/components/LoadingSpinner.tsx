/**
 * Spinner de chargement animé
 */

'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full"
      />
      <p className="text-stone-500 font-medium">Chargement...</p>
    </div>
  );
}
