import Link from "next/link";
import { config } from "@/lib/config";

export function Pricing() {
  return (
    <section
      id="tarification"
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="pricing-title"
    >
      <div className="container mx-auto max-w-4xl px-4">
        <h2
          id="pricing-title"
          className="text-center text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          Une tarification transparente
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <article className="rounded-xl border-2 border-teal-600 bg-gradient-to-br from-white to-stone-50/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900">Starter</h3>
            <p className="mt-2 text-2xl font-bold text-stone-900">Gratuit</p>
            <p className="mt-2 text-sm text-stone-600">
              20–25 livraisons par mois. <strong>Aucune carte bancaire</strong> requise.
            </p>
            <Link
              href={config.signupUrl}
              className="mt-6 inline-flex w-full justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              aria-label="Démarrer avec le plan Starter"
            >
              Démarrer
            </Link>
          </article>
          <article className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900">Pro</h3>
            <p className="mt-2 text-2xl font-bold text-stone-700">
              ~20 €/mois
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Inclus les notifications SMS et le support prioritaire. Plus de livraisons incluses.
            </p>
            <span
              className="mt-6 inline-flex w-full justify-center rounded-xl border border-stone-300 bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-500 cursor-not-allowed"
              aria-disabled="true"
            >
              Bientôt disponible
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}
