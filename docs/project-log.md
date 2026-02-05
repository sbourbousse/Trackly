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

## 2026-02-04 | Implémentation détail tournée : progress bar, ETA, tri livraisons

**Tâche** : Implémenter l’interface de détail d’une tournée avec progress bar (X/Y livrées), tracking temps réel et tri des livraisons (spec [docs/tournee-detail-tracking-eta.md](tournee-detail-tracking-eta.md)).

**Backend** :
- `Delivery.Sequence` (int?) ajouté ; migration `AddSequenceToDelivery`. Création batch : Sequence = 0, 1, 2…
- `DeliveryResponse` et `DeliveryDetailResponse` : champ `Sequence` exposé.
- GET `/api/deliveries` avec `routeId` : tri par `Sequence` puis `CreatedAt`.
- GET `/api/routes/{id}` : détail tournée + livraisons ordonnées par Sequence (DTOs `RouteDetailResponse`, `DeliveryInRouteResponse`).
- PATCH `/api/routes/{routeId}/deliveries/order` : body `{ "deliveryIds": ["guid", ...] }`, met à jour `Sequence` 0, 1, 2…

**Frontend** :
- API : `getRoute(routeId)`, `reorderRouteDeliveries(routeId, deliveryIds)` ; types `ApiRouteDetail`, `ApiDeliveryInRoute`.
- Composant `RouteProgressBar.svelte` : X/Y livrées, barre de progression (style App chauffeur landing).
- Page `/deliveries/routes/[routeId]` : en-tête, progress bar, liste livraisons (ordre + statut + client + adresse), boutons Monter/Descendre pour réordonner, tracking SignalR + carte si livraison en cours.
- Liste tournées : lien « Détail » vers `/deliveries/routes/[id]`, lien « Livraisons » vers `/deliveries?routeId=…`.
- Store deliveries : ETA affiché = « Arrêt N » si `sequence` présent, sinon « – ».
- Mode offline : `getMockRouteDetail`, `reorderMockRouteDeliveries` ; mock données avec `sequence`.

**À faire** : Appliquer la migration en base (`dotnet ef database update` ou script de déploiement).

---

## 2026-02-04 | App chauffeur : progress bar, ordre des arrêts, routeId/sequence

**Tâche** : Aligner l’app driver (frontend-driver) avec la tournée, la progress bar (X/Y livrées) et l’ordre des arrêts (sequence).

**Backend** :
- `DeliveryDetailResponse` : ajout de `RouteId` (pour que le chauffeur puisse charger le détail de la tournée et afficher la progress).
- GET `/api/deliveries` : filtre optionnel **`driverId`** ; tri par `RouteId` puis `Sequence` quand `driverId` ou `routeId` est fourni (app chauffeur = ses livraisons ordonnées par tournée et arrêt).

**Frontend-driver** :
- **API** : `ApiDelivery` et `ApiDeliveryDetail` avec `routeId` et `sequence`. `getDeliveries(driverId?)` envoie `driverId` en query pour ne récupérer que les livraisons du chauffeur. Nouveau module **`lib/api/routes.ts`** avec `getRoute(routeId)` pour le détail tournée (progress X/Y).
- **Page Liste (Deliveries.svelte)** : progress bar « X / Y livrées » en haut ; tri des livraisons par `routeId` puis `sequence` ; libellé « Arrêt N » par livraison quand `sequence` présent.
- **Page Détail (DeliveryDetail.svelte)** : si la livraison a un `routeId`, appel à `getRoute(routeId)` et affichage d’une progress bar « X / Y livrées » + « Arrêt N sur M » ; titre du type « Arrêt 3 / 5 — Livraison XXX ».
- **Mode offline** : mock données avec `routeId`, `sequence`, `createdAt` ; `getMockRouteDetail(routeId)` ; `mockRoutesApi.getRoute(routeId)`.

---

## 2026-02-04 | Spec détail tournée : progress bar, ETA, tri livraisons

**Tâche** : Rassembler le minimum pour une interface de détail d’une tournée avec progress bar (X/Y livrées), ETA temps réel du chauffeur et tri de l’ordre des livraisons.

**Document créé** : [docs/tournee-detail-tracking-eta.md](tournee-detail-tracking-eta.md)

**Contenu** :
- Objectif : page détail tournée avec progress bar (style App chauffeur landing), liste ordonnée des livraisons, tracking SignalR, tri des arrêts.
- Backend (minimum) : champ `Sequence` sur `Delivery`, GET `/api/routes/{id}` (détail + livraisons ordonnées), PATCH reorder (`/api/routes/{routeId}/deliveries/order`).
- Frontend (minimum) : page `/deliveries/routes/[routeId]`, composant progress bar réutilisable, liste livraisons par Sequence, tracking pour la livraison en cours, boutons ou drag-and-drop pour réordonner.
- ETA : option simple = « Arrêt N/M » ; option avancée = champ ou calcul ETA (après MVP).

**Référence** : Lazy component App chauffeur (`frontend-landing-page/components/previews/AppDriverPreview.tsx`).

---

