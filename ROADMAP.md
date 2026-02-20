# ROADMAP — Trackly

> Feuille de route MVP — SaaS de gestion de livraisons pour TPE et artisans
> Dernière mise à jour : 2026-02-20

---

## Légende

| Statut | Description |
|--------|-------------|
| 🔴 Non démarré | Tâche en attente |
| 🟡 En cours | Développement actif |
| 🟢 Terminé | Fonctionnalité livrée |
| ⚪ En attente | Bloqué par dépendances |

| Priorité | Description |
|----------|-------------|
| P0 | Critique — bloque le MVP |
| P1 | Important — attendu pour le MVP |
| P2 | Optionnel — nice to have |

---

## Phase 1 : Fondations Techniques (Sprint 0-1)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Initialisation backend .NET 9 + Minimal APIs | 🟢 Terminé | P0 | @dev-backend | - |
| Configuration PostgreSQL + EF Core | 🟢 Terminé | P0 | @dev-backend | Backend |
| Isolation multi-tenant (TenantId + Global Query Filters) | 🟢 Terminé | P0 | @dev-backend | EF Core |
| Middleware extraction TenantId | 🟢 Terminé | P0 | @dev-backend | Multi-tenant |
| Interface `ITenantIsolated` et implémentation | 🟢 Terminé | P0 | @dev-backend | Multi-tenant |
| Initialisation SvelteKit Dashboard | 🟢 Terminé | P0 | @dev-frontend | - |
| Configuration Docker & docker-compose | 🟢 Terminé | P0 | @devops | - |
| CI/CD pipeline GitHub Actions | 🟡 En cours | P1 | @devops | Docker |

## Phase 2 : Core Métier — Commandes et Tournées (Sprint 2-3)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Entités Order, Delivery, Tenant | 🟢 Terminé | P0 | @dev-backend | DB |
| CRUD Commandes (Orders) | 🟢 Terminé | P0 | @dev-backend | Entités |
| Import CSV de commandes | 🟡 En cours | P0 | @dev-backend | CRUD Orders |
| Page authentification (Dashboard) | 🟢 Terminé | P0 | @dev-frontend | Auth API |
| Page import commandes (UI) | 🟡 En cours | P0 | @dev-frontend | Import API |
| Liste des tournées (Dashboard) | 🟡 En cours | P0 | @dev-frontend | CRUD Tournées |
| Timeline visuelle Dashboard (tournées + commandes positionnées) | 🟢 Terminé | P1 | @dev-frontend | Liste des tournées |
| Dashboard par rubriques (KPI, alertes, affectation, performance) | 🟢 Terminé | P1 | @dev-frontend | Timeline dashboard |
| Vue détail d'une tournée | 🔴 Non démarré | P0 | @dev-frontend | Liste tournées |
| Gestion des statuts de livraison | 🔴 Non démarré | P1 | @dev-backend | Tournées |

## Phase 3 : Application Livreur PWA (Sprint 4)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Initialisation Svelte 5 PWA | 🟡 En cours | P0 | @dev-frontend | - |
| Configuration géolocalisation native | 🔴 Non démarré | P0 | @dev-frontend | PWA |
| Page connexion livreur | 🔴 Non démarré | P0 | @dev-frontend | Auth |
| Liste livraisons du jour | 🔴 Non démarré | P0 | @dev-frontend | Auth |
| Interface validation livraison (boutons larges) | 🔴 Non démarré | P0 | @dev-frontend | Liste |
| Envoi position GPS temps réel | 🔴 Non démarré | P0 | @dev-frontend | SignalR |
| Optimisation usage extérieur (contraste, taille) | 🔴 Non démarré | P1 | @dev-frontend | UI |

