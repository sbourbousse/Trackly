'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapMarker } from '@/lib/types';

// Fix pour les icônes Leaflet dans Next.js
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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

// Composant pour centrer la carte sur les marqueurs
function MapBounds({ markers }: { markers: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => L.latLng(m[0], m[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);
  
  return null;
}

// Composant pour animer le déplacement du marqueur
function AnimatedMarker({ 
  position, 
  icon, 
  label 
}: { 
  position: [number, number]; 
  icon: L.DivIcon | L.Icon; 
  label: string;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    if (!markerRef.current) {
      // Création initiale du marqueur
      markerRef.current = L.marker(position, { icon }).addTo(map);
      markerRef.current.bindPopup(`<div class="text-sm"><strong>${label}</strong></div>`);
      setCurrentPosition(position);
    } else {
      // Animation fluide vers la nouvelle position
      const startPos = currentPosition;
      const endPos = position;
      const duration = 1000; // 1 seconde d'animation
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing fonction easeOutCubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const newLat = startPos[0] + (endPos[0] - startPos[0]) * easeProgress;
        const newLng = startPos[1] + (endPos[1] - startPos[1]) * easeProgress;
        
        markerRef.current?.setLatLng([newLat, newLng]);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentPosition(position);
        }
      };

      requestAnimationFrame(animate);
    }

    return () => {
      // Cleanup: ne supprime pas le marqueur, juste pour le unmount du composant
    };
  }, [position, icon, label, map]);

  // Mise à jour du popup quand le label change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPopupContent(`<div class="text-sm"><strong>${label}</strong></div>`);
    }
  }, [label]);

  return null;
}

export default function TrackingMap({ destination, driverPosition }: TrackingMapProps) {
  const markers: [number, number][] = [
    [destination.lat, destination.lng],
  ];
  
  if (driverPosition) {
    markers.push([driverPosition.lat, driverPosition.lng]);
  }

  return (
    <MapContainer
      center={[destination.lat, destination.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Marqueur destination (statique) */}
      <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
        <Popup>
          <div className="text-sm">
            <strong>Destination</strong>
            <p className="mt-1">{destination.label}</p>
          </div>
        </Popup>
      </Marker>
      
      {/* Marqueur livreur (animé) */}
      {driverPosition && (
        <AnimatedMarker 
          position={[driverPosition.lat, driverPosition.lng]} 
          icon={driverIcon}
          label={driverPosition.label}
        />
      )}
      
      <MapBounds markers={markers} />
    </MapContainer>
  );
}
