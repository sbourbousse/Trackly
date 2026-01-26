# Sprint Actuel - Contexte de Session

> **Usage** : Avant de commencer une session, l'IA doit lire ce fichier pour comprendre où on en est.

## Objectif du Jour
Démarrer l'API et tester l'application des migrations.

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

## Prochain Blocage Attendu
Aucun blocage identifié.

## État Actuel du Projet
- [x] Backend .NET 9 initialisé
- [ ] Frontend Business (SvelteKit) initialisé
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