## 2026-02-04 | Landing page : aperçus d’apps, couleurs partagées, carte en image

**Tâche** : Améliorer la landing avec des bouts de chaque application (surtout business), partager les couleurs avec le reste du projet et exporter des composants lazy ; carte en image.

**Frontend-landing-page** :
- **Design tokens** : `lib/design-tokens.css` avec variables `--trackly-stone-*` et `--trackly-teal-*` alignées avec frontend-business (stone + teal). Import dans `app/globals.css`.
- **Composants preview (lazy)** : `components/previews/` — `AppBusinessPreview` (dashboard : onglets, tableau, badges), `AppDriverPreview` (PWA chauffeur), `AppTrackingPreview` (suivi client), `MapPreview` (image statique). Chargés via `next/dynamic` avec `ssr: false` et skeleton de chargement.
- **Carte** : image statique `public/map-preview.svg` (grille + pins teal/stone). Remplaçable par une capture d’écran réelle.
- **Section Features** : 4 cartes (Dashboard Business, Carte & tournées, Suivi temps réel, App chauffeur) utilisant ces previews lazy.

**Docs** : `frontend-landing-page/docs/DESIGN_SYSTEM.md` mis à jour (tokens partagés, aperçus lazy, carte en image).

---

## 2026-02-04 | Landing page Trackly (frontend-landing-page)

**Tâche** : Ajout d’une landing page optimisée SEO pour présenter Trackly et acquérir des leads.

**Dossier** : `frontend-landing-page/` (projet Next.js 14+ App Router, React/TypeScript).

**Contenu** :
- Sections : Hero, Problème/Solution, Fonctionnalités (Bento Grid), Tarification (Starter / Pro), Preuve/confiance, CTA final, Footer
- SEO : meta (title, description 150–160 car.), Open Graph, Twitter Card, JSON-LD (Organization, WebSite, SoftwareApplication), URL canonique `/`
- Design : Tailwind CSS + shadcn/ui, thème stone + teal, cohérent avec le reste du projet
- Documentation interne : `frontend-landing-page/docs/` (PROJECT_CONTEXT, SEO_STRATEGY, DESIGN_SYSTEM, ARCHITECTURE, CONTENT_LANDING, MVP_SCOPE)

**Référence** : Voir [docs/LANDING-PAGE-PROMPT.md](LANDING-PAGE-PROMPT.md) pour le prompt et les exigences SEO d’origine.

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

## 2026-02-05 | Création de l'application cliente de suivi (frontend-tracking)

**Tâche** : Créer une application Next.js moderne pour le suivi des livraisons par les clients finaux.

**Dossier créé** : `frontend-tracking/` (projet Next.js 15 + App Router, React 18, TypeScript)

**Contenu** :
- **Stack** : Next.js 15 (App Router), React 18, Tailwind CSS, Framer Motion, React Leaflet
- **Pages** : 
  - `/` : Page d'accueil avec présentation des fonctionnalités
  - `/track/[id]` : Page de suivi dynamique avec carte, infos et actions
- **Fonctionnalités clés** :
  - Rafraîchissement automatique toutes les 30 secondes via `useAutoRefresh` hook
  - Carte interactive avec React Leaflet et OpenStreetMap
  - Informations détaillées de livraison (client, adresse, livreur, statut)
  - Boutons d'action rapide : "Appeler le livreur" (tel:) et "Contacter le commerçant" (mailto: / WhatsApp)
  - Animations fluides avec Framer Motion
  - Design moderne et responsive (mobile-first)
  - Logo Trackly intégré subtilement dans le header
- **Design System** : Design tokens partagés (stone + teal) avec frontend-business et frontend-landing-page
- **API Client** : Client HTTP avec gestion d'erreurs et types TypeScript
- **Composants** :
  - `TrackingHeader` : En-tête avec logo
  - `DeliveryMap` : Carte Leaflet (chargée dynamiquement, pas de SSR)
  - `DeliveryInfo` : Informations de livraison
  - `StatusBadge` : Badge de statut animé
  - `ActionButtons` : Boutons d'action (tel: / mailto: / wa.me/)
  - `LoadingSpinner` : Spinner animé
  - `ErrorMessage` : Gestion des erreurs
- **Documentation** : 
  - `README.md` : Vue d'ensemble
  - `QUICKSTART.md` : Installation et démarrage rapide
  - `docs/ARCHITECTURE.md` : Architecture détaillée
  - `docs/INTEGRATION.md` : Guide d'intégration complet

**Endpoints API utilisés** :
- `GET /api/deliveries/{id}` : Détails complets de la livraison
- `GET /api/deliveries/{id}/tracking` : Statut de tracking (optionnel, public)

**Configuration** :
- Port : 3004 (pour ne pas entrer en conflit avec les autres frontends)
- Variable d'env : `NEXT_PUBLIC_API_URL` (URL du backend)
- Build : Standalone output pour déploiement optimisé

**À faire** :
- Tester le build et le démarrage
- Intégrer une vraie API de géocodage (Nominatim ou Google Maps)
- Ajouter SignalR pour le tracking GPS en temps réel
- Rendre dynamiques les numéros de téléphone et emails
- Déployer sur Vercel ou Railway

