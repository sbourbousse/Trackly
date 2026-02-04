import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-stone-50/95 backdrop-blur supports-[backdrop-filter]:bg-stone-50/80">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold text-stone-900 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
          aria-label="Trackly — Accueil"
        >
          Trackly
        </Link>
        <nav aria-label="Navigation principale">
          <Link
            href="#tarification"
            className="text-sm font-medium text-stone-600 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
          >
            Tarifs
          </Link>
        </nav>
      </div>
    </header>
  );
}
