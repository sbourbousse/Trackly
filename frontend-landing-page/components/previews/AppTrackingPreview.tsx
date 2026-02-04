"use client";

/**
 * Aperçu statique de la page de suivi client (badge / statut).
 * Couleurs alignées avec frontend-business (stone + teal).
 */
export function AppTrackingPreview() {
  return (
    <div
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <p className="text-[10px] text-stone-500">Votre colis</p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
        <span
          className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-teal-700">
          Livraison en cours
        </span>
      </div>
      <p className="mt-2 text-[10px] text-stone-500">
        Livreur à proximité • ETA 14h30
      </p>
    </div>
  );
}
