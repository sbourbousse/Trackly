import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arrivo.fr";

export const metadata: Metadata = {
  title: "Mentions légales — Arrivo",
  description: "Mentions légales du site Arrivo. Éditeur, hébergeur, contact.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales">
      <p className="text-sm text-stone-500">
        Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).
      </p>

      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>Arrivo</strong> est édité par <strong>Arrivo</strong>, micro-entreprise.
      </p>
      <p>
        Contact : <a href="mailto:contact@arrivo.fr" className="text-teal-600 hover:text-teal-700 underline">contact@arrivo.fr</a>
      </p>

      <h2>Directeur de la publication</h2>
      <p>Arrivo.</p>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
      </p>
      <p>
        Le site Arrivo ne dépose aucun cookie ni traceur.
      </p>
    </LegalPageLayout>
  );
}
