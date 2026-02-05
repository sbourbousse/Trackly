/**
 * Page d'accueil (redirection ou page de démo)
 */

'use client';

import { motion } from 'framer-motion';
import TrackingHeader from '@/components/TrackingHeader';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <TrackingHeader />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Hero */}
          <div className="space-y-4">
            <div className="inline-block p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl">
              <span className="text-6xl">📦</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900">
              Suivez votre livraison en temps réel
            </h1>
            <p className="text-xl text-stone-600 max-w-2xl mx-auto">
              Trackly vous permet de suivre votre colis à tout moment, où que vous soyez.
            </p>
          </div>

          {/* Fonctionnalités */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="font-semibold text-stone-900 mb-2">
                Carte en temps réel
              </h3>
              <p className="text-stone-600 text-sm">
                Visualisez la position de votre livreur sur une carte interactive
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
              <div className="text-4xl mb-3">🔔</div>
              <h3 className="font-semibold text-stone-900 mb-2">
                Notifications
              </h3>
              <p className="text-stone-600 text-sm">
                Recevez des mises à jour automatiques sur l&apos;état de votre livraison
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="font-semibold text-stone-900 mb-2">
                Contact direct
              </h3>
              <p className="text-stone-600 text-sm">
                Contactez facilement votre livreur ou le commerçant
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12 p-8 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border border-teal-200"
          >
            <h2 className="text-2xl font-bold text-stone-900 mb-4">
              Vous avez reçu un lien de suivi ?
            </h2>
            <p className="text-stone-700 mb-6">
              Cliquez simplement sur le lien dans votre SMS ou email pour suivre votre livraison en temps réel.
            </p>
            <div className="text-sm text-stone-500">
              Format du lien : <code className="bg-white px-2 py-1 rounded">trackly.app/track/[id]</code>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-stone-500">
        <p>Propulsé par <span className="font-semibold text-teal-600">Trackly</span></p>
        <p className="mt-1">© 2026 - Tous droits réservés</p>
      </footer>
    </div>
  );
}
