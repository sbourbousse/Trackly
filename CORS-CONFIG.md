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

## ✅ RECOMMANDÉ : Patterns Wildcards (meilleure solution)

Au lieu de lister chaque URL, utilise des patterns avec `*` :

```
CORS_PATTERNS=*.vercel.app,*.railway.app
```

Cela autorise **tous** les sous-domaines Vercel et Railway automatiquement !

### Exemples de patterns valides

| Pattern | URLs autorisées |
|---------|-----------------|
| `*.vercel.app` | Tous les projets Vercel (preview + prod) |
| `*.railway.app` | Tous les services Railway |
| `*.sbourbousses-projects.vercel.app` | Tous tes projets Vercel uniquement |
| `https://*.up.railway.app` | Tous les services Railway (format complet) |

### Configuration recommandée pour Trackly

```
CORS_PATTERNS=*.sbourbousses-projects.vercel.app,*.up.railway.app
```

Ou si tu veux être plus permissif (tous les projets Vercel) :

```
CORS_PATTERNS=*.vercel.app,*.up.railway.app
```

### Variables existantes (optionnel)

Tu peux aussi garder `Cors__AllowedOrigins__*` ou `CORS_ORIGINS` pour des URLs spécifiques non couvertes par les patterns.

Exemple mixte :
```
CORS_PATTERNS=*.sbourbousses-projects.vercel.app
Cors__AllowedOrigins__0=https://mon-domaine-custom.com
```

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
