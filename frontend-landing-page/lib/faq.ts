/**
 * Données FAQ pour la landing page (contenu + schéma SEO)
 */
export const faqItems = [
  {
    question: "Qu'est-ce qu'Arrivo ?",
    answer:
      "Arrivo est un logiciel de gestion de livraisons et de tournées pour TPE et artisans. Il permet de planifier les tournées, suivre les colis en temps réel et offrir à vos clients une page de suivi sans avoir besoin d'une app.",
  },
  {
    question: "Comment suivre un colis en temps réel ?",
    answer:
      "Chaque livraison dispose d'un lien de suivi unique que vous pouvez envoyer à votre client. Il ouvre une page web sur laquelle le client voit la position du livreur et les étapes (en préparation, en cours, livré).",
  },
  {
    question: "Faut-il une application pour les livreurs ?",
    answer:
      "Oui. Arrivo fournit une application web (PWA) dédiée aux livreurs : ils reçoivent leurs tournées, mettent à jour les statuts et peuvent être géolocalisés sur la carte. Aucune installation depuis un store n'est obligatoire.",
  },
  {
    question: "Quel est le prix ?",
    answer:
      "Le plan Starter est gratuit (environ 20 à 25 livraisons par mois, sans carte bancaire). Un plan Pro est prévu pour plus de volume, avec notifications SMS et support prioritaire.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer:
      "Oui. Aucun engagement : vous pouvez arrêter votre utilisation à tout moment. Les données restent exportables.",
  },
] as const;
