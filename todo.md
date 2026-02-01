# Todo.md - Liste de Tâches Atomiques

> **Best Practice** : Ne jamais donner une tâche floue. Découper en micro-étapes.
> 
> **Workflow** :
> 1. Phase de Planning : L'IA met à jour ce fichier à partir d'une demande en langage naturel
> 2. Phase d'Exécution : "Implémente la prochaine tâche du todo.md"
> 3. Phase de Synchro : À la fin, cocher la case et résumer dans `docs/project-log.md`

## Backend .NET 9

### Infrastructure
- [x] Initialiser projet .NET 9 ASP.NET Core (Minimal APIs)
- [x] Configurer PostgreSQL avec EF Core
- [x] Créer interface `ITenantIsolated` avec propriété `TenantId`
- [x] Implémenter Global Query Filters sur `TenantId` dans DbContext
- [x] Créer middleware pour extraction `TenantId` depuis JWT/Header
- [x] Injecter `TenantId` dans HttpContext pour utilisation dans services
- [x] Créer migration initiale EF Core
- [x] Ajouter seed de données (dev)

### Domaines
- [x] Créer entité `Tenant` (Id, Name, SubscriptionPlan, CreatedAt)
- [x] Créer entité `Order` implémentant `ITenantIsolated` (Id, TenantId, CustomerName, Address, Status)
- [x] Créer entité `Delivery` implémentant `ITenantIsolated` (Id, TenantId, OrderId, DriverId, Status, CompletedAt)
- [x] Créer entité `Driver` implémentant `ITenantIsolated` (Id, TenantId, Name, Phone)
- [x] Créer DbContext avec Global Query Filters

### API Endpoints
- [x] Endpoint POST `/api/orders` (création commande avec vérification quota)
- [x] Endpoint GET `/api/orders` (liste commandes filtrée par TenantId)
- [x] Endpoint POST `/api/deliveries` (création livraison)
- [x] Endpoint PATCH `/api/deliveries/{id}/complete` (validation livraison)
- [x] Endpoint GET `/api/deliveries/{id}/tracking` (suivi livraison)

### SignalR
- [x] Créer interface `ITrackingClient` (méthodes typées)
- [x] Créer Hub `TrackingHub : Hub<ITrackingClient>`
- [x] Implémenter méthode `UpdateLocation(latitude, longitude)` dans Hub
- [x] Configurer CORS pour SignalR
- [x] Broadcast position GPS à tous les clients connectés (groupe livraison)

### Intégrations
- [ ] Configurer Stripe Billing (clés API, webhooks)
- [x] Créer service `BillingService` pour vérification quotas
- [x] Implémenter logique quota 20-25 livraisons/mois (Starter)
- [ ] Configurer Twilio/Vonage pour SMS
- [ ] Créer service `SmsService` pour envoi notifications
- [ ] Configurer Google Maps API pour géocodage

## Frontend Business (SvelteKit)

### Setup
- [x] Initialiser projet SvelteKit
- [x] Configurer Svelte 5 avec Runes
- [x] Installer shadcn-svelte ou Tailwind CSS (thème stone + teal, Inter, radius small)
- [x] Configurer client HTTP (fetch/axios) pour appels API
- [x] Configurer client SignalR pour temps réel

