"use client";

import dynamic from "next/dynamic";

/**
 * Composants d’aperçu des apps Trackly, chargés en lazy pour le LCP.
 * Couleurs et style alignés avec frontend-business (stone + teal).
 */
export const AppBusinessPreview = dynamic(
  () =>
    import("./AppBusinessPreview").then((m) => ({ default: m.AppBusinessPreview })),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-lg border border-stone-200 bg-stone-100"
        style={{ minHeight: 160 }}
        aria-hidden="true"
      />
    ),
  }
);

export const AppDriverPreview = dynamic(
  () => import("./AppDriverPreview").then((m) => ({ default: m.AppDriverPreview })),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-xl border border-stone-200 bg-stone-100"
        style={{ minHeight: 120 }}
        aria-hidden="true"
      />
    ),
  }
);

export const AppTrackingPreview = dynamic(
  () =>
    import("./AppTrackingPreview").then((m) => ({ default: m.AppTrackingPreview })),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-lg border border-stone-200 bg-stone-100"
        style={{ minHeight: 100 }}
        aria-hidden="true"
      />
    ),
  }
);

export const MapPreview = dynamic(
  () => import("./MapPreview").then((m) => ({ default: m.MapPreview })),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-lg border border-stone-200 bg-stone-200"
        style={{ minHeight: 200 }}
        aria-hidden="true"
      />
    ),
  }
);
