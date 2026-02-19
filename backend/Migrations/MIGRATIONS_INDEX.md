# Index des migrations EF Core

Liste des migrations dans l’ordre d’application. À comparer avec la table `__EFMigrationsHistory` de chaque base pour savoir quelles migrations sont déjà appliquées.

| # | MigrationId | Description |
|---|------------|-------------|
| 1 | 20260126152307_InitialCreate | Schéma initial |
| 2 | 20260126204133_AddDeletedAtToDelivery | DeletedAt sur Delivery |
| 3 | 20260126210144_AddDeletedAtToOrder | DeletedAt sur Order |
| 4 | 20260127114012_AddAuthUsers | Table Users (auth) |
| 5 | 20260127123000_AddMissingDeletedAtToDelivery | DeletedAt manquant Delivery |
| 6 | 20260131000531_AddOrderDateToOrder | OrderDate sur Order |
| 7 | 20260131120000_AddPhoneAndCommentToOrder | PhoneNumber, InternalComment sur Order |
| 8 | 20260204004623_AddRouteAndRouteIdToDelivery | Route, RouteId sur Delivery |
| 9 | 20260204201825_AddSequenceToDelivery | Sequence sur Delivery |
| 10 | 20260215000000_AddHeadquartersToTenant | HeadquartersAddress, Lat, Lng sur Tenants |
| 11 | 20260215190346_AddLatLngToOrder | Lat, Lng sur Order (géocodage / Mapbox) |
| 12 | 20260216000000_AddPlannedStartAtToRoute | PlannedStartAt sur Route |
| 13 | 20260216120000_AddTenantIsochrones | Table TenantIsochrones (isochrones en JSONB) |

**Comment EF gère les versions**

- Il n’y a pas de fichier “version” à mettre à jour dans le projet.
- Chaque base a sa propre table `__EFMigrationsHistory` : c’est la seule source de vérité pour “quelles migrations sont appliquées sur cette base”.
- `ProductVersion` dans cette table = version du runtime EF Core (ex. 9.0.2) au moment de l’application de la migration. Ce n’est pas un numéro de schéma ; des lignes avec des ProductVersion différentes (ex. 9.0.0 et 9.0.2) sont normales.
- Le fichier `TracklyDbContextModelSnapshot.cs` décrit le **modèle actuel** (après toutes les migrations). Il est mis à jour quand on ajoute une nouvelle migration (`dotnet ef migrations add ...`).

**Vérifier l’état d’une base**

```sql
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

Comparer le résultat avec le tableau ci‑dessus pour voir quelles migrations manquent sur cette base.
