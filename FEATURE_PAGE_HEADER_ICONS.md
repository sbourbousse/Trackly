# Feature: Ajouter des icônes aux titres de pages

## Description
Améliorer la navigation visuelle en ajoutant des icônes aux titres d'onglets et aux sections principales.

## Fichiers concernés
- `frontend-business/src/lib/components/PageHeader.svelte`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/drivers/+page.svelte`
- `frontend-business/src/routes/deliveries/routes/+page.svelte`

## Implémentation
- [ ] Modifier `PageHeader.svelte` pour accepter une prop `icon`
- [ ] Ajouter icône à `/dashboard` (LayoutDashboardIcon)
- [ ] Ajouter icône à `/orders` (PackageIcon)
- [ ] Ajouter icône à `/deliveries` (TruckIcon)
- [ ] Ajouter icône à `/drivers` (UsersIcon)
- [ ] Ajouter icône à `/map` (MapPinIcon)
- [ ] Ajouter icônes aux onglets du Dashboard

## Mapping des icônes
| Page | Icône | Code Lucide |
|------|-------|-------------|
| Dashboard | LayoutDashboardIcon | layout-dashboard |
| Commandes | PackageIcon | package |
| Livraisons | TruckIcon | truck |
| Livreurs | UsersIcon | users |
| Carte | MapPinIcon | map-pin |

## Source
Voir `docs/features-user-redacted/improvement-general.md`
