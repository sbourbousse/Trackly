import Link from "next/link";

export function CtaFinal() {
  return (
    <section
      id="cta"
      className="border-t border-stone-200 py-16 sm:py-20"
      aria-labelledby="cta-title"
    >
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2
          id="cta-title"
          className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
        >
          Prêt à simplifier vos livraisons ?
        </h2>
        <p className="mt-4 text-stone-600">
          Essai gratuit, sans engagement. Démarrez en quelques minutes.
        </p>
        <div className="mt-8">
          <Link
            href="#cta"
            className="inline-flex items-center justify-center rounded-sm bg-teal-600 px-6 py-3 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            aria-label="Essai gratuit"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </section>
  );
}
