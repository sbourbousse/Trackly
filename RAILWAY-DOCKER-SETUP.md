# 🚂 Configuration Railway avec Docker

## ⚠️ Configuration requise dans le Dashboard Railway

Pour que Railway utilise les Dockerfiles, vous devez configurer le **Root Directory** de chaque service dans le dashboard Railway.

### Étapes à suivre :

1. **Ouvrez le dashboard Railway** : https://railway.com/project/128f9e74-f6a0-42dd-bbae-14521073aad8

2. **Pour chaque service (backend, frontend-business, frontend-driver)** :

   - Cliquez sur le service
   - Allez dans **Settings**
   - Dans **Root Directory**, configurez :
     - **Backend** : `backend`
     - **Frontend Business** : `frontend-business`
     - **Frontend Driver** : `frontend-driver`
   
   - Dans **Build Command**, laissez vide (Railway utilisera le Dockerfile)
   - Dans **Start Command**, laissez vide (défini dans le Dockerfile)

3. **Vérifiez que le builder est Docker** :
   - Dans **Settings** → **Build**, assurez-vous que **Builder** est défini sur **Dockerfile**
   - Le **Dockerfile Path** doit être `Dockerfile` (relatif au root directory)

## 🔄 Redéployer après configuration

Une fois le Root Directory configuré, redéployez chaque service :

```powershell
# Backend
cd backend
railway up --service backend --detach

# Frontend Business
cd ..\frontend-business
railway up --service frontend-business --detach

# Frontend Driver
cd ..\frontend-driver
railway up --service frontend-driver --detach
```

## 📋 Variables d'environnement à configurer

### Backend
```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
DATABASE_URL=<automatique depuis PostgreSQL>
Cors__AllowedOrigins__0=https://<frontend-business-url>.up.railway.app
Cors__AllowedOrigins__1=https://<frontend-driver-url>.up.railway.app
```

### Frontend Business
```env
NODE_ENV=production
PORT=$PORT
PUBLIC_API_BASE_URL=https://<backend-url>.up.railway.app
PUBLIC_SIGNALR_URL=https://<backend-url>.up.railway.app/hubs/tracking
```

### Frontend Driver
```env
NODE_ENV=production
PORT=$PORT
PUBLIC_API_BASE_URL=https://<backend-url>.up.railway.app
PUBLIC_SIGNALR_URL=https://<backend-url>.up.railway.app/hubs/tracking
```

## 🔍 Vérification

Après configuration, vérifiez les logs de build pour confirmer que Docker est utilisé :

```powershell
railway logs --deployment
```

Vous devriez voir des logs Docker au lieu de Railpack/NIXPACKS.
