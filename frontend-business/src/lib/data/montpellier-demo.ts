/**
 * Dataset de démo pour Trackly — Adresses réelles de Montpellier
 * 
 * Usage: Importer ce fichier CSV dans la page /orders/import
 * 
 * Format: client, adresse, telephone, commentaire, date
 */

export const MONTPELLIER_DEMO_DATA = `
Nom,Adresse,Téléphone,Commentaire,Date
Jean Dupont,1 Place de la Comédie 34000 Montpellier,+33 6 12 34 56 78,Livraison avant 18h,15/02/2026
Marie Martin,25 Rue Foch 34000 Montpellier,+33 6 23 45 67 89,Appeler avant d'arriver,15/02/2026
Pierre Bernard,8 Avenue de la Liberté 34000 Montpellier,+33 6 34 56 78 90,Code porte: 1234,15/02/2026
Sophie Petit,42 Rue de l'Université 34000 Montpellier,+33 6 45 67 89 01,Étage 3 sans ascenseur,16/02/2026
Lucas Moreau,15 Boulevard Louis Blanc 34000 Montpellier,+33 6 56 78 90 12,Livraison après 14h,16/02/2026
Emma Robert,3 Rue de la Loge 34000 Montpellier,+33 6 67 89 01 23,Boutique côté place,16/02/2026
Thomas Richard,67 Avenue de Toulouse 34000 Montpellier,+33 6 78 90 12 34,Garage à droite,17/02/2026
Camille Durand,12 Rue de l'Aiguillerie 34000 Montpellier,+33 6 89 01 23 45,Appeler le client,17/02/2026
Louis Dubois,89 Rue de la République 34000 Montpellier,+33 6 90 12 34 56,Entrée par l'arrière,17/02/2026
Chloé Lambert,34 Rue Saint-Guilhem 34000 Montpellier,+33 6 01 23 45 67,Laisser chez le voisin si absent,18/02/2026
Hugo Simon,56 Rue du Plan d'Agde 34000 Montpellier,+33 6 12 34 56 79,Immeuble Le Phare,18/02/2026
Inès Michel,78 Avenue du Pirée 34000 Montpellier,+33 6 23 45 67 90,Code: 5678,18/02/2026
Nathan Garcia,23 Rue des Étuves 34000 Montpellier,+33 6 34 56 78 91,Bureau 203 2ème étage,19/02/2026
Léa Roux,45 Rue de l'Ancien Courrier 34000 Montpellier,+33 6 45 67 89 02,Entreprise Horaires 9h-17h,19/02/2026
Théo Fontaine,90 Rue de l'Engrenage 34000 Montpellier,+33 6 56 78 90 13,Livraison urgente,19/02/2026
Manon Sanchez,7 Rue de l'Argenterie 34000 Montpellier,+33 6 67 89 01 24,Passage étroit camionnette,20/02/2026
Antoine Gauthier,31 Rue de l'Université 34000 Montpellier,+33 6 78 90 12 35,Fermé le weekend,20/02/2026
Sarah Perrin,65 Rue de l'Aiguillerie 34000 Montpellier,+33 6 89 01 23 46,Reçu par Mme Dupont,20/02/2026
Alexandre Mercier,14 Rue de l'Obélisque 34000 Montpellier,+33 6 90 12 34 57,Zone piétonne,21/02/2026
Julie Blanc,38 Rue Foch 34000 Montpellier,+33 6 01 23 45 68,Magasin fermé 12h-14h,21/02/2026
`.trim();

/**
 * Génère un fichier CSV téléchargeable
 */
export function downloadDemoCSV(): void {
  const blob = new Blob([MONTPELLIER_DEMO_DATA], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'trackly-demo-montpellier.csv';
  link.click();
}

/**
 * Retourne les données parsées pour usage programmatique
 */
export function getDemoData(): Array<{
  customerName: string;
  address: string;
  phoneNumber: string;
  internalComment: string;
  orderDate: string;
}> {
  const lines = MONTPELLIER_DEMO_DATA.split('\n').slice(1); // Skip header
  return lines.map(line => {
    const [customerName, address, phoneNumber, internalComment, orderDate] = line.split(',');
    return {
      customerName: customerName?.trim() || '',
      address: address?.trim() || '',
      phoneNumber: phoneNumber?.trim() || '',
      internalComment: internalComment?.trim() || '',
      orderDate: orderDate?.trim() || '',
    };
  }).filter(row => row.customerName && row.address);
}
