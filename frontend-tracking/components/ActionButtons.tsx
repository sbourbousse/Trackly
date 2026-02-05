/**
 * Boutons d'action rapide (Appeler / Contacter)
 */

'use client';

import { motion } from 'framer-motion';

interface ActionButtonsProps {
  driverPhone?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWhatsApp?: string;
}

export default function ActionButtons({
  driverPhone,
  businessPhone,
  businessEmail,
  businessWhatsApp,
}: ActionButtonsProps) {
  const handleCallDriver = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

  const handleContactBusiness = () => {
    if (businessWhatsApp) {
      window.open(`https://wa.me/${businessWhatsApp}`, '_blank');
    } else if (businessEmail) {
      window.location.href = `mailto:${businessEmail}`;
    } else if (businessPhone) {
      window.location.href = `tel:${businessPhone}`;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {driverPhone && (
        <motion.button
          variants={buttonVariants}
          onClick={handleCallDriver}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 text-white font-semibold rounded-xl shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
        >
          <span className="text-2xl">📞</span>
          <span>Appeler le livreur</span>
        </motion.button>
      )}

      {(businessWhatsApp || businessEmail || businessPhone) && (
        <motion.button
          variants={buttonVariants}
          onClick={handleContactBusiness}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-stone-700 text-white font-semibold rounded-xl shadow-lg hover:bg-stone-800 active:scale-95 transition-all"
        >
          <span className="text-2xl">💬</span>
          <span>Contacter le commerçant</span>
        </motion.button>
      )}
    </motion.div>
  );
}
