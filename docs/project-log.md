# Project Log - Journal des Modifications

> **Usage** : Résumé de ce qui a été fait après chaque tâche complétée.
> Format : Date | Tâche | Fichiers modifiés | Notes

## 2026-01-26 | Mise en place structure Agent-First

**Tâche** : Création de la structure de fichiers "Agent-First" pour maximiser l'autonomie des agents IA.

**Fichiers créés** :
- `.cursor/rules/dotnet-9.mdc` - Règles spécifiques .NET 9
- `.cursor/rules/svelte-5.mdc` - Règles Svelte 5 Runes
- `.cursor/rules/global-context.mdc` - Contexte business et multi-tenancy
- `.windsurfrules` - Règles pour Windsurf
- `docs/current-sprint.md` - Contexte de session
- `docs/decision-log.md` - Log des décisions techniques
- `docs/architecture-map.md` - Schéma des services et flux
- `project-roadmap.md` - Vision long terme et étapes MVP
- `todo.md` - Liste de tâches atomiques
- `docs/project-log.md` - Ce fichier

**Notes** : Structure complète mise en place selon les standards "Agent-First" pour 2026. Les agents IA peuvent maintenant travailler de manière autonome avec un contexte clair et des règles explicites.

---

## 2026-01-26 | Initialisation backend .NET 9

**Tâche** : Création du projet backend ASP.NET Core Minimal APIs.

**Fichiers créés** :
- `backend/Program.cs`
- `backend/Trackly.Backend.csproj`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`
- `backend/Properties/launchSettings.json`

**Dossiers créés** :
- `frontend-business/`
- `frontend-driver/`
- `frontend-tracking/`
- `shared/`

**Notes** : Projet backend initialisé avec .NET 9 pour servir de base au monolithe modulaire, avec structure monorepo en place.

---

## 2026-01-26 | Base EF Core et multi-tenant

**Tâche** : Configuration PostgreSQL + EF Core et fondations multi-tenant.

**Fichiers créés** :
- `backend/Infrastructure/MultiTenancy/ITenantIsolated.cs`
- `backend/Infrastructure/MultiTenancy/TenantContext.cs`
- `backend/Infrastructure/MultiTenancy/TenantMiddleware.cs`
- `backend/Infrastructure/Data/TracklyDbContext.cs`
- `backend/Features/Tenants/Tenant.cs`
- `backend/Features/Orders/Order.cs`
- `backend/Features/Deliveries/Delivery.cs`
- `backend/Features/Drivers/Driver.cs`

**Fichiers modifiés** :
- `backend/Program.cs`
- `backend/Trackly.Backend.csproj`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`

**Notes** : EF Core 9 + Npgsql configurés, avec filtre global automatique sur `TenantId`.

---

## 2026-01-26 | Endpoints API et quota Starter

**Tâche** : Exposition des endpoints orders/deliveries avec validation quota.

**Fichiers créés** :
- `backend/Features/Billing/IBillingService.cs`
- `backend/Features/Billing/BillingService.cs`
- `backend/Features/Orders/OrderDtos.cs`
- `backend/Features/Orders/OrderEndpoints.cs`
- `backend/Features/Deliveries/DeliveryDtos.cs`
- `backend/Features/Deliveries/DeliveryEndpoints.cs`

**Fichiers modifiés** :
- `backend/Program.cs`
- `backend/Features/Orders/Order.cs`
- `backend/Features/Deliveries/Delivery.cs`

**Notes** : Quota mensuel appliqué au plan Starter, enums JSON exposés en string.

---

## 2026-01-26 | Migration initiale et seed dev

**Tâche** : Génération de la migration EF Core et seed de données de base.

**Fichiers créés** :
- `.config/dotnet-tools.json`
- `backend/Infrastructure/Data/TracklyDbContextFactory.cs`
- `backend/Infrastructure/Data/SeedData.cs`
- `backend/Migrations/20260126152307_InitialCreate.cs`
- `backend/Migrations/20260126152307_InitialCreate.Designer.cs`
- `backend/Migrations/TracklyDbContextModelSnapshot.cs`

**Fichiers modifiés** :
- `backend/Program.cs`

**Notes** : Le seed s'exécute en développement au démarrage (après `MigrateAsync`).

---

## 2026-01-26 | Gitignore et test migration

**Tâche** : Ajout du `.gitignore` et tentative de démarrage + migration.

**Fichiers créés** :
- `.gitignore`

