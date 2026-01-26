# Project Roadmap - Vision Long Terme (Étapes MVP)

## Phase 1 : MVP Core (Fondations)
**Objectif** : Avoir une base fonctionnelle pour gérer des livraisons simples.

### Backend
- [ ] Initialisation projet .NET 9 avec Minimal APIs
- [ ] Configuration PostgreSQL avec EF Core
- [ ] Implémentation isolation multi-tenant (TenantId + Global Query Filters)
- [ ] Création entités de base (Order, Delivery, Tenant)
- [ ] Middleware extraction TenantId
- [ ] Interface `ITenantIsolated` et implémentation

### Frontend Business (Dashboard)
- [ ] Initialisation SvelteKit
- [ ] Configuration Svelte 5 Runes
- [ ] Page d'authentification
- [ ] Page import de commandes (CSV/manuel)
- [ ] Liste des tournées
- [ ] Vue détail d'une tournée

### Frontend Driver (PWA)
- [ ] Initialisation Svelte 5 PWA
- [ ] Configuration géolocalisation native
- [ ] Page de connexion
- [ ] Liste des livraisons du jour
- [ ] Interface validation livraison (boutons larges)
- [ ] Envoi position GPS en temps réel

### Frontend Tracking
- [ ] Page Svelte ultra-légère (< 50kb)
- [ ] Affichage carte avec position livreur
- [ ] Client SignalR pour mise à jour temps réel
- [ ] Statut de livraison

## Phase 2 : Temps Réel et Notifications
**Objectif** : Communication temps réel entre tous les acteurs.

- [ ] SignalR Hub fortement typé (TrackingHub)
- [ ] Broadcast position GPS Driver → Dashboard + Tracking
- [ ] Notifications événements (livraison créée, validée, etc.)
- [ ] Intégration SMS (Twilio/Vonage)
- [ ] Envoi lien tracking par SMS

## Phase 3 : Billing et Quotas
**Objectif** : Gérer le modèle freemium.

- [ ] Intégration Stripe Billing
- [ ] Création plans (Starter gratuit, Pro payant)
- [ ] Vérification quota 20-25 livraisons/mois (Starter)
- [ ] Blocage création livraison si quota dépassé
- [ ] Page upgrade vers Pro
- [ ] Webhooks Stripe pour synchronisation

## Phase 4 : Optimisations et UX
**Objectif** : Améliorer l'expérience utilisateur.

- [ ] Calcul d'itinéraires optimisés (Google Maps API)
- [ ] Géocodage automatique des adresses
- [ ] Interface Driver optimisée usage extérieur (contraste, taille)
- [ ] Performance tracking page (< 50kb maintenu)
- [ ] Tests unitaires backend (xUnit)
- [ ] Tests E2E frontend

## Phase 5 : Analytics et Reporting
**Objectif** : Donner de la visibilité aux commerçants.

- [ ] Dashboard statistiques (livraisons/mois, taux de réussite)
- [ ] Export données (CSV)
- [ ] Historique des tournées
- [ ] Graphiques de performance

## Phase 6 : Scalabilité et Production
**Objectif** : Préparer la mise en production.

- [ ] Configuration CI/CD
- [ ] Déploiement backend (Azure/Heroku)
- [ ] Déploiement frontends (Vercel/Netlify)
- [ ] Monitoring et logging (Serilog)
- [ ] Backup base de données
- [ ] Documentation API (Swagger)
- [ ] Documentation utilisateur

## Métriques de Succès MVP
- ✅ Un commerçant peut créer une tournée
- ✅ Un livreur peut valider des livraisons via PWA
- ✅ Un client peut suivre sa livraison en temps réel
- ✅ Les quotas freemium sont respectés
- ✅ Les notifications SMS fonctionnent
