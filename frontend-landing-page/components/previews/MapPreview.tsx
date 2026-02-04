"use client";

import Image from "next/image";

/**
 * Aperçu de la carte (image statique).
 * Remplacer /map-preview.svg par une capture d’écran réelle si besoin.
 */
export function MapPreview() {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-sm"
      aria-hidden="true"
    >
      <Image
        src="/map-preview.png"
        alt=""
        width={400}
        height={240}
        className="h-full w-full object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
        priority={false}
      />
    </div>
  );
}
