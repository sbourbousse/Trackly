# 🔧 Préparation pour Railway

Avant de déployer sur Railway, effectuez ces modifications :

## 1. Frontend Business (SvelteKit)

### Installer l'adapter Node

```bash
cd frontend-business
npm install --save-dev @sveltejs/adapter-node
```

### Modifier `svelte.config.js`

Remplacez :
```javascript
import adapter from '@sveltejs/adapter-vercel';
```

Par :
```javascript
import adapter from '@sveltejs/adapter-node';
```

### Ajouter le script de démarrage dans `package.json`

Ajoutez dans la section `scripts` :
```json
{
  "scripts": {
    "start": "node build/index.js",
    ...
  }
}
```

## 2. Frontend Driver

✅ Déjà configuré ! `serve` est déjà dans les devDependencies.

## 3. Backend

✅ Déjà configuré ! Le fichier `backend/railway.json` est prêt.

## Vérification

Après ces modifications, vous pouvez déployer sur Railway. Les fichiers de configuration sont prêts :

- ✅ `railway.toml` - Documentation
- ✅ `backend/railway.json` - Config backend
- ✅ `frontend-business/railway.json` - Config SvelteKit
- ✅ `frontend-driver/railway.json` - Config Vite SPA

## Prochaine étape

Suivez le guide [RAILWAY-QUICK-START.md](RAILWAY-QUICK-START.md) pour déployer.
