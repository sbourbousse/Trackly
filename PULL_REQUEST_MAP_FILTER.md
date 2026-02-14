# 🗺️ Feature: Filtrer la carte par statut

## Description
Permet à l'utilisateur de masquer ou afficher les marqueurs sur la carte en fonction du statut des commandes/livraisons.

## Changements

### Nouveaux fichiers
- `frontend-business/src/lib/stores/mapFilters.svelte.ts` - Store réactif avec persistance localStorage
- `frontend-business/src/lib/components/map/MapFilters.svelte` - Composant UI des filtres

### Fichiers modifiés
- `frontend-business/src/routes/map/+page.svelte` - Intégration des filtres et filtrage des marqueurs

## Fonctionnalités

### Filtres de statut
| Type | Statuts |
|------|---------|
| **Commandes** | En attente, Prévue, En cours, Livrée, Annulée |
| **Tournées** | En attente, En cours, Terminée, Échouée |
| **Livreurs** | Toggle on/off |

### Actions
- **Tout afficher** - Active tous les filtres
- **Aucun** - Désactive tous les filtres  
- **Réinitialiser** - Retour aux valeurs par défaut

### UX
- Badges colorés cliquables avec indicateur visuel (👁️ visible / masqué)
- Persistance des préférences dans localStorage
- Interface compacte en overlay sur la carte

## Screenshots
Voir commentaires sur la PR

## Test
1. Aller sur la page `/map`
2. Cliquer sur les badges de statut pour masquer/afficher
3. Vérifier que les marqueurs disparaissent/réapparaissent
4. Rafraîchir la page - les préférences sont conservées

---

**Source:** `docs/features-user-redacted/improvement-map.md`
