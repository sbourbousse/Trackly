# Feature: Filtrer la carte par statut

## Description
Permettre à l'utilisateur de masquer ou afficher les marqueurs sur la carte en fonction du statut des commandes/livraisons.

## Fichiers concernés
- `frontend-business/src/routes/deliveries/routes/+page.svelte`
- `frontend-business/src/lib/components/map/MapFilters.svelte` (nouveau)
- `frontend-business/src/lib/stores/mapFilters.svelte.ts` (nouveau)

## Implémentation
- [ ] Ajouter une barre de filtres au-dessus de la carte
- [ ] Créer des badges cliquables pour chaque statut
- [ ] Implémenter le toggle actif/inactif
- [ ] Sauvegarder les préférences dans localStorage
- [ ] Filtrer les marqueurs en temps réel

## Statuts concernés
- En attente / Pending
- Prévue / Planned
- En cours / In Transit
- Livrée / Delivered
- Annulée / Cancelled

## Source
Voir `docs/features-user-redacted/improvement-map.md`
