const trades = [
  {
    title: "Fleuristes & Traiteurs",
    description:
      "Rassurez vos clients sur la fraîcheur avec le suivi en direct.",
    illustration: "/undraw_order-confirmed.svg",
    illustrationAlt: "Commande confirmée pour fleuristes et traiteurs",
  },
  {
    title: "Commerces de bouche",
    description:
      "Optimisez vos tournées quotidiennes et gagnez du temps.",
    illustration: "/undraw_on-the-way.svg",
    illustrationAlt: "Livraison en cours pour commerces de bouche",
  },
  {
    title: "Artisans",
    description:
      "Sécurisez vos livraisons avec preuve photo et signature électronique.",
    illustration: "/undraw_delivery-address.svg",
    illustrationAlt: "Livraison sécurisée pour artisans",
  },
];

export function ProblemSolution() {
  return (
    <section
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="by-trade-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <h2
          id="by-trade-title"
          className="text-center text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          Par métier
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600 sm:text-lg">
          Une solution qui s&apos;adapte à votre activité.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trades.map((trade) => (
            <article
              key={trade.title}
              className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/80 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex justify-center">
                <img
                  src={trade.illustration}
                  alt={trade.illustrationAlt}
                  className="h-32 w-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-stone-900">
                {trade.title}
              </h3>
              <p className="mt-2 text-center text-sm text-stone-600 leading-relaxed">
                {trade.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
