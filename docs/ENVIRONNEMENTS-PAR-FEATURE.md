# Environnements par feature et lien Backend (Railway)

Ce guide explique comment créer des environnements par feature (branche / PR) et comment faire pointer les frontends Vercel vers le bon backend Railway.

## Vue d’ensemble

| Environnement | Frontends (Vercel) | Backend (Railway) |
|---------------|--------------------|-------------------|
| **Production** | Projets Vercel (branche `main`) | Un service Railway (prod) |
| **Feature / PR** | Preview Vercel par branche ou PR | Option A : un backend “staging” partagé • Option B : un backend par PR (Railway PR env) |

---

## 1. Créer des environnements par feature

### Côté Vercel (frontends)

- Chaque **push** sur une branche crée une **Preview** (URL du type `…-git-<branch>-<team>.vercel.app`).
- Chaque **Pull Request** a aussi une preview (souvent la même URL que la branche).
- Aucune config supplémentaire : il suffit d’avoir le repo connecté et le **Root Directory** correct par projet (ex. `frontend-business`).

Donc : **une feature = une branche = une (ou plusieurs) preview(s) Vercel** automatiquement.

### Côté Railway (backend)

Deux façons de gérer le backend pour les features :

- **Option A – Backend “staging” unique**  
  Un seul environnement Railway (ex. “Staging”) avec une URL fixe. Toutes les previews Vercel pointent vers cette URL. Simple, pas d’environnement backend par PR.

- **Option B – Un backend par PR (PR Environments)**  
  Railway crée un environnement par PR (voir [RAILWAY-PR-ENVIRONMENTS.md](../RAILWAY-PR-ENVIRONMENTS.md)).  
  Chaque PR a son propre backend (ex. `trackly-backend-pr-123.up.railway.app`). Il faut alors faire pointer la preview Vercel de la PR vers ce backend (voir section 3).

---

## 2. Gérer le lien Frontend (Vercel) ↔ Backend (Railway)

Les frontends appellent le backend via des variables d’environnement. Il faut les définir **par type d’environnement** (Production vs Preview) dans Vercel.

### Variables par projet Vercel

À définir dans **Settings → Environment Variables** pour **chaque** projet (frontend-business, frontend-driver, frontend-tracking) :

| Projet | Variable(s) | Rôle |
|--------|-------------|------|
| **frontend-business** | `PUBLIC_API_BASE_URL`, `PUBLIC_SIGNALR_URL` | URL de l’API et du hub SignalR |
| **frontend-driver** | `VITE_API_BASE_URL`, `VITE_SIGNALR_URL` | Idem (préfixe Vite) |
| **frontend-tracking** | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SIGNALR_URL` | Idem (préfixe Next) |

Pour chaque variable, tu choisis **pour quel(s) environnement(s)** elle s’applique :

- **Production** : déploiements depuis la branche de production (souvent `main`).
- **Preview** : déploiements des branches et PRs (feature).

### Option A – Backend staging partagé (recommandé pour commencer)

- **Railway** : un environnement “Staging” (ou un 2e service) avec une URL fixe, ex.  
  `https://trackly-backend-staging.up.railway.app`
- **Vercel** :
  - **Production** : `PUBLIC_API_BASE_URL` = URL du backend **production** Railway.
  - **Preview** : `PUBLIC_API_BASE_URL` = URL du backend **staging** Railway (même URL pour toutes les previews).

Résultat : toutes les previews (toutes features) utilisent le même backend staging ; la prod reste isolée.

### Option B – Un backend par PR (Railway PR Environments)

- **Railway** : activer **Automatic PR Environments** (voir [RAILWAY-PR-ENVIRONMENTS.md](../RAILWAY-PR-ENVIRONMENTS.md)).  
  Chaque PR a un backend dédié, ex. `https://trackly-backend-pr-123.up.railway.app` (123 = numéro de PR).
- **Vercel** : il faut que la **preview de la PR** utilise l’URL du backend **de cette PR**.

Deux façons de faire :

1. **URL dérivée du numéro de PR (si Railway suit le même schéma)**  
   Dans Vercel, pour l’environnement **Preview**, définir par exemple :  
   - `PUBLIC_API_BASE_URL` = `https://trackly-backend-pr-$VERCEL_GIT_PULL_REQUEST_ID.up.railway.app`  
   - `PUBLIC_SIGNALR_URL` = `https://trackly-backend-pr-$VERCEL_GIT_PULL_REQUEST_ID.up.railway.app/hubs/tracking`  

   (Idem pour les autres projets avec `VITE_*` ou `NEXT_PUBLIC_*`.)  
   Vercel remplace `$VERCEL_GIT_PULL_REQUEST_ID` au build. Il faut que le nom d’hôte Railway soit bien `trackly-backend-pr-<number>.up.railway.app` (adapter le préfixe si ton projet Railway a un autre nom).

2. **Si l’URL Railway ne suit pas ce schéma**  
   Il faudra un script ou une GitHub Action qui, après création de l’environnement PR Railway, met à jour les variables de la preview Vercel (API Vercel) ou qui passe l’URL en build-time (ex. variable injectée dans le build). Plus lourd à maintenir.

---

## 3. CORS côté Backend (Railway)

Le backend .NET doit autoriser les origines des frontends. En PR / preview, les origines sont des URLs Vercel du type `https://…-git-…-… .vercel.app`.

- **Production** : dans les variables Railway (environnement Production), tu as déjà par ex.  
  `Cors__AllowedOrigins__0` = `https://ton-frontend-business.vercel.app`
- **Preview / Staging** : soit tu ajoutes des origines avec wildcard si ton backend le permet, soit tu ajoutes une origine par projet preview.  
  Exemple (si ton backend accepte une liste) :  
  `Cors__AllowedOrigins__1` = `https://*.vercel.app`  
  (à adapter selon la config CORS de ton backend ; voir [CORS-PRODUCTION.md](CORS-PRODUCTION.md) si tu l’utilises.)

Pour des **PR Environments** Railway, chaque environnement PR peut hériter des variables ou avoir ses propres CORS ; si tu utilises un wildcard `*.vercel.app`, ça couvre toutes les previews.

---

## 4. Résumé pratique

1. **Environnements par feature**  
   - Vercel : automatique (preview par branche/PR).  
   - Railway : soit un seul backend “staging”, soit PR Environments (un backend par PR).

2. **Lien avec le backend**  
   - Dans Vercel, pour chaque projet frontend :  
     - **Production** → variables pointant vers le backend **production** Railway.  
     - **Preview** → variables pointant vers le backend **staging** (option A) ou vers l’URL **PR** (option B, avec `$VERCEL_GIT_PULL_REQUEST_ID` si possible).

3. **CORS**  
   - Configurer le backend Railway (prod + staging/PR) pour autoriser les origines Vercel (prod + preview si besoin).

4. **Doc existante**  
   - Backend par PR : [RAILWAY-PR-ENVIRONMENTS.md](../RAILWAY-PR-ENVIRONMENTS.md)  
   - Déploiement global : [README-DEPLOYMENT.md](../README-DEPLOYMENT.md)  
   - CORS : [CORS-PRODUCTION.md](CORS-PRODUCTION.md) si utilisé.
