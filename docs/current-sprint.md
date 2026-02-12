# Sprint Actuel - Contexte de Session

> **Usage** : Avant de commencer une session, l'IA doit lire ce fichier pour comprendre où on en est.

## Objectif du Jour
Demarrer le frontend Business et poser les premiers ecrans.

## Fichiers Modifiés Récemment
- `.gitignore`
- `backend/Program.cs`
- `backend/Trackly.Backend.csproj`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`
- `backend/Infrastructure/Data/TracklyDbContext.cs`
- `backend/Infrastructure/Data/TracklyDbContextFactory.cs`
- `backend/Infrastructure/Data/SeedData.cs`
- `backend/Infrastructure/MultiTenancy/ITenantIsolated.cs`
- `backend/Infrastructure/MultiTenancy/TenantContext.cs`
- `backend/Infrastructure/MultiTenancy/TenantMiddleware.cs`
- `backend/Features/Billing/IBillingService.cs`
- `backend/Features/Billing/BillingService.cs`
- `backend/Features/Tenants/Tenant.cs`
- `backend/Features/Orders/Order.cs`
- `backend/Features/Orders/OrderDtos.cs`
- `backend/Features/Orders/OrderEndpoints.cs`
- `backend/Features/Deliveries/Delivery.cs`
- `backend/Features/Deliveries/DeliveryDtos.cs`
- `backend/Features/Deliveries/DeliveryEndpoints.cs`
- `backend/Features/Drivers/Driver.cs`
- `backend/Migrations/20260126152307_InitialCreate.cs`
- `backend/Migrations/20260126152307_InitialCreate.Designer.cs`
- `backend/Migrations/TracklyDbContextModelSnapshot.cs`
- `.config/dotnet-tools.json`
- `frontend-business/README.md`
- `frontend-business/src/app.css`
- `frontend-business/src/app.html`
- `frontend-business/src/routes/+layout.svelte`
- `frontend-business/src/routes/+page.svelte`
- `frontend-business/src/routes/+page.server.ts`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/login/+page.svelte`
- `frontend-business/src/lib/components/TopNav.svelte`
- `frontend-business/src/lib/components/DemoBanner.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/orders/import/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`
- `frontend-business/src/lib/stores/auth.svelte.ts`
- `frontend-business/src/lib/stores/orders.svelte.ts`
- `frontend-business/src/lib/stores/deliveries.svelte.ts`
- `frontend-business/src/lib/stores/offline.svelte.ts` (nouveau - 2026-02-12)
- `frontend-business/src/lib/api/client.ts`
- `frontend-business/src/lib/api/orders.ts`
- `frontend-business/src/lib/api/deliveries.ts`
- `frontend-business/src/lib/offline/config.ts`
- `frontend-business/src/lib/realtime/tracking.svelte.ts`
- `docs/decision-log.md`
- `docs/project-log.md`
- `docs/current-sprint.md`
- `DEMO_MODE_FIX.md` (nouveau - 2026-02-12)

## Prochain Blocage Attendu
Aucun blocage identifié.

## État Actuel du Projet
- [x] Backend .NET 9 initialisé
- [x] Frontend Business (SvelteKit) initialisé
- [ ] Frontend Driver (PWA) initialisé
- [ ] Frontend Tracking initialisé
- [ ] Base de données PostgreSQL configurée
- [ ] Isolation multi-tenant implémentée
- [ ] SignalR Hub configuré
- [ ] Intégration Stripe configurée
- [ ] Intégration SMS (Twilio/Vonage) configurée

## Notes de Session
- EF Core + Npgsql configurés pour PostgreSQL.
- Middleware tenant en place avec filtre global.
- Endpoints orders/deliveries exposés avec quota Starter.
- Migration initiale générée, seed dev ajouté.
- Rôle `trackly` + bases `trackly`/`trackly_dev` créés, migration appliquée.
- API démarrée après création de la base.
- Frontend Business scaffold SvelteKit + ecran dashboard de base.
- Pages login + dashboard en place, redirection racine.
- Pages commandes et tournees ajoutees avec navigation.
- Page import commandes ajoutee.
- Detail tournee avec carte mockee.
- Etat global en place pour auth, commandes et tournees.
- Client HTTP ajoute et actions de refresh API.
- Client SignalR ajoute pour suivi temps reel.
- Chargement auto des donnees API sur listes.
- (2026-02-12) Mode démo corrigé : bouton "Mode demo" active maintenant correctement le mode offline avec DEMO_TENANT_ID et affiche les données de démonstration. Store réactif `offline.svelte.ts` créé pour gérer l'état du mode offline.
- (2026-02-12) Dates des données de démo rendues cohérentes : les commandes et livraisons sont maintenant réparties entre J-7 et J+7 avec des statuts logiques (Delivered/Completed pour le passé, InDelivery/InProgress pour aujourd'hui, Pending pour le futur). Plusieurs tournées générées dynamiquement selon les dates.
- (2026-02-12) Filtres de calendrier en mode démo : les fonctions mock respectent maintenant les filtres `dateFrom`, `dateTo`, `driverId`, `routeId`, et `search`. Les stats sont générées dynamiquement selon les données filtrées.
- (2026-02-12) Affichage de temps relatif unifié : création du composant `RelativeTimeIndicator.svelte` pour afficher le temps relatif (ex: "Dans 2h", "Il y a 3j") avec code couleur selon l'urgence (rouge/jaune/orange/gris). Date complète dans tooltip. Appliqué dans nouvelle tournée, liste des livraisons, dashboard et toutes les pages de commandes.
- (2026-02-12) Nombre de livraisons et visualisation de progression : ajout du `deliveryCount` dans les commandes (backend + frontend) avec badge orange si = 0. Création de `RouteProgressIndicator` pour visualiser l'état des tournées avec icônes colorées (✓ vert, ◉ bleu, ✗ rouge, ○ gris avec opacité). Remplacement de la colonne "Date" des tournées par la colonne "Progression". Backend mis à jour pour inclure `DeliveryStatusSummary` dans `RouteResponse`.
