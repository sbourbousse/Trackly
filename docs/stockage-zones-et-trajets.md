# Stockage des zones isochrones et des trajets (PostgreSQL)

Ce document décrit le stockage en base PostgreSQL des **zones isochrones** (déjà implémenté) et le schéma proposé pour les **géométries d’itinéraires** (trajets) à venir.

---

## Pourquoi PostgreSQL / JSONB

- **PostgreSQL** est déjà utilisé (Npgsql + EF Core).
- **JSONB** permet de stocker des géométries (coordonnées) sans extension PostGIS :
  - Pas de dépendance à PostGIS (compatibilité Railway, hébergeurs standards).
  - Indexation et requêtes possibles si besoin (opérateurs `@>`, `?`, etc.).
  - Format lisible et interopérable (GeoJSON-like : tableaux `[lng, lat]`).
- Pour des requêtes spatiales avancées (point dans polygone, intersection, etc.), on pourra ajouter **PostGIS** plus tard et migrer les colonnes JSONB vers `geometry(Polygon)` / `geometry(LineString)`.

---

## Zones isochrones (implémenté)

### Table `TenantIsochrones`

| Colonne          | Type        | Description                                      |
|-----------------|-------------|--------------------------------------------------|
| `Id`            | `uuid`      | Clé primaire                                     |
| `TenantId`      | `uuid`      | Tenant (siège social)                            |
| `Minutes`       | `integer`   | Durée du contour en minutes (ex. 10, 20, 30)     |
| `CoordinatesJson` | `jsonb`   | Polygone : tableau de points `[[lng, lat], ...]` |
| `CreatedAt`     | `timestamptz` | Création                                       |

- **Index unique** : `(TenantId, Minutes)` — un seul contour par durée par tenant.
- **Enregistrement** : à la sauvegarde du siège social (`PUT /api/tenants/me/headquarters`), si Stadia Maps est configuré, les isochrones 10, 20, 30 min sont **calculés et insérés** (anciens contours du tenant supprimés). C’est le **seul** moment où le calcul est fait.
- **Lecture** : `GET /api/tenants/me/isochrones` renvoie **uniquement** les contours stockés en base. Aucun appel API : si rien n’est enregistré, contours vides + message invitant à enregistrer le siège social.

### Entité C#

- `Trackly.Backend.Features.Tenants.TenantIsochrone`
- `TracklyDbContext.TenantIsochrones`

---

## Trajets / itinéraires (proposition pour plus tard)

Objectif : persister la géométrie des itinéraires (polylignes) pour éviter de rappeler Stadia à chaque affichage et pour historique.

### Option A : Table dédiée `RouteGeometries`

| Colonne        | Type        | Description                                      |
|----------------|-------------|--------------------------------------------------|
| `Id`           | `uuid`      | Clé primaire                                     |
| `RouteId`      | `uuid`      | FK vers `Routes`                                 |
| `GeometryJson` | `jsonb`     | Polyligne globale `[[lng, lat], ...]`           |
| `LegsJson`     | `jsonb`     | (Optionnel) Segments par étape pour couleurs     |
| `CreatedAt`    | `timestamptz` | Création                                      |

- **Index** : `RouteId` (unique) pour une géométrie par tournée.
- **Enregistrement** : après calcul de l’itinéraire (ex. à la première demande de `route-geometry` ou à la création/validation de la tournée), sauvegarder la géométrie.
- **Lecture** : `GET /api/routes/{routeId}/route-geometry` lit d’abord la table ; si vide, appel Stadia puis sauvegarde.

### Option B : Colonnes sur `Routes`

Ajouter sur la table `Routes` :

- `GeometryJson` (`jsonb`, nullable) : polyligne globale.
- `LegsJson` (`jsonb`, nullable) : legs par étape.

Plus simple (pas de jointure), adapté si une seule géométrie par tournée et pas d’historique des versions.

### Format JSONB recommandé pour une polyligne

- **Polyligne** : `[[lng1, lat1], [lng2, lat2], ...]` (aligné avec l’API et le frontend).
- **Legs** (optionnel) : `[{ "fromIndex": 0, "toIndex": 1, "coordinates": [[lng, lat], ...] }, ...]`.

---

## Migration

- **Isochrones** : migration `20260216120000_AddTenantIsochrones` crée la table `TenantIsochrones` avec colonne `CoordinatesJson` en `jsonb` et index unique `(TenantId, Minutes)`.
- **Trajets** : à créer au moment de l’implémentation (table `RouteGeometries` ou colonnes sur `Routes`).

---

## Fichiers concernés (isochrones)

| Fichier | Rôle |
|--------|------|
| `backend/Features/Tenants/TenantIsochrone.cs` | Entité isochrone |
| `backend/Infrastructure/Data/TracklyDbContext.cs` | DbSet + config JSONB et index |
| `backend/Program.cs` | PUT headquarters (calcul + sauvegarde isochrones), GET isochrones (lecture BDD puis fallback API) |
| `backend/Migrations/20260216120000_AddTenantIsochrones.cs` | Migration création table |
