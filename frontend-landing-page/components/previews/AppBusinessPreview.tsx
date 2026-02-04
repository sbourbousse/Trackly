"use client";

/**
 * Aperçu statique du dashboard business (tournées, commandes).
 * Couleurs alignées avec frontend-business (stone + teal).
 */
export function AppBusinessPreview() {
  return (
    <div
      className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
      aria-hidden="true"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-900">
          Trackly Business
        </span>
        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
          Plan Starter
        </span>
      </div>
      <div className="mb-2 flex gap-1 rounded-md bg-stone-100 p-0.5">
        <button
          type="button"
          className="rounded bg-white px-2 py-1 text-[10px] font-medium text-stone-900 shadow-sm"
        >
          Commandes
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[10px] text-stone-500"
        >
          Livraisons
        </button>
      </div>
      <div className="overflow-hidden rounded border border-stone-200">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="px-2 py-1 font-medium text-stone-600">Statut</th>
              <th className="px-2 py-1 font-medium text-stone-600">Réf.</th>
              <th className="px-2 py-1 font-medium text-stone-600">Client</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <tr>
              <td className="px-2 py-1">
                <span className="inline-flex items-center rounded border border-teal-200 bg-teal-50 px-1 text-teal-700">
                  En attente
                </span>
              </td>
              <td className="px-2 py-1 text-stone-700">CMD-001</td>
              <td className="px-2 py-1 text-stone-600">Boulangerie M.</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1 text-amber-700">
                  Prévue
                </span>
              </td>
              <td className="px-2 py-1 text-stone-700">CMD-002</td>
              <td className="px-2 py-1 text-stone-600">Fleuriste J.</td>
            </tr>
            <tr>
              <td className="px-2 py-1">
                <span className="inline-flex items-center rounded border border-teal-200 bg-teal-50 px-1 text-teal-700">
                  En cours
                </span>
              </td>
              <td className="px-2 py-1 text-stone-700">CMD-003</td>
              <td className="px-2 py-1 text-stone-600">Artisan P.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
