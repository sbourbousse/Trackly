# Configuration Runtime - Frontend Driver

## Problème Résolu

L'application frontend-driver utilise Vite, qui par défaut intègre les variables d'environnement au **build time**. Cela posait problème sur Railway car :

1. Le build Docker se fait avec `npm run build`
2. Les variables d'environnement (VITE_API_BASE_URL, VITE_SIGNALR_URL) ne sont pas disponibles pendant le build
3. L'app se retrouvait avec `undefined` et fallback sur `localhost:5257` en production

## Solution : Configuration Runtime

Au lieu d'utiliser uniquement `import.meta.env` (build time), nous utilisons maintenant une configuration runtime :

### 1. Script de génération (`generate-runtime-config.js`)

Ce script Node.js s'exécute au démarrage du container et génère un fichier `dist/runtime-config.js` avec les variables d'environnement :

```javascript
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "https://trackly-backend.railway.app",
  SIGNALR_URL: "https://trackly-backend.railway.app/hubs/tracking",
  // ...
};
```

### 2. Chargement dans index.html

Le fichier `runtime-config.js` est chargé **avant** le bundle principal de l'app :

```html
<script src="/runtime-config.js"></script>
<script type="module" src="/src/main.ts"></script>
```

### 3. Helper de configuration (`src/lib/config.ts`)

Une fonction `getRuntimeConfig()` unifie l'accès à la configuration :

- **En développement** : utilise `import.meta.env` (comme avant)
- **En production** : utilise `window.__RUNTIME_CONFIG__` (généré au runtime)

### 4. Utilisation dans le code

```typescript
import { getRuntimeConfig } from './config';

const config = getRuntimeConfig();
const baseUrl = config.API_BASE_URL || 'http://localhost:5257';
```

## Avantages

✅ **Une seule image Docker** pour tous les environnements  
✅ **Configuration au runtime** via variables d'environnement Railway  
✅ **Compatibilité développement** : fonctionne toujours avec `import.meta.env`  
✅ **Pas de rebuild** nécessaire pour changer les URLs

## Variables d'Environnement Railway

Sur Railway, configurez ces variables pour le service frontend-driver :

```env
VITE_API_BASE_URL=https://${backend.RAILWAY_PUBLIC_DOMAIN}
VITE_SIGNALR_URL=https://${backend.RAILWAY_PUBLIC_DOMAIN}/hubs/tracking
VITE_DEFAULT_TENANT_ID=<guid>  # optionnel
VITE_TENANT_BOOTSTRAP=true     # optionnel
```

## Comment ça marche

1. **Build** : `npm run build` génère l'app dans `dist/` (sans variables d'environnement)
2. **Démarrage container** : 
   - `node generate-runtime-config.js` lit les variables d'environnement et génère `dist/runtime-config.js`
   - `serve -s dist` sert les fichiers statiques
3. **Chargement app** : Le navigateur charge `runtime-config.js` puis le bundle de l'app
4. **Runtime** : L'app utilise `getRuntimeConfig()` pour lire la configuration

## Fichiers Modifiés

- `generate-runtime-config.js` - Script de génération de config
- `static/runtime-config.js` - Fichier par défaut (vide) pour développement
- `index.html` - Ajout du script runtime-config.js
- `src/lib/config.ts` - Helper pour accéder à la config
- `src/lib/api/client.ts` - Utilise la config runtime
- `src/lib/services/tracking.svelte.ts` - Utilise la config runtime
- `Dockerfile` - Génère runtime-config.js au démarrage
