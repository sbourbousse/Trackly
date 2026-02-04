import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-100 py-12" role="contentinfo">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600">
            Trackly — Gestion de livraisons pour TPE et artisans
          </p>
          <nav aria-label="Liens légaux et contact">
            <ul className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
              <li>
                <a
                  href="mailto:contact@trackly.fr"
                  className="font-semibold text-teal-600 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm underline underline-offset-2"
                  aria-label="Nous contacter par email"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-stone-600 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/cgu"
                  className="text-stone-600 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
                >
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-stone-600 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
                >
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
