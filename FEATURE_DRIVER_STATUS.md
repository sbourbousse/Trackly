# Feature: Indicateur de Statut des Chauffeurs

## Description
Ajouter des indicateurs visuels pour le statut des chauffeurs (en ligne, en livraison, disponible, hors ligne).

## Fichiers concernés
- `frontend-business/src/routes/drivers/+page.svelte`
- `frontend-business/src/lib/components/DriverStatusBadge.svelte` (nouveau)
- `frontend-business/src/lib/components/DriverCard.svelte` (nouveau/modifié)
- `frontend-business/src/lib/types/driver.ts` (nouveau)

## Implémentation
- [ ] Définir les statuts de chauffeur :
  - `online` - En ligne (vert)
  - `delivering` - En livraison (orange)
  - `available` - Disponible (bleu)
  - `offline` - Hors ligne (gris)
- [ ] Créer le composant `DriverStatusBadge` avec couleurs
- [ ] Ajouter l'indicateur dans la liste des chauffeurs
- [ ] Afficher le statut dans la carte des chauffeurs
- [ ] Mettre à jour en temps réel via SignalR (futur)

## Design des badges
| Statut | Couleur | Icône |
|--------|---------|-------|
| En ligne | Vert (green-500) | Circle |
| En livraison | Orange (orange-500) | Truck |
| Disponible | Bleu (blue-500) | CheckCircle |
| Hors ligne | Gris (gray-400) | CircleOff |

## Mock Data
Pour la démo, utiliser des statuts aléatoires ou prédéfinis.

## Source
Feature demandée pour améliorer la visibilité des chauffeurs en temps réel.
