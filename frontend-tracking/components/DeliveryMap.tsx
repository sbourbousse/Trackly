/**
 * Carte de livraison avec Leaflet
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DeliveryDetailResponse } from '@/lib/types/api';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  delivery: DeliveryDetailResponse;
}

// Coordonnées par défaut (centre de Montpellier)
const DEFAULT_CENTER: [number, number] = [43.6108, 3.8767];
const DEFAULT_ZOOM = 13;

// Fonction pour géocoder une adresse (simulation pour le moment)
// En production, vous voudrez utiliser une vraie API de géocodage
function getCoordinatesFromAddress(address: string): [number, number] {
  // Pour la démo, on retourne une position aléatoire autour de Montpellier
  const lat = 43.6108 + (Math.random() - 0.5) * 0.05;
  const lng = 3.8767 + (Math.random() - 0.5) * 0.05;
  return [lat, lng];
}

export default function DeliveryMap({ delivery }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Utiliser useMemo pour éviter de recalculer la position à chaque render
  const position = useMemo(
    () => getCoordinatesFromAddress(delivery.address),
    [delivery.address]
  );

  useEffect(() => {
    // Ne créer la carte que côté client
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Si une carte existe déjà, la supprimer
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Importer Leaflet dynamiquement
    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      // Fix pour les icônes Leaflet avec Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Créer la carte
      const map = L.map(mapRef.current, {
        center: position,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // Ajouter la couche de tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Ajouter le marker
      const marker = L.marker(position).addTo(map);
      
      // Ajouter le popup
      marker.bindPopup(`
        <div class="text-sm">
          <p class="font-semibold">${delivery.customerName}</p>
          <p class="text-stone-600">${delivery.address}</p>
        </div>
      `);
    });

    // Cleanup : supprimer la carte au démontage
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [position, delivery.customerName, delivery.address]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden"
      style={{ height: '400px' }}
    >
      <div ref={mapRef} className="w-full h-full" />
    </motion.div>
  );
}
