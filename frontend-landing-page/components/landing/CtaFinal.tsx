import Link from "next/link";
import { config, internalLinks } from "@/lib/config";

export function CtaFinal() {
  return (
    <section
      id="cta"
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="cta-title"
    >
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="flex justify-center md:order-2">
            <img
              src="/undraw_order-confirmed.svg"
              alt="Commencez avec Arrivo dès aujourd'hui"
              className="h-64 w-auto"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="text-center md:order-1 md:text-left">
            <h2
              id="cta-title"
              className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
            >
              Prêt à simplifier vos livraisons ?
            </h2>
            <p className="mt-4 text-stone-600 leading-relaxed">
              Essai gratuit, sans engagement. Démarrez en quelques minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4 md:items-start">
              <Link
                href={config.signupUrl}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
                aria-label="Essai gratuit"
              >
                Essai gratuit
              </Link>
              <Link
                href={internalLinks.pricing}
                className="inline-flex w-full items-center justify-center rounded-xl border-2 border-stone-300 bg-white px-6 py-3 text-base font-medium text-stone-700 transition-colors hover:border-teal-500 hover:bg-stone-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
                aria-label="Voir la tarification"
              >
                Voir la tarification
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
