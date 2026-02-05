export function Trust() {
  return (
    <section
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="trust-title"
    >
      <div className="container mx-auto max-w-4xl px-4">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="text-center md:text-left">
            <h2
              id="trust-title"
              className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
            >
              Pensé pour les artisans et commerçants locaux
            </h2>
            <p className="mt-4 text-stone-600 leading-relaxed">
              Trackly a été conçu pour les TPE et les artisans qui veulent une
              solution de livraison simple et abordable, sans engagement long.
            </p>
            <ul className="mt-6 space-y-3 text-left">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  ✓
                </span>
                <span className="text-sm text-stone-700">
                  Configuration en moins de 5 minutes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  ✓
                </span>
                <span className="text-sm text-stone-700">
                  Sans engagement, résiliable à tout moment
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  ✓
                </span>
                <span className="text-sm text-stone-700">
                  Support dédié aux petites entreprises
                </span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center">
            <img
              src="/undraw_analysis.svg"
              alt="Analyse et statistiques pour commerçants locaux"
              className="h-64 w-auto"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
