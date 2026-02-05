const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trackly.fr";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Trackly",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Trackly — Gestion de livraisons et tournées pour TPE et artisans. Simple, abordable, sans engagement.",
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Trackly",
  url: SITE_URL,
  description:
    "Gestion de livraisons pour TPE et artisans. Tournées, suivi colis en temps réel, app chauffeur.",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Trackly",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "SaaS de gestion de livraisons pour TPE et artisans : dashboard tournées, app chauffeur PWA, suivi client en temps réel.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
};

const jsonLd = [
  { ...organization, "@id": `${SITE_URL}/#organization` },
  { ...website, publisher: { "@id": `${SITE_URL}/#organization` } },
  softwareApplication,
];

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
