# 🐳 Dockerisation de Trackly

Ce projet est maintenant entièrement dockerisé et prêt pour le déploiement sur Railway ou toute autre plateforme supportant Docker.

## 📁 Structure Docker

```
Trackly/
├── backend/
│   └── Dockerfile          # Image .NET 9 pour le backend
├── frontend-business/
│   └── Dockerfile          # Image Node.js pour SvelteKit
├── frontend-driver/
│   └── Dockerfile          # Image Node.js pour Vite SPA
├── docker-compose.yml      # Configuration pour développement local
└── .dockerignore           # Fichiers exclus des builds Docker
```

## 🚀 Développement Local avec Docker

### Prérequis
- Docker Desktop installé
- Docker Compose v3.8+

### Lancer l'application complète

```powershell
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime la base de données)
docker-compose down -v
```

### Services disponibles

- **Backend** : http://localhost:5257
- **Frontend Business** : http://localhost:5173
- **Frontend Driver** : http://localhost:5175
- **PostgreSQL** : localhost:5432

### Rebuild après modifications

```powershell
# Rebuild un service spécifique
docker-compose build backend
docker-compose up -d backend

# Rebuild tous les services
docker-compose build
docker-compose up -d
```

## 🚂 Déploiement sur Railway

Railway détecte automatiquement les Dockerfiles dans chaque dossier. Les fichiers `railway.json` sont configurés pour utiliser Docker.

### Étapes de déploiement

1. **Créer le projet Railway** (déjà fait)
   ```powershell
   railway init
   ```

2. **Ajouter PostgreSQL**
   - Via le dashboard Railway : New → Database → PostgreSQL
   - Ou via CLI : `railway add --database postgres`

3. **Déployer les services**

   **Backend :**
   ```powershell
   cd backend
   railway up --service backend --detach
   ```

   **Frontend Business :**
   ```powershell
   cd frontend-business
   railway up --service frontend-business --detach
   ```

   **Frontend Driver :**
   ```powershell
   cd frontend-driver
   railway up --service frontend-driver --detach
   ```

4. **Configurer les variables d'environnement**

   Pour chaque service, configurez les variables via le dashboard Railway ou la CLI :

   **Backend :**
   ```env
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://0.0.0.0:$PORT
   DATABASE_URL=<automatique depuis PostgreSQL>
   Cors__AllowedOrigins__0=https://votre-frontend-business.up.railway.app
   Cors__AllowedOrigins__1=https://votre-frontend-driver.up.railway.app
   ```

   **Frontend Business :**
   ```env
   NODE_ENV=production
   PORT=$PORT
   PUBLIC_API_BASE_URL=https://votre-backend.up.railway.app
   PUBLIC_SIGNALR_URL=https://votre-backend.up.railway.app/hubs/tracking
   ```

   **Frontend Driver :**
   ```env
   NODE_ENV=production
   PORT=$PORT
   PUBLIC_API_BASE_URL=https://votre-backend.up.railway.app
   PUBLIC_SIGNALR_URL=https://votre-backend.up.railway.app/hubs/tracking
   ```

## 🏗️ Architecture des Dockerfiles

### Backend (.NET 9)
- **Build stage** : Compile l'application .NET
- **Publish stage** : Publie l'application optimisée
- **Runtime stage** : Image légère aspnet:9.0 avec l'application publiée
- **Sécurité** : Utilise un utilisateur non-root

### Frontend Business (SvelteKit)
- **Build stage** : Installe les dépendances et build avec Vite
- **Runtime stage** : Image Node.js avec l'application buildée
- Utilise `adapter-node` pour servir l'application

### Frontend Driver (Vite SPA)
- **Build stage** : Build l'application Vite
- **Runtime stage** : Utilise `serve` pour servir les fichiers statiques
- Image optimisée pour servir une SPA

## 🔧 Commandes Utiles

### Build manuel des images

```powershell
# Backend
docker build -t trackly-backend ./backend

# Frontend Business
docker build -t trackly-frontend-business ./frontend-business

# Frontend Driver
docker build -t trackly-frontend-driver ./frontend-driver
```

### Exécuter un conteneur individuel

```powershell
# Backend (nécessite PostgreSQL)
docker run -p 5257:8080 \
  -e ConnectionStrings__TracklyDb="Host=host.docker.internal;Port=5432;Database=trackly;Username=trackly;Password=admin" \
  trackly-backend

# Frontend Business
docker run -p 5173:8080 \
  -e PUBLIC_API_BASE_URL=http://localhost:5257 \
  trackly-frontend-business
```

## 📝 Notes

- Les Dockerfiles utilisent des builds multi-stage pour optimiser la taille des images
- Tous les conteneurs utilisent des utilisateurs non-root pour la sécurité
- Railway détecte automatiquement les Dockerfiles et les utilise pour le build
- Les variables d'environnement `PORT` sont gérées automatiquement par Railway