### Pages
- [x] Page `/login` (authentification)
- [x] Page `/dashboard` (vue d'ensemble)
- [x] Page `/orders` (liste commandes)
- [x] Page `/orders/import` (import CSV/manuel)
- [x] Page `/deliveries` (liste tournées)
- [x] Page `/deliveries/[id]` (détail tournée avec carte)

### État Global
- [x] Créer `stores/auth.svelte.ts` avec `$state` pour utilisateur connecté
- [x] Créer `stores/orders.svelte.ts` avec `$state` pour liste commandes
- [x] Créer `stores/deliveries.svelte.ts` avec `$state` pour tournées

## Frontend Driver (PWA)

### Setup
- [x] Initialiser projet Svelte 5 PWA
- [x] Configurer manifest.json pour PWA
- [x] Configurer service worker pour mode offline basique
- [ ] Demander permission géolocalisation native
- [x] Configurer client SignalR

### Pages
- [x] Page `/login` (connexion livreur)
- [x] Page `/deliveries` (liste livraisons du jour)
- [x] Page `/deliveries/[id]` (détail livraison avec validation)
- [ ] Composant bouton validation (grand, contrasté)

### Géolocalisation
- [x] Créer service `gps.svelte.ts` avec `$state` pour position
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

## Instructions manuelles importantes (à développer prochainement)

Tâches prioritaires définies par le product owner. À traiter dans l’ordre ou selon la priorité du sprint.

### UI – Alléger les en-têtes de tableaux
- [ ] **Liste des commandes** : Retirer l’action « Importer CSV » et le champ de recherche de l’en-tête du tableau. Ces actions ne seront accessibles que via la barre de navigation (sidebar).
- [ ] **Liste des tournées** : Retirer l’action « Nouvelle tournée » et le champ « Filtrer par chauffeur » de l’en-tête du tableau. Accessibles uniquement via la barre de nav.

### Bug – Temps relatifs dans les tooltips du graphique
- [ ] Corriger l’inversion des libellés relatifs dans les tooltips (ex. « Demain » affiché pour la journée d’hier). Vérifier `getRelativeDateLabel` / `daysDiff` dans `frontend-business/src/lib/utils/relativeDate.ts` (signe ou ordre des arguments).

### Bug – Plage « Aujourd’hui » affiche 2 jours
- [ ] Quand on sélectionne la date du jour, deux jours s’affichent (veille incluse). Cause probable : `orders?dateFrom=...&dateTo=...` avec conversion UTC (ex. `2026-02-01T23:00:00.000Z` / `2026-02-02T22:59:59.999Z`). À corriger côté serveur (interprétation des dates en timezone tenant ou envoi de dates en local/date-only) pour que « aujourd’hui » = un seul jour.

### Module date pour les tournées
- [ ] Faire en sorte que le module de date concerne les **tournées** (et non plus seulement les commandes). Remplacer « Commandes par jour » par « Tournées par jour » dans le libellé.
- [ ] Conserver les deux options de filtre : **Date création** (date de création de la delivery) et **Date commande** (date de la commande). Adapter la query côté serveur pour la liste/statistiques des tournées (filtrer sur `Delivery.CreatedAt` ou `Order.OrderDate` selon le filtre).

### Graphique interactif (planificateur)
- [ ] Rendre le graphique interactif : au clic sur un segment (statut de commande), filtrer l’affichage du tableau en dessous sur ce type/statut de commande.
- [ ] Afficher un indicateur discret indiquant que le tableau est filtré par un statut.
- [ ] Dans le graphique, indiquer visuellement par un jeu d’opacité la partie (segment) correspondant au statut filtré.

### Import CSV
- [ ] Mettre à jour l’import de commandes (CSV + mapping vers l’API) pour inclure les **nouveaux champs** : téléphone (`phoneNumber`) et commentaire interne (`internalComment`). Adapter le parser CSV et le mapping dans `orders/import` pour envoyer ces champs.

### Données de démo
- [ ] Créer un **dataset cohérent de commandes** sur la ville de **Montpellier** (adresses réalistes, répartition géographique et temporelle cohérente pour tests et démos).

---

## Tâches Complétées

- 2026-01-26 | Frontend Business | Projet SvelteKit minimal + layout base.
- SignalR backend (TrackingHub, ITrackingClient, UpdateLocation, CORS, MapHub).
- Frontend Driver : projet PWA, pages Login/Deliveries/Detail, client SignalR, service GPS.
- Frontend Business : filtre par date (DateFilterCard), graphique commandes par jour/heure/mois (OrdersChartContent), tooltips relatifs (relativeDate.ts), champs Order OrderDate, PhoneNumber, InternalComment (backend + frontend formulaire détail/nouvelle commande).