**Notes** : Le démarrage de l'API et `database update` échouent si PostgreSQL n'est pas démarré (connexion refusée sur `localhost:5432`).

---

## 2026-01-26 | Création DB et migration appliquée

**Tâche** : Création utilisateur/base PostgreSQL et application des migrations.

**Notes** : Rôle `trackly` créé, bases `trackly` et `trackly_dev` créées, migration initiale appliquée avec succès.

---

## 2026-01-26 | Frontend Business initialisé

**Tâche** : Initialisation du frontend Business (SvelteKit) et premier écran dashboard.

**Fichiers modifiés** :
- `frontend-business/README.md`
- `frontend-business/src/app.css`
- `frontend-business/src/app.html`
- `frontend-business/src/routes/+layout.svelte`
- `frontend-business/src/routes/+page.svelte`

**Notes** : Mise en place d'un layout simple et de cartes KPI mockees pour demarrer la suite.

---

## 2026-01-26 | Pages login + dashboard

**Tâche** : Ajout des pages `/login` et `/dashboard` avec redirection racine.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/+page.svelte`
- `frontend-business/src/routes/+page.server.ts`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/login/+page.svelte`

**Notes** : UI login minimal et dashboard disponible sous `/dashboard`.

---

## 2026-01-26 | Pages commandes + tournees

**Tâche** : Ajout des pages `/orders` et `/deliveries` avec navigation commune.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/lib/components/TopNav.svelte`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`

**Notes** : Pages liste avec tableaux et actions mockees pour continuer le flux.

---

## 2026-01-26 | Import commandes

**Tâche** : Ajout de la page `/orders/import` pour l import CSV et plugins.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/orders/import/+page.svelte`

**Notes** : Flux d import mocke, CTA et etapes visibles.

---

## 2026-01-26 | Detail tournee

**Tâche** : Ajout de la page `/deliveries/[id]` avec carte mockee et liste d arrets.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`

**Notes** : Carte simulée pour le suivi chauffeur et tableau des arrets.

---

## 2026-01-26 | Etat global (stores)

**Tâche** : Mise en place des stores Svelte 5 pour auth, commandes et tournees.

**Fichiers modifiés** :
- `frontend-business/src/lib/stores/auth.svelte.ts`
- `frontend-business/src/lib/stores/orders.svelte.ts`
- `frontend-business/src/lib/stores/deliveries.svelte.ts`
- `frontend-business/src/routes/login/+page.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`

**Notes** : Donnees mockees stockees dans les stores, prêtes pour brancher l API.

---

## 2026-01-26 | Client HTTP API

**Tâche** : Configuration du client HTTP et endpoints de base pour orders/deliveries.

**Fichiers modifiés** :
- `frontend-business/src/lib/api/client.ts`
- `frontend-business/src/lib/api/orders.ts`
- `frontend-business/src/lib/api/deliveries.ts`
- `frontend-business/src/lib/stores/orders.svelte.ts`
- `frontend-business/src/lib/stores/deliveries.svelte.ts`
- `frontend-business/src/routes/orders/+page.svelte`

**Notes** : Appels API disponibles, avec fallback silencieux en mode demo.

---

## 2026-01-26 | Client SignalR

**Tâche** : Ajout du client SignalR pour le suivi temps reel chauffeur.

**Fichiers modifiés** :
- `frontend-business/src/lib/realtime/tracking.svelte.ts`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`
- `frontend-business/src/app.css`

**Notes** : Connexion auto sur detail tournee, affichage position si disponible.

---

## 2026-01-26 | Chargement auto API

**Tâche** : Lancement automatique des appels API sur listes commandes et tournees.

**Fichiers modifiés** :
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`

**Notes** : Les listes se mettent a jour si le backend est accessible.

---

## 2026-02-01 | Mise à jour todo et instructions manuelles

**Tâche** : Alignement du todo sur l’état réel du projet et ajout des instructions manuelles prioritaires.

**Fichiers modifiés** :
- `todo.md`

**Notes** :
- SignalR backend et frontend driver marqués comme réalisés (TrackingHub, ITrackingClient, PWA, pages, GPS, client SignalR).
- Nouvelle section « Instructions manuelles importantes » avec tâches à développer : allègement en-têtes (commandes/tournées), bug tooltips relatifs, bug plage « aujourd’hui », module date tournées, graphique interactif par statut, import CSV nouveaux champs, dataset Montpellier.

---

_Continuer à documenter les modifications importantes au fur et à mesure..._
