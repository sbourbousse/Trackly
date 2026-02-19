'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMarker } from '@/lib/types';

// Icône destination (divIcon pour éviter la dépendance aux assets PNG)
const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        inset: 0;
        background: #ef4444;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
      <div style="
        position: absolute;
        top: 6px;
        left: 6px;
        width: 8px;
        height: 8px;
        background: #ffffff;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -22],
});

// Icône du livreur avec pulse
const driverIcon = L.divIcon({
  className: 'custom-driver-marker',
  html: `
    <div style="position: relative;">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background-color: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        animation: pulse 2s ease-out infinite;
      "></div>
      <div style="
        position: relative;
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 1;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface TrackingMapProps {
  destination: MapMarker;
  driverPosition?: MapMarker;
}

export default function TrackingMap({ destination, driverPosition }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    // Protection supplémentaire contre les remounts React DEV
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([destination.lat, destination.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      destinationMarkerRef.current = null;
      driverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [destination.lat, destination.lng]);

  // Mise à jour des marqueurs + cadrage
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const destinationLatLng: [number, number] = [destination.lat, destination.lng];

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(destinationLatLng, { icon: destinationIcon }).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(destinationLatLng);
    }
    destinationMarkerRef.current.bindPopup(
      `<div class="text-sm"><strong>Destination</strong><p class="mt-1">${destination.label}</p></div>`
    );

    if (driverPosition) {
      const driverLatLng: [number, number] = [driverPosition.lat, driverPosition.lng];
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker(driverLatLng, { icon: driverIcon }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng(driverLatLng);
      }
      driverMarkerRef.current.bindPopup(`<div class="text-sm"><strong>${driverPosition.label}</strong></div>`);

      const bounds = L.latLngBounds([destinationLatLng, driverLatLng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      map.setView(destinationLatLng, Math.max(map.getZoom(), 13));
    }
  }, [destination.lat, destination.lng, destination.label, driverPosition]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
