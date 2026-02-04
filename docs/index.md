# Documentation Trackly

Bienvenue dans la documentation complète du projet **Trackly**, une solution SaaS de gestion de livraisons pour TPE et artisans.

## 🎯 À propos de Trackly

Trackly est une application SaaS multi-tenant conçue pour simplifier la gestion de tournées et le suivi de colis pour les très petites entreprises (TPE) gérant leurs propres livraisons.

### Caractéristiques principales

- ✅ **Multi-tenant** : Isolation complète des données par organisation
- ✅ **Soft Delete** : Historique complet avec suppression logique
- ✅ **Tracking Temps Réel** : Suivi GPS en direct via SignalR
- ✅ **PWA Mobile** : Application driver pour smartphones
- ✅ **Import CSV** : Importation en masse de commandes
- ✅ **Quotas Freemium** : Plan Starter gratuit, Pro payant

## 📚 Navigation

### Documentation Métier

Comprendre le domaine métier, les entités et les workflows :

- **[Modèle de Données](metier/modele-donnees.md)** - Entités, relations et diagrammes ERD
- **[Relations entre Entités](metier/relations-entites.md)** - Détails des relations et cardinalités
- **[Workflows Métier](metier/workflows.md)** - Processus métier complets avec diagrammes
- **[États et Transitions](metier/etats-transitions.md)** - Machines à états des entités
- **[Règles Métier](metier/regles-metier.md)** - Contraintes et règles de gestion
- **[Architecture Métier](metier/architecture-metier.md)** - Organisation par domaines
- **[Glossaire](metier/glossaire.md)** - Termes et concepts métier

### Documentation Technique

Comprendre l'architecture et les choix techniques :

- **[Architecture Map](architecture-map.md)** - Vue d'ensemble technique
- **[Project Context](project-context.md)** - Contexte et vision du projet
- **[Business Logic - Deletions](business-logic-deletions.md)** - Logique de suppression

### Documentation Projet

Suivre l'évolution du projet :

- **[Current Sprint](current-sprint.md)** - Tâches en cours
- **[Decision Log](decision-log.md)** - Historique des décisions
- **[Project Log](project-log.md)** - Journal de développement

## 🚀 Démarrage Rapide

### Pour comprendre le modèle de données

1. Commencez par [Modèle de Données](metier/modele-donnees.md) pour voir les entités principales
2. Consultez [Relations entre Entités](metier/relations-entites.md) pour comprendre les liens
3. Lisez [Glossaire](metier/glossaire.md) pour les définitions

### Pour comprendre les workflows

1. [Workflows Métier](metier/workflows.md) - Processus complets avec diagrammes
2. [États et Transitions](metier/etats-transitions.md) - Machines à états
3. [Règles Métier](metier/regles-metier.md) - Contraintes et validations

### Pour comprendre l'architecture

1. [Architecture Map](architecture-map.md) - Vue technique globale
2. [Architecture Métier](metier/architecture-metier.md) - Organisation par domaines
3. [Project Context](project-context.md) - Vision et objectifs

## 🛠️ Technologies

- **Backend** : .NET 9, ASP.NET Core Minimal APIs, Entity Framework Core
- **Frontend Business** : SvelteKit, Svelte 5 (Runes API)
- **Frontend Driver** : Svelte 5 PWA
- **Frontend Landing Page** : Next.js 14+ (App Router), React/TypeScript, Tailwind, shadcn/ui — site vitrine SEO (`frontend-landing-page/`)
- **Base de données** : PostgreSQL
- **Temps Réel** : SignalR
- **Documentation** : MkDocs Material avec Mermaid

## 📖 Diagrammes

Tous les diagrammes utilisent [Mermaid](https://mermaid.js.org/) et sont rendus automatiquement dans cette documentation.

## 🤝 Contribution

Pour mettre à jour la documentation :

1. Les diagrammes Mermaid doivent être valides (tester sur mermaid.live)
2. Maintenir la cohérence entre les différents documents
3. Mettre à jour les références croisées si nécessaire

---

**Dernière mise à jour** : Janvier 2026
