import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arrivo.fr";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Arrivo",
  description: "Conditions générales d'utilisation du site et du service Arrivo (gestion de livraisons).",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/cgu" },
};

export default function CguPage() {
  return (
    <LegalPageLayout title="Conditions générales d'utilisation">
      <p className="text-sm text-stone-500">
        Les présentes CGU régissent l’accès et l’utilisation du site et du service Arrivo. En créant un compte ou en utilisant le service, vous acceptez ces conditions.
      </p>

      <h2>Objet</h2>
      <p>
        Arrivo est un service de gestion de livraisons et de tournées destiné aux TPE et artisans : planification des tournées, suivi des colis en temps réel, application chauffeur, page de suivi pour les clients.
      </p>

      <h2>Acceptation</h2>
      <p>
        L’utilisation du site et du service après inscription vaut acceptation des présentes CGU. Si vous n’acceptez pas ces conditions, n’utilisez pas le service.
      </p>

      <h2>Offre</h2>
      <p>
        Arrivo est en version bêta et propose actuellement une offre entièrement gratuite.
      </p>

      <h2>Obligations de l’utilisateur</h2>
      <p>
        Vous vous engagez à utiliser le service de manière conforme à son objet, à ne pas altérer le service ni en détourner l’usage, et à fournir des informations exactes. Vous êtes responsable de la confidentialité de vos identifiants.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La marque Arrivo, le site et le service (logiciel, contenus, interfaces) sont protégés par le droit de la propriété intellectuelle. Aucune cession de droits n’est opérée au profit des utilisateurs au-delà de l’usage du service conformément aux présentes CGU.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Arrivo s’efforce d’assurer la disponibilité et la sécurité du service. Sa responsabilité est limitée aux dommages directs et prévisibles imputables à une faute prouvée dans la fourniture du service. Elle ne peut être tenue responsable des dommages indirects (perte de données, perte de chiffre d’affaires, etc.) sauf en cas de faute lourde.
      </p>

      <h2>Résiliation</h2>
      <p>
        Vous pouvez fermer votre compte à tout moment depuis l’interface ou en nous contactant. Arrivo se réserve le droit de suspendre ou résilier un compte en cas de manquement aux présentes CGU. Les dispositions relatives à la sortie des données seront communiquées en cas de clôture.
      </p>

      <h2>Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
      </p>

      <h2>Médiation</h2>
      <p>
        Conformément aux dispositions applicables au professionnel, en cas de litige le client peut recourir à un médiateur de la consommation. Le médiateur sera indiqué ultérieurement.
      </p>

      <p className="mt-10 text-sm text-stone-500">
        Contact : <a href="mailto:contact@arrivo.fr" className="text-teal-600 hover:text-teal-700 underline">contact@arrivo.fr</a>.
      </p>
    </LegalPageLayout>
  );
}
