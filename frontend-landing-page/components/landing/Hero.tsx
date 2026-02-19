import Link from "next/link";
import { config } from "@/lib/config";

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
          Arrivo : La livraison de proximité simplifiée pour tous.
        </h1>
        <p className="mt-4 text-lg text-stone-600 sm:text-xl">
          Gérez vos tournées, suivez vos colis et rassurez vos clients. Une
          solution fluide et sans engagement, pensée pour votre activité locale.
        </p>

        {/* Illustration Hero - Écosystème Arrivo */}
        <div className="mt-12 flex justify-center">
          <div className="relative w-full max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {/* Livreur */}
              <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-teal-50 to-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <img
                  src="/undraw_on-the-way.svg"
                  alt="Livreur utilisant l'application mobile Arrivo pour gérer ses tournées"
                  className="h-40 w-auto"
                  loading="lazy"
                  decoding="async"
                />
                <h3 className="mt-4 text-center text-lg font-semibold text-stone-900">
                  Pour le Livreur
                </h3>
                <p className="mt-2 text-center text-sm text-stone-600">
                  App mobile intuitive pour gérer les tournées et mettre à jour les statuts
                </p>
              </div>

              {/* Client */}
              <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-teal-50 to-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <img
                  src="/undraw_order-delivered.svg"
                  alt="Client suivant sa livraison en temps réel"
                  className="h-40 w-auto"
                  loading="lazy"
                  decoding="async"
                />
                <h3 className="mt-4 text-center text-lg font-semibold text-stone-900">
                  Pour le Client
                </h3>
                <p className="mt-2 text-center text-sm text-stone-600">
                  Suivi en temps réel et notifications à chaque étape
                </p>
              </div>

              {/* Business */}
              <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-teal-50 to-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <img
                  src="/undraw_data-reports.svg"
                  alt="Dashboard business pour gérer les livraisons et les statistiques"
                  className="h-40 w-auto"
                  loading="lazy"
                  decoding="async"
                />
                <h3 className="mt-4 text-center text-lg font-semibold text-stone-900">
                  Pour le Business
                </h3>
                <p className="mt-2 text-center text-sm text-stone-600">
                  Dashboard complet pour piloter vos livraisons et analyser vos performances
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={config.demoUrl}
            className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
            aria-label="Découvrir la démo"
          >
            Découvrir la démo
          </Link>
          <Link
            href={config.signupUrl}
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
