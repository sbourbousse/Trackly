# Project Log - Journal des Modifications

> **Usage** : Résumé de ce qui a été fait après chaque tâche complétée.
> Format : Date | Tâche | Fichiers modifiés | Notes

## 2026-02-04 | Suppression de la colonne ETA non fonctionnelle

**Tâche** : Supprimer la colonne ETA (Estimated Time of Arrival) qui affichait une valeur hardcodée "11:40" sans fonctionnalité réelle.

**Fichiers modifiés** :
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – Suppression du champ `eta` des types `DeliveryRoute` et `DeliveryStop`
- `frontend-business/src/routes/dashboard/+page.svelte` – Suppression de la colonne ETA des tableaux "Tournées prévues" et "En cours"
- `frontend-business/src/routes/deliveries/+page.svelte` – Suppression de la colonne ETA du tableau des livraisons

**Notes** : La colonne ETA n'était pas calculée et affichait une valeur statique. L'API backend ne fournit pas cette information. La colonne pourra être réintroduite ultérieurement si un calcul d'ETA réel est implémenté.

---

## 2026-02-04 | Indicateur visuel d'urgence des dates de commande

**Tâche** : Ajouter un indicateur visuel pour les dates de commande avec codes couleur selon l'urgence et tooltip avec temps relatif.

**Fichiers créés** :
- `frontend-business/src/lib/components/OrderDateIndicator.svelte` – Composant d'affichage des dates avec indicateur d'urgence

**Fichiers modifiés** :
- `frontend-business/src/routes/orders/+page.svelte` – Utilisation du composant OrderDateIndicator dans le tableau des commandes
- `frontend-business/src/routes/orders/[id]/+page.svelte` – Utilisation du composant dans la page de détail de commande
- `frontend-business/src/routes/dashboard/+page.svelte` – Utilisation du composant dans le tableau de bord

**Fonctionnalités** :
- **Rouge** : Date dépassée (retard)
- **Jaune** : Moins de 30 minutes restantes (urgent)
- **Orange** : Entre 30 minutes et 2 heures (bientôt)
- **Gris** : Plus de 2 heures (normal)
- **Tooltip au hover** : Affiche le temps relatif en français (ex: "En retard de 2 heures", "Dans 15 minutes", "Demain", etc.)

**Notes** : Le composant utilise les composants UI Tooltip existants avec un délai de 200ms. Les calculs sont réactifs et se mettent à jour automatiquement grâce à `$derived`.

---

## 2026-02-04 | Entité Tournée (Route) en base

**Tâche** : Créer une vraie entité Tournée (Route) en base pour distinguer plusieurs tournées le même jour et gérer correctement les tournées de nuit.

**Backend** :
- Nouvelle entité `Route` : Id, TenantId, DriverId, Name (optionnel), CreatedAt, DeletedAt
- `Delivery.RouteId` (FK nullable) ; migration `AddRouteAndRouteIdToDelivery`
- `CreateDeliveriesBatch` crée une Route puis N Deliveries avec le même RouteId ; requête accepte `Name` optionnel
- Nouveau endpoint `GET /api/routes` (filtres dateFrom, dateTo, driverId) ; `GET /api/deliveries` accepte `routeId`
- DTOs : RouteResponse, RouteListResponse ; DeliveryResponse inclut RouteId

**Frontend** :
- API `getRoutes(filters)` et `DeliveriesListFilters.routeId` ; `createDeliveriesBatch` envoie `name`
- Page Tournées (`/deliveries/routes`) utilise GET /api/routes au lieu du regroupement client
- Lien « Voir les livraisons » vers `/deliveries?routeId=...` ; page Livraisons charge avec filtre routeId
- Formulaire Créer tournée : champ « Nom de la tournée (optionnel) » renvoyé à l’API
- Mode offline : mockRoutesApi, getMockRoutes, createMockDeliveries avec name et routeId

**Notes** : Chaque création de tournée = 1 Route + N Deliveries. Les tournées de nuit (une seule Route) ne sont plus coupées par minuit.

---

## 2026-02-04 | Livraisons vs Tournées – Navigation et liste des tournées

**Tâche** : Clarifier la distinction Livraisons (liste des livraisons) / Tournées (regroupement chauffeur + date). Renommer la page actuelle « Tournées » en « Livraisons » et ajouter une interface dédiée listant les tournées.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/AppSidebar.svelte` – Catégorie « Livraison » avec sous-éléments : Livraisons (/deliveries), Tournées (/deliveries/routes), Créer tournée
- `frontend-business/src/routes/deliveries/+page.svelte` – Titre et libellés « Livraisons », filtre optionnel `driverId` + `date` (URL) pour détail tournée
- `frontend-business/src/routes/dashboard/+page.svelte` – Onglet et cartes « Livraisons » (prévues / en cours)
- `frontend-business/src/lib/components/TopNav.svelte` – Lien « Livraisons »
- `frontend-business/src/lib/components/OrdersChartContent.svelte` – Libellé « Livraisons » pour variant delivery
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – Message d’erreur « livraisons »

**Fichiers créés** :
- `frontend-business/src/routes/deliveries/routes/+page.svelte` – Page « Tournées » : liste regroupée par chauffeur et date, lien « Voir les livraisons » vers /deliveries?driverId=…&date=…

**Notes** : Une tournée reste un regroupement logique (pas d’entité en base). La page /deliveries affiche une ligne par livraison ; /deliveries/routes affiche une ligne par groupe (driverId + date) avec nombre d’arrêts et statut agrégé.

---

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