**Notes** : Application ultra-légère et performante, optimisée pour mobile. Design cohérent avec le reste de l'écosystème Trackly grâce aux design tokens partagés.

---

## 2026-02-05 | Endpoint public de tracking et configuration CORS production

**Tâche** : Créer un endpoint public pour l'application cliente et documenter la configuration CORS pour Railway.

**Backend** :
- Nouvel endpoint PUBLIC `/api/public/deliveries/{id}/tracking` (mappé AVANT TenantMiddleware)
- Méthode `GetPublicTracking` dans `DeliveryEndpoints.cs` utilisant `IgnoreQueryFilters()`
- Retourne : status, customerName, address, driverName, driverPhone, sequence, completedAt
- Pas besoin d'authentification tenant (accessible aux clients finaux)

**Frontend-tracking** :
- Modification de `lib/api/deliveries.ts` pour utiliser l'endpoint public
- URL changée : `/api/deliveries/{id}` → `/api/public/deliveries/{id}/tracking`

**Documentation** :
- Nouveau fichier `docs/CORS-PRODUCTION.md` : guide complet de configuration CORS pour Railway
- Syntaxe variables d'environnement : `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc.
- Exemples de configuration pour tous les frontends
- Section troubleshooting et bonnes pratiques de sécurité
- Mise à jour de `RAILWAY-QUICK-START.md` avec les variables CORS

**Configuration CORS production** (Railway) :
```bash
Cors__AllowedOrigins__0=https://trackly.app           # Frontend Tracking
Cors__AllowedOrigins__1=https://app.trackly.app       # Frontend Business
Cors__AllowedOrigins__2=https://driver.trackly.app    # Frontend Driver
Cors__AllowedOrigins__3=https://www.trackly.app       # Landing Page
```

**Notes** : L'endpoint public permet aux clients finaux de suivre leur livraison sans authentification. Les informations sensibles (TenantId, détails internes) ne sont pas exposées.

---

## 2026-02-05 | Intégration Railway et GitHub Actions pour frontend-tracking

**Tâche** : Configurer le déploiement automatique du frontend-tracking sur Railway via GitHub Actions.

**Fichiers créés** :
- `frontend-tracking/Dockerfile` : Build Next.js standalone optimisé pour production
- `frontend-tracking/railway.json` : Configuration Railway (builder Dockerfile)
- `frontend-tracking/.dockerignore` : Exclusions Docker
- `frontend-tracking/DEPLOYMENT.md` : Guide complet de déploiement

**GitHub Actions** :
- `.github/workflows/ghcr.yml` : Ajout du service `frontend-tracking` dans la matrice de build
  - Build image : `ghcr.io/<owner>/trackly-frontend-tracking:latest`
  - Déclencheurs : push main, PR, workflow_dispatch
  - Cache : GitHub Actions cache pour accélérer les builds
- `.github/workflows/railway-redeploy.yml` : Ajout step redeploy frontend-tracking
  - Secret requis : `RAILWAY_SERVICE_ID_FRONTEND_TRACKING`
  - Redéploiement automatique après build GHCR réussi

**Configuration Tailwind** :
- `tailwind.config.ts` : Passage des variables CSS aux valeurs hexadécimales directes
- Ajout safelist pour classes générées dynamiquement (bg-teal-100, text-teal-700, etc.)
- Correction couleurs Stone, Teal, Green, Red pour badges de statut

**Composant carte** :
- `components/DeliveryMap.tsx` : Réécriture avec API Leaflet native (sans react-leaflet)
- Utilisation de useEffect + useRef pour contrôle total du cycle de vie
- Résolution erreur "Map container is already initialized" (React Strict Mode)
- Import dynamique de Leaflet pour SSR Next.js

**Documentation** :
- `RAILWAY-QUICK-START.md` : Section frontend-tracking ajoutée
- Variables d'environnement Railway documentées
- Configuration secrets GitHub pour auto-redeploy
- Ordre de déploiement des 4 services

**Variables d'environnement Railway** :
```bash
NEXT_PUBLIC_API_URL=https://api.trackly.app
NODE_ENV=production
PORT=3004
```

**Secrets GitHub requis** :
- `RAILWAY_API_TOKEN` : Token personnel Railway
- `RAILWAY_ENVIRONMENT_ID` : ID environnement
- `RAILWAY_SERVICE_ID_BACKEND`
- `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS`
- `RAILWAY_SERVICE_ID_FRONTEND_DRIVER`
- `RAILWAY_SERVICE_ID_FRONTEND_TRACKING` ← Nouveau

**Workflow déploiement** :
1. Push sur `main` → Build images GHCR (4 services)
2. Build réussi → Redeploy Railway automatique (4 services)
3. Railway pull images et redémarre
4. Applications en ligne

**Notes** : Le frontend-tracking est maintenant complètement intégré au pipeline CI/CD. Chaque push sur main déclenche le build et le déploiement automatique sur Railway.

---

_Continuer à documenter les modifications importantes au fur et à mesure..._
