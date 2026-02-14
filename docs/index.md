---
layout: default
title: Accueil
---

# 📚 Trackly Development Bible

Guide complet du workflow de développement pour l'équipe Trackly.

---

## 🚀 Démarrage rapide

### Les 5 règles d'or

1. **Toujours partir de `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ma-feature
   ```

2. **Une branche = une feature**
   - Pas de fix dans une feature branch
   - Nommage : `feature/nom-descriptif` ou `fix/description-bug`

3. **PR obligatoire vers develop**
   - Jamais de push direct
   - Toujours créer une Pull Request

4. **Attendre le CI avant de merger**
   - Build doit être vert ✅
   - Pas de merge sur CI rouge ❌

5. **Tester en preview avant merge**
   - Vercel déploie automatiquement la preview
   - URL fournie dans la PR

---

## 🗂️ Navigation

| Section | Description |
|---------|-------------|
| [🚀 Getting Started](./getting-started) | Installation, setup, premiers pas |
| [🔄 Workflow](./workflow) | Cycle de développement complet |
| [🏗️ Architecture](./architecture) | CI/CD, déploiement, infrastructure |
| [🛠️ Troubleshooting](./troubleshooting) | Problèmes courants et solutions |

---

## 📋 Architecture du projet

```
Trackly/
├── 🎨 frontend-business/     # Interface admin (SvelteKit)
├── 📱 frontend-driver/       # App livreur PWA (SvelteKit)
├── 🔍 frontend-tracking/     # Suivi client (Next.js)
├── ⚙️ backend/               # API .NET + SignalR
├── 🐳 docker-compose.yml     # Stack local
└── 📁 docs/                  # Cette documentation
```

### URLs de production

| Service | URL |
|---------|-----|
| Backend API | `https://backend-production-050e.up.railway.app` |
| Frontend Business | `https://trackly-frontend-business.vercel.app` |
| Frontend Driver | `https://trackly-frontend-driver.vercel.app` |
| Frontend Tracking | `https://trackly-frontend-tracking.vercel.app` |

---

## ⏱️ Workflow en 7 étapes

```
┌─────────────────────────────────────────────────────────────┐
│  1. RECEVOIR LE PROMPT                                      │
│     └─ Comprendre le besoin, analyser le contexte          │
├─────────────────────────────────────────────────────────────┤
│  2. ANALYSER                                                │
│     └─ Identifier fichiers concernés, planifier changes    │
├─────────────────────────────────────────────────────────────┤
│  3. DÉVELOPPER                                              │
│     └─ Créer branche feature/, implémenter, tester local   │
├─────────────────────────────────────────────────────────────┤
│  4. LIVRER                                                  │
│     └─ Commit conventionnel, push, créer PR                │
├─────────────────────────────────────────────────────────────┤
│  5. ATTENDRE LE CI                                          │
│     └─ Vérifier que tous les checks passent                │
├─────────────────────────────────────────────────────────────┤
│  6. TESTER EN PREVIEW                                       │
│     └─ Vérifier URL Vercel, tester la feature              │
├─────────────────────────────────────────────────────────────┤
│  7. MERGER                                                  │
│     └─ Merge vers develop, supprimer branche               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Liens rapides

- [📁 Repository GitHub](https://github.com/sbourbousse/Trackly)
- [🚀 Dashboard Vercel](https://vercel.com/sbourbousses-projects)
- [🚂 Dashboard Railway](https://railway.app/dashboard)
- [📝 Roadmap du projet](./roadmap)

---

*Dernière mise à jour : {{ site.time | date: "%d %B %Y" }}*
