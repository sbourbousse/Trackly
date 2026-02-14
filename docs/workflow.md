---
layout: default
title: Workflow
---

# 🔄 Workflow de Développement

## Vue d'ensemble

Ce workflow garantit la qualité du code et la stabilité de la production.

```
┌──────────────────────────────────────────────────────────────┐
│                     CYCLE DE DÉVELOPPEMENT                   │
└──────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   PROMPT     │  ← Feature demandée ou bug report
    │  UTILISATEUR │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   ANALYSE    │  ← Lire contexte, identifier fichiers
    │              │     Planifier changements
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  DÉVELOPPE-  │  ← Créer branche feature/
    │    MENT      │     Implémenter, tester local
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   LIVRAISON  │  ← Commit conventionnel, push
    │              │     Créer PR vers develop
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  VÉRIFICATION│  ← CI passe ?
    │    CI/CD     │     Build OK ?
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌─────────┐  ┌──────────┐
│  ✅ OK   │  │   ❌ KO   │
│         │  │          │
│ Preview │  │ Corriger │
│ Test    │  │  code    │
└────┬────┘  └────┬─────┘
     │            │
     │            └─────────────┐
     │                          │
     ▼                          │
┌──────────┐                   │
│  MERGE   │←──────────────────┘
│ vers     │
│ develop  │
└──────────┘
```

---

## 🔀 Workflow Git Détaillé

### 1. Créer une feature branch

```bash
# S'assurer d'être à jour
git checkout develop
git pull origin develop

# Créer la branche
git checkout -b feature/nom-feature

# Exemples :
# git checkout -b feature/map-filters
# git checkout -b fix/cors-config
# git checkout -b feat/settings-page
```

### 2. Développer

```bash
# Faire les modifications
# ...

# Vérifier les changements
git status
git diff

# Ajouter et commit
git add .
git commit -m "feat: description claire

- Détail du changement 1
- Détail du changement 2"
```

### 3. Pousser et créer la PR

```bash
# Premier push
git push -u origin feature/nom-feature

# GitHub affiche une URL pour créer la PR
# Ou créer manuellement sur github.com
```

### 4. Attendre le CI

GitHub Actions lance automatiquement :
- Build & Lint
- Vercel Preview Deployment

| Check | Description | Temps |
|-------|-------------|-------|
| Build | Compilation TypeScript | ~1 min |
| Lint | Vérification code style | ~30 sec |
| Vercel | Déploiement preview | ~2 min |

### 5. Tester la preview

Vercel commente automatiquement la PR avec l'URL preview :
```
🚀 Deploy Preview: https://trackly-frontend-business-xxx.vercel.app
```

### 6. Merger

Une fois CI vert et tests OK :
```
GitHub PR → Merge pull request → Create a merge commit
```

---

## 📋 Checklist avant merge

- [ ] Code review (par soi-même ou pair)
- [ ] CI passe (tous les checks verts)
- [ ] Testé en preview Vercel
- [ ] Pas de conflits avec `develop`
- [ ] Description de PR claire
- [ ] Screenshots si changement UI

---

## 🌳 Structure des branches

```
main (production)
│
├── develop (intégration)
│   │
│   ├── feature/map-filters ──────── PR ──────┐
│   │                                          │
│   ├── feature/settings-page ───── PR ───────┼─── MERGE ───┐
│   │                                          │             │
│   └── fix/cors-config ─────────── PR ───────┘             │
│                                                            ▼
└─────────────────────────────────────────────────────── develop
                                                                   │
                                                                   ▼
                                                               main
```

**Règles :**
- `main` : production stable
- `develop` : intégration, features en cours
- `feature/*` : une branche par feature

---

## 🔄 Cycle complet exemple

### Scénario : Ajouter un bouton sur la page commandes

```bash
# 1. Checkout develop
git checkout develop
git pull origin develop

# 2. Créer branche
git checkout -b feature/order-delete-button

# 3. Développer
# ... modifications dans src/routes/orders/[id]/+page.svelte ...

# 4. Commit
git add frontend-business/src/routes/orders/[id]/+page.svelte
git commit -m "feat: add delete button to order detail page

- Add delete dialog with confirmation
- Handle cascade delete for deliveries
- Show warning when order has deliveries"

# 5. Push
git push -u origin feature/order-delete-button

# 6. Créer PR (via URL GitHub ou interface)
# GitHub → Compare & pull request
# Base: develop ← Compare: feature/order-delete-button

# 7. Attendre CI (2-3 min)
# Vérifier que tous les checks sont verts

# 8. Tester preview
# Cliquer sur l'URL Vercel dans la PR
# Vérifier le bouton fonctionne

# 9. Merger
# GitHub → Merge pull request

# 10. Cleanup
git checkout develop
git pull origin develop
git branch -d feature/order-delete-button
```

---

## ⚠️ Anti-patterns à éviter

| ❌ Mauvais | ✅ Bon |
|-----------|--------|
| Pusher sur `main` directement | Créer une PR vers `develop` |
| Merger avec CI rouge | Attendre CI vert |
| Une branche pour plusieurs features | Une branche = une feature |
| Commits sans message clair | Commits conventionnels |
| Oublier de pull avant création branche | Toujours `git pull origin develop` d'abord |
