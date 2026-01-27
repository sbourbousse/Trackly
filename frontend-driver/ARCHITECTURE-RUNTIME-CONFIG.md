# Architecture de la Configuration Runtime

## Avant (❌ Ne fonctionnait pas)

```
┌─────────────────────────────────────────────────────┐
│  Docker Build (pas d'env vars disponibles)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  npm run build                                      │
│    ↓                                                │
│  Vite lit import.meta.env.VITE_API_BASE_URL        │
│    ↓                                                │
│  undefined → fallback à "localhost:5257"           │
│    ↓                                                │
│  Code compilé avec localhost hardcodé              │
│                                                     │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Railway Deployment (env vars disponibles)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  serve -s dist                                      │
│    ↓                                                │
│  ❌ App utilise localhost:5257                     │
│  ❌ ERR_CONNECTION_REFUSED                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Après (✅ Fonctionne)

```
┌─────────────────────────────────────────────────────┐
│  Docker Build (pas d'env vars nécessaires)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  npm run build                                      │
│    ↓                                                │
│  Code compilé SANS URLs hardcodées                 │
│  (utilise getRuntimeConfig())                      │
│                                                     │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Railway Deployment (env vars disponibles)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. node generate-runtime-config.js                │
│     ↓                                               │
│     Lit VITE_API_BASE_URL                          │
│     Lit VITE_SIGNALR_URL                           │
│     ↓                                               │
│     Génère dist/runtime-config.js:                 │
│     window.__RUNTIME_CONFIG__ = {                  │
│       API_BASE_URL: "https://backend.railway.app"  │
│       SIGNALR_URL: "https://...hubs/tracking"      │
│     }                                               │
│                                                     │
│  2. serve -s dist                                   │
│     ↓                                               │
│     Sert les fichiers statiques                    │
│                                                     │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Charge runtime-config.js                       │
│     → window.__RUNTIME_CONFIG__ disponible         │
│                                                     │
│  2. Charge app bundle                              │
│     → getRuntimeConfig() lit window.__RUNTIME...  │
│     → ✅ URLs Railway utilisées                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Flux de Configuration

### Développement Local
```
import.meta.env.VITE_API_BASE_URL (depuis .env)
           ↓
   getRuntimeConfig()
           ↓
   Utilise les valeurs .env locales
```

### Production (Railway)
```
Variables d'environnement Railway
           ↓
generate-runtime-config.js (au démarrage)
           ↓
dist/runtime-config.js créé
           ↓
window.__RUNTIME_CONFIG__ disponible
           ↓
   getRuntimeConfig()
           ↓
   Utilise les valeurs Railway
```

## Avantages

1. **Séparation build/deploy** : Le build ne dépend plus des variables d'environnement
2. **Portabilité** : La même image Docker fonctionne dans tous les environnements
3. **Flexibilité** : Changement d'URL sans rebuild
4. **Sécurité** : Pas de secrets hardcodés dans le code compilé
