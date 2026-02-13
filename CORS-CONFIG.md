# Configuration CORS - Trackly Backend

## URLs à autoriser dans Railway

Configure ces variables d'environnement dans Railway (Settings → Variables) :

### Production Railway (déjà configuré)
```
Cors__AllowedOrigins__0=https://frontend-business-production.up.railway.app
```

### Vercel Production (à ajouter)
```
Cors__AllowedOrigins__1=https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app
Cors__AllowedOrigins__2=https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app
Cors__AllowedOrigins__3=https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app
```

### Vercel Preview (pour les PR) - Optionnel
Pour accepter tous les previews Vercel de ton compte :
```
Cors__AllowedOrigins__4=https://*.vercel.app
```

**Note** : Le wildcard `*` fonctionne mais est moins sécurisé. À utiliser uniquement pour les previews.

## ✅ RECOMMANDÉ : Variable CORS_ORIGINS (nouveau)

Le code supporte maintenant une variable unique avec des virgules (plus simple à gérer) :

```
CORS_ORIGINS=https://frontend-business-production.up.railway.app,https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app,https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app,https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app
```

Avantages :
- Une seule variable à gérer
- Plus facile à mettre à jour
- Pas de limite d'index

Cette variable est lue **en plus** de Cors:AllowedOrigins__*, donc tu peux mixer les deux méthodes.

## Vérification

Après ajout des variables, redéploy le backend :
```bash
railway up --service backend
```

Ou via l'interface Railway : Redeploy.

## URLs complètes à copier-coller dans Railway

| Variable | Valeur |
|----------|--------|
| `Cors__AllowedOrigins__0` | `https://frontend-business-production.up.railway.app` |
| `Cors__AllowedOrigins__1` | `https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app` |
| `Cors__AllowedOrigins__2` | `https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app` |
| `Cors__AllowedOrigins__3` | `https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app` |

## Commande Railway CLI

```bash
railway login
echo "https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app" | railway variables set Cors__AllowedOrigins__1
echo "https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app" | railway variables set Cors__AllowedOrigins__2
echo "https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app" | railway variables set Cors__AllowedOrigins__3
```