## Phase 4 : Tracking Client et Temps Réel (Sprint 5)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Page tracking ultra-légère (< 50kb) | 🔴 Non démarré | P0 | @dev-frontend | - |
| Affichage carte position livreur | 🔴 Non démarré | P0 | @dev-frontend | Page tracking |
| SignalR Hub fortement typé (TrackingHub) | 🔴 Non démarré | P0 | @dev-backend | - |
| Broadcast position GPS Driver → Dashboard + Tracking | 🔴 Non démarré | P0 | @dev-backend | SignalR Hub |
| Notifications événements (livraison créée, validée) | 🔴 Non démarré | P1 | @dev-backend | SignalR |
| Client SignalR temps réel (Tracking) | 🔴 Non démarré | P0 | @dev-frontend | SignalR Hub |

## Phase 5 : Notifications SMS et Communication (Sprint 6)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Intégration SMS (Twilio/Vonage) | 🔴 Non démarré | P1 | @dev-backend | - |
| Envoi lien tracking par SMS | 🔴 Non démarré | P1 | @dev-backend | SMS, Tracking |
| Templates de messages personnalisables | 🔴 Non démarré | P2 | @dev-backend | SMS |

## Phase 6 : Billing et Quotas Freemium (Sprint 7)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Intégration Stripe Billing | 🔴 Non démarré | P0 | @dev-backend | - |
| Création plans (Starter gratuit, Pro payant) | 🔴 Non démarré | P0 | @dev-backend | Stripe |
| Vérification quota 20-25 livraisons/mois (Starter) | 🔴 Non démarré | P0 | @dev-backend | Plans |
| Blocage création livraison si quota dépassé | 🔴 Non démarré | P0 | @dev-backend | Quotas |
| Page upgrade vers Pro | 🔴 Non démarré | P0 | @dev-frontend | Stripe |
| Webhooks Stripe synchronisation | 🔴 Non démarré | P1 | @dev-backend | Stripe |

## Phase 7 : Optimisations et Production (Sprint 8)

| Fonctionnalité | Statut | Priorité | Assigné | Dépendances |
|----------------|--------|----------|---------|-------------|
| Calcul d'itinéraires optimisés (Google Maps API) | 🔴 Non démarré | P1 | @dev-backend | - |
| Géocodage automatique des adresses | 🔴 Non démarré | P1 | @dev-backend | Google Maps |
| Cache intelligent des listes par période (SWR + déduplication) | 🟢 Terminé | P1 | @dev-frontend | Dashboard, Carte |
| Tests unitaires backend (xUnit) | 🔴 Non démarré | P1 | @dev-backend | - |
| Tests E2E frontend | 🔴 Non démarré | P2 | @qa | Features complètes |
| Documentation API (Swagger) | 🟡 En cours | P1 | @dev-backend | API stable |
| Documentation utilisateur | 🔴 Non démarré | P2 | @product | MVP stable |

---

## 🎯 Métriques de Succès MVP

- [ ] Un commerçant peut créer une tournée
- [ ] Un livreur peut valider des livraisons via PWA
- [ ] Un client peut suivre sa livraison en temps réel
- [ ] Les quotas freemium sont respectés
- [ ] Les notifications SMS fonctionnent

---

## Backlog (Idées futures)

- [ ] Dashboard statistiques (livraisons/mois, taux réussite)
- [ ] Export données (CSV)
- [ ] Historique des tournées
- [ ] Graphiques de performance
- [ ] API publique pour intégrations
- [ ] Mode offline PWA avancé
- [ ] Application mobile native (iOS/Android)

---

## Résumé

| Phase | Progression | Items | Terminés |
|-------|-------------|-------|----------|
| Fondations | 80% | 8 | 6 |
| Core Métier | 40% | 8 | 3 |
| PWA Livreur | 10% | 7 | 0 |
| Tracking Temps Réel | 0% | 6 | 0 |
| Notifications SMS | 0% | 3 | 0 |
| Billing & Quotas | 0% | 6 | 0 |
| Production | 10% | 6 | 0 |

**Progression globale MVP : ~35%**
