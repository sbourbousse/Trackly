# Statut Produit - Trackly

Date: 2026-01-29
Sources: `docs/current-sprint.md`, `docs/project-log.md`, `project-roadmap.md`, `todo.md`, `frontend-driver/README.md`

## Fonctionnalites faites (Fini)

### Backend
- API Minimal .NET 9 operationnelle (auth, orders, deliveries, drivers)
- Multi-tenancy (TenantId + Global Query Filters + middleware)
- Base PostgreSQL + EF Core + migrations + seed dev
- Quota freemium Starter applique sur creation de commandes
- SignalR Hub tracking (join group, update GPS, status)

### Frontend Business (Dashboard)
- SvelteKit + Svelte 5 Runes + Tailwind
- Pages: login, dashboard, commandes, import, tournees, detail tournee
- Stores globaux (auth, orders, deliveries)
- Client API + refresh automatique listes
- Client SignalR pour suivi temps reel

### Frontend Driver (PWA)
- PWA initialisee (manifest + service worker)
- Pages: login, liste livraisons, detail livraison
- GPS natif + envoi position toutes les 5s via SignalR
- Validation livraison + UI usage exterieur

## Fonctionnalites a faire (Backlog)

### Frontend Tracking (client)
- Projet Svelte minimal + page `/tracking/[deliveryId]`
- Client SignalR ultra-leger + carte position livreur
- Statut livraison + animation mouvement
- Optimisation bundle < 50kb

### Backend & Integrations
- Stripe Billing (plans + webhooks)
- SMS (Twilio/Vonage) + envoi lien tracking
- Google Maps (geocodage + itineraires)
- Tests unitaires backend (xUnit)
- Swagger / doc API
- Monitoring & logging (Serilog)

### Frontend Business
- Creation manuelle commandes / tournees
- Statistiques + KPIs avances
- Export CSV + historique tournees
- Graphiques de performance

### Transversal
- Types partages C# -> TS (NSwag/TypeGen)
- CI/CD + deploiements (backend + frontends)

## Dettes techniques proposees (tickets)

- Remplacer le fallback JWT dev par une variable locale documentee
- Proteger ou supprimer les endpoints debug publics (drivers/tenants)
- Remplacer les donnees mockees du dashboard Business par l'API
- Ajouter tenantId au client SignalR Business (aligner avec le hub)
- Consolider roadmap/todo pour eviter les ecarts de statut
