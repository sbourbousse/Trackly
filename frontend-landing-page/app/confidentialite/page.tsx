import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arrivo.pro";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Arrivo",
  description: "Politique de confidentialité et protection des données personnelles (RGPD) du service Arrivo.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <LegalPageLayout title="Politique de confidentialité">
      <p className="text-sm text-stone-500">
        Cette politique décrit la manière dont Arrivo traite vos données personnelles au titre du Règlement (UE) 2016/679 (RGPD) et de la loi « informatique et libertés ».
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        <strong>Arrivo</strong> (micro-entreprise). Contact : <a href="mailto:contact@arrivo.pro" className="text-teal-600 hover:text-teal-700 underline">contact@arrivo.pro</a>.
      </p>

      <h2>Finalités et bases légales</h2>
      <p>
        Les données sont traitées pour : la création et la gestion de votre compte, la fourniture du service Arrivo (gestion de livraisons, tournées, suivi), le support client et le respect des obligations légales. Les bases légales sont l’exécution du contrat, l’intérêt légitime et, le cas échéant, une obligation légale.
      </p>

      <h2>Données concernées</h2>
      <p>
        Données d’identification (nom, prénom, email, adresse), données de connexion et d’usage du service (compte, tournées, livraisons, données de localisation liées au suivi). Aucun cookie ni traceur n’est déposé sur le site Arrivo.
      </p>

      <h2>Durées de conservation</h2>
      <p>
        Données de compte : durée du compte actif puis 3 ans après clôture pour les obligations légales. Données de connexion et logs : 12 mois. Données nécessaires à l’établissement de preuves : durée des prescriptions légales.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <p>
        Les données sont hébergées et traitées par des sous-traitants qui en garantissent la sécurité et la confidentialité : <strong>Vercel</strong> (hébergement du site), <strong>Railway</strong> (hébergement du backend et des bases de données du service). Des mesures appropriées (clauses contractuelles types, garanties) sont mises en œuvre en cas de traitement ou transfert hors de l’EEE.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de limitation du traitement et de portabilité de vos données. Pour les exercer : <a href="mailto:contact@arrivo.pro" className="text-teal-600 hover:text-teal-700 underline">contact@arrivo.pro</a>. Vous pouvez introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">www.cnil.fr</a>).
      </p>
    </LegalPageLayout>
  );
}
