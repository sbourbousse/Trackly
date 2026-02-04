"use client";

/**
 * Aperçu statique de l’app chauffeur (PWA).
 * Couleurs alignées avec frontend-business (stone + teal).
 */
export function AppDriverPreview() {
  return (
    <div
      className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-900">Tournée</span>
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
          3 / 5 livrées
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: "60%" }}
          />
        </div>
        <p className="text-[10px] text-stone-500">Prochain arrêt : 12 min</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-teal-600 py-2 text-[10px] font-medium text-white"
        >
          Livré
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-300 bg-white py-2 px-2 text-[10px] text-stone-700"
        >
          Appel
        </button>
      </div>
    </div>
  );
}
