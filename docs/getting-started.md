---
layout: default
title: Getting Started
---

# 🚀 Getting Started

## Prérequis

- Node.js 20+
- .NET 8+ (pour le backend)
- Docker & Docker Compose (optionnel)
- Git

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/sbourbousse/Trackly.git
cd Trackly
```

### 2. Installation des dépendances

```bash
# Racine (workspaces npm)
npm install

# Frontend Business
cd frontend-business && npm install

# Frontend Driver  
cd frontend-driver && npm install

# Frontend Tracking
cd frontend-tracking && npm install
```

### 3. Configuration des variables d'environnement

Créer les fichiers `.env` :

**frontend-business/.env**
```
PUBLIC_API_BASE_URL=http://localhost:5257
PUBLIC_SIGNALR_URL=http://localhost:5257/hubs/tracking
```

**frontend-driver/.env**
```
VITE_API_BASE_URL=http://localhost:5257
VITE_SIGNALR_URL=http://localhost:5257/hubs/tracking
```

**frontend-tracking/.env**
```
NEXT_PUBLIC_API_URL=http://localhost:5257
```

**backend** (déjà configuré pour le développement local)

### 4. Lancer le backend

```bash
cd backend
dotnet run
```

Le backend démarre sur `http://localhost:5257`

### 5. Lancer les frontends

Dans des terminaux séparés :

```bash
# Frontend Business (port 5173)
cd frontend-business && npm run dev

# Frontend Driver (port 5175)
cd frontend-driver && npm run dev

# Frontend Tracking (port 3004)
cd frontend-tracking && npm run dev
```

---

## 🐳 Option : Lancer avec Docker

```bash
# Toute la stack
docker-compose up -d

# Logs
docker-compose logs -f

# Arrêter
docker-compose down
```

---

## 📝 Conventions de code

### Commits

Format : `type: description`

| Type | Usage | Exemple |
|------|-------|---------|
| `feat` | Nouvelle feature | `feat: add map filters` |
| `fix` | Correction bug | `fix: update Railway URL` |
| `ci` | CI/CD | `ci: disable E2E auto` |
| `docs` | Documentation | `docs: update README` |
| `refactor` | Refactoring | `refactor: simplify API` |
| `test` | Tests | `test: add E2E scenarios` |

Exemple complet :
```bash
git commit -m "feat: add map filters by status

- Add mapFilters store with localStorage persistence
- Add MapFilters component with status badges
- Filter orders and deliveries by status"
```

### Nommage des branches

| Type | Format | Exemple |
|------|--------|---------|
| Feature | `feature/nom-feature` | `feature/map-filters` |
| Bugfix | `fix/description-bug` | `fix/cors-railway-url` |
| Hotfix | `hotfix/critique` | `hotfix/auth-bypass` |

---

## 🎯 Prochaines étapes

1. Lire le [Workflow complet](./workflow)
2. Comprendre l'[Architecture CI/CD](./architecture)
3. Consulter le [Troubleshooting](./troubleshooting) en cas de problème
