# PROJECT_STATE — Trackly

> État actuel du projet — SaaS de gestion de livraisons pour TPE et artisans
> Mis à jour : 2026-02-11 11:29

---

## 🎯 Objectif courant

Finaliser le core métier (import de commandes et gestion des tournées) puis déployer la PWA livreur avec géolocalisation temps réel.

---

## 📊 Status Global

```
[████████████░░░░░░░░░░░░░░] 35% — Phase Core Métier + PWA
```

| Domaine | Status | Notes |
|---------|--------|-------|
| Backend .NET 9 | 🟢 Stable | Multi-tenant, EF Core, CRUD de base |
| Frontend Business | 🟡 En cours | Import CSV, liste tournées |
| Frontend Driver PWA | 🟡 En cours | Initialisation Svelte 5 |
| Frontend Tracking | 🔴 Non démarré | Attente SignalR |
| Base de données | 🟢 Stable | PostgreSQL avec migrations |
| DevOps/Infra | 🟡 En cours | CI/CD GitHub Actions |
| SignalR Temps réel | 🔴 Non démarré | Prochaine priorité |
| Tests | 🔴 Non démarré | À planifier |
| Documentation | 🟡 En cours | Swagger en setup |

---

## ✅ Accomplissements récents (Session du 2026-02-11)

- [x] Configuration multi-tenant complète (TenantId + Global Query Filters)
- [x] Middleware extraction automatique du tenant
- [x] Interface `ITenantIsolated` implémentée
- [x] Initialisation SvelteKit Dashboard terminée
- [x] Structure de gestion de projet créée (ROADMAP.md, PROJECT_STATE.md)

---

## 🚧 En cours / Blockers

| Item | Assigné | Blocker | Action requise |
|------|---------|---------|----------------|
| Import CSV commandes | @dev-backend | Validation format CSV | Finaliser parser robuste |
| UI liste tournées | @dev-frontend | API tournées | Intégrer endpoint API |
| PWA Driver setup | @dev-frontend | - | Configurer manifest et service worker |
| CI/CD Pipeline | @devops | Tests manquants | Setup GitHub Actions de base |

---

## 📋 Prochaines actions prioritaires

1. **Backend** — Finaliser l'import CSV avec validation des adresses
2. **Backend** — Créer les endpoints CRUD complets pour les tournées
3. **Frontend Business** — Intégrer la liste des tournées avec filtres
4. **Frontend Driver** — Finaliser le setup PWA et géolocalisation
5. **Backend** — Implémenter le SignalR Hub pour le temps réel
6. **DevOps** — Déployer la pipeline CI/CD sur Railway

---

## 🔗 Ressources

- **Repository** : `https://github.com/sbourbousse/Trackly`
- **Backend local** : `http://localhost:5000`
- **Dashboard local** : `http://localhost:5173`
- **Staging** : `https://staging.trackly.app` (pas encore déployé)
- **Production** : `https://trackly.app` (pas encore déployé)

---

## 📝 Notes de session

> **2026-02-11** — Session de consolidation
> 
> Architecture multi-tenant stable et performante. Les bases sont solides.
> Priorité immédiate : terminer l'import CSV pour permettre aux commerçants
> de créer rapidement des tournées depuis leurs fichiers existants.
> 
> La stack technique reste :
> - Backend : .NET 9 + Minimal APIs + EF Core + PostgreSQL
> - Frontend Business : SvelteKit + Svelte 5 Runes
> - Frontend Driver : Svelte 5 PWA
> - Frontend Tracking : Svelte ultra-léger (< 50kb)
> - Temps réel : SignalR
> - Hébergement : Railway (cible)

---

## 🏷️ Tags / Versions

- **Version actuelle** : `v0.2.0-dev`
- **Milestone** : MVP Core Métier
- **Deadline estimée MVP** : 2026-03-15

---

## 📁 Fichiers de référence

- `project-roadmap.md` — Vision long terme
- `docs/decision-log.md` — Journal des décisions techniques
- `docs/current-sprint.md` — Détail du sprint en cours
- `docs/project-log.md` — Log complet du projet

---

*Ce fichier doit être mis à jour à la fin de chaque session de travail.*
