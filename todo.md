# Todo.md - Liste de Tâches Atomiques

> **Best Practice** : Ne jamais donner une tâche floue. Découper en micro-étapes.
> 
> **Workflow** :
> 1. Phase de Planning : L'IA met à jour ce fichier à partir d'une demande en langage naturel
> 2. Phase d'Exécution : "Implémente la prochaine tâche du todo.md"
> 3. Phase de Synchro : À la fin, cocher la case et résumer dans `docs/project-log.md`

## Backend .NET 9

### Infrastructure
- [ ] Initialiser projet .NET 9 ASP.NET Core (Minimal APIs)
- [ ] Configurer PostgreSQL avec EF Core
- [ ] Créer interface `ITenantIsolated` avec propriété `TenantId`
- [ ] Implémenter Global Query Filters sur `TenantId` dans DbContext
- [ ] Créer middleware pour extraction `TenantId` depuis JWT/Header
- [ ] Injecter `TenantId` dans HttpContext pour utilisation dans services

### Domaines
- [ ] Créer entité `Tenant` (Id, Name, SubscriptionPlan, CreatedAt)
- [ ] Créer entité `Order` implémentant `ITenantIsolated` (Id, TenantId, CustomerName, Address, Status)
- [ ] Créer entité `Delivery` implémentant `ITenantIsolated` (Id, TenantId, OrderId, DriverId, Status, CompletedAt)
- [ ] Créer entité `Driver` implémentant `ITenantIsolated` (Id, TenantId, Name, Phone)
- [ ] Créer DbContext avec Global Query Filters

### API Endpoints
- [ ] Endpoint POST `/api/orders` (création commande avec vérification quota)
- [ ] Endpoint GET `/api/orders` (liste commandes filtrée par TenantId)
- [ ] Endpoint POST `/api/deliveries` (création livraison)
- [ ] Endpoint PATCH `/api/deliveries/{id}/complete` (validation livraison)
- [ ] Endpoint GET `/api/deliveries/{id}/tracking` (suivi livraison)

### SignalR
- [ ] Créer interface `ITrackingClient` (méthodes typées)
- [ ] Créer Hub `TrackingHub : Hub<ITrackingClient>`
- [ ] Implémenter méthode `UpdateLocation(latitude, longitude)` dans Hub
- [ ] Configurer CORS pour SignalR
- [ ] Broadcast position GPS à tous les clients connectés

### Intégrations
- [ ] Configurer Stripe Billing (clés API, webhooks)
- [ ] Créer service `BillingService` pour vérification quotas
- [ ] Implémenter logique quota 20-25 livraisons/mois (Starter)
- [ ] Configurer Twilio/Vonage pour SMS
- [ ] Créer service `SmsService` pour envoi notifications
- [ ] Configurer Google Maps API pour géocodage

## Frontend Business (SvelteKit)

### Setup
- [ ] Initialiser projet SvelteKit
- [ ] Configurer Svelte 5 avec Runes
- [ ] Installer shadcn-svelte ou Tailwind CSS
- [ ] Configurer client HTTP (fetch/axios) pour appels API
- [ ] Configurer client SignalR pour temps réel

### Pages
- [ ] Page `/login` (authentification)
- [ ] Page `/dashboard` (vue d'ensemble)
- [ ] Page `/orders` (liste commandes)
- [ ] Page `/orders/import` (import CSV/manuel)
- [ ] Page `/deliveries` (liste tournées)
- [ ] Page `/deliveries/[id]` (détail tournée avec carte)

### État Global
- [ ] Créer `stores/auth.svelte.ts` avec `$state` pour utilisateur connecté
- [ ] Créer `stores/orders.svelte.ts` avec `$state` pour liste commandes
- [ ] Créer `stores/deliveries.svelte.ts` avec `$state` pour tournées

## Frontend Driver (PWA)

### Setup
- [ ] Initialiser projet Svelte 5 PWA
- [ ] Configurer manifest.json pour PWA
- [ ] Configurer service worker pour mode offline basique
- [ ] Demander permission géolocalisation native
- [ ] Configurer client SignalR

### Pages
- [ ] Page `/login` (connexion livreur)
- [ ] Page `/deliveries` (liste livraisons du jour)
- [ ] Page `/deliveries/[id]` (détail livraison avec validation)
- [ ] Composant bouton validation (grand, contrasté)

### Géolocalisation
- [ ] Créer service `gps.svelte.ts` avec `$state` pour position
- [ ] Envoyer position GPS au Hub SignalR toutes les 5 secondes
- [ ] Afficher position actuelle sur carte

## Frontend Tracking

### Setup
- [ ] Initialiser projet Svelte minimal
- [ ] Optimiser bundle (< 50kb compressé)
- [ ] Configurer client SignalR léger
- [ ] Page unique `/tracking/[deliveryId]`

### Fonctionnalités
- [ ] Afficher carte avec position livreur
- [ ] Recevoir mises à jour position via SignalR
- [ ] Animer mouvement livreur sur carte
- [ ] Afficher statut livraison (en cours, livré, etc.)

## Shared Types

- [ ] Configurer NSwag ou TypeGen
- [ ] Générer types TypeScript depuis DTOs C#
- [ ] Exporter types dans `shared/`
- [ ] Importer types dans tous les frontends

---

## Tâches Complétées

_À déplacer ici après complétion avec date et résumé_
