import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative py-20 sm:py-28"
      aria-labelledby="hero-title"
    >
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h1
          id="hero-title"
          className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl md:text-5xl"
        >
          La livraison de proximité, enfin simplifiée pour les commerçants.
        </h1>
        <p className="mt-4 text-lg text-stone-600 sm:text-xl">
          Gérez vos tournées et le suivi de vos colis en quelques clics. Sans
          engagement, sans surprise.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#cta"
            className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
            aria-label="Découvrir la démo"
          >
            Découvrir la démo
          </Link>
          <Link
            href="#cta"
            className="inline-flex w-full items-center justify-center rounded-xl border-2 border-stone-300 bg-white px-6 py-3 text-base font-medium text-stone-700 transition-colors hover:border-teal-500 hover:bg-stone-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
            aria-label="S'inscrire gratuitement"
          >
            S&apos;inscrire (Gratuit)
          </Link>
        </div>
        <p className="mt-5 text-sm text-stone-500" role="status">
          Déjà adopté par des fleuristes et artisans locaux.
        </p>
      </div>
    </section>
  );
}
