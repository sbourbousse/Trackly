"use client";

import {
  AppBusinessPreview,
  AppDriverPreview,
  AppTrackingPreview,
  MapPreview,
} from "@/components/previews";

const features = [
  {
    id: "tournees",
    title: "Dashboard Business",
    description:
      "Gérez vos tournées depuis le dashboard : planification, ordres et statuts en un seul endroit.",
    bentoClass: "md:col-span-2 md:row-span-1",
    Preview: AppBusinessPreview,
  },
  {
    id: "carte",
    title: "Carte & tournées",
    description:
      "Visualisez vos livraisons et livreurs sur la carte en temps réel.",
    bentoClass: "md:col-span-1",
    Preview: MapPreview,
  },
  {
    id: "suivi",
    title: "Suivi temps réel",
    description:
      "Page de suivi pour vos clients : ils voient où en est leur colis en temps réel.",
    bentoClass: "md:col-span-1",
    Preview: AppTrackingPreview,
  },
  {
    id: "app-chauffeur",
    title: "App chauffeur",
    description:
      "PWA pour vos livreurs : réception des tournées et mise à jour des statuts sur le terrain.",
    bentoClass: "md:col-span-1",
    Preview: AppDriverPreview,
  },
];

export function Features() {
  return (
    <section
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="features-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <h2
          id="features-title"
          className="text-center text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          Tout ce dont vous avez besoin
        </h2>
        <div className="mt-12 grid auto-rows-fr gap-4 sm:gap-6 md:grid-cols-3 md:grid-rows-2">
          {features.map((feature) => {
            const Preview = feature.Preview;
            return (
              <article
                key={feature.id}
                className={`rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-teal-50/20 p-6 shadow-sm ${feature.bentoClass}`}
              >
                <h3 className="text-lg font-semibold text-stone-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 min-h-[120px]">
                  <Preview />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
