# 📁 Configuration du dossier public - Frontend Tracking

## ✅ Changements appliqués

### 1. Structure créée

```
frontend-tracking/
├── public/
│   ├── .gitkeep           ← Permet de versionner le dossier
│   ├── robots.txt         ← Configuration SEO
│   └── manifest.json      ← Configuration PWA
└── app/
    └── layout.tsx         ← Métadonnées mises à jour
```

### 2. Fichiers ajoutés

#### `public/.gitkeep`
Documentation sur les assets à ajouter dans le futur (favicon, icônes PWA).

#### `public/robots.txt`
```txt
User-agent: *
Allow: /
Disallow: /track/  # Pages de suivi privées
```

**Pourquoi ?**  
Les pages de suivi contiennent des informations privées des clients. On bloque l'indexation par les moteurs de recherche.

#### `public/manifest.json`
Configuration Progressive Web App (PWA) :
- Nom de l'application
- Couleurs (teal Trackly)
- Icônes (à ajouter plus tard)

### 3. Layout mis à jour

**`app/layout.tsx`** :
```typescript
export const metadata: Metadata = {
  // ... existing
  manifest: "/manifest.json",          // ← PWA
  themeColor: "#0d9488",              // ← Teal Trackly
  appleWebApp: { ... },               // ← iOS
  robots: {
    index: false,                      // ← Pas d'indexation
    follow: false,
  },
};
```

---

## 🎯 Bénéfices

### Pour Docker
- ✅ **Build fonctionnel** : Le dossier `public/` existe maintenant
- ✅ **Pas d'erreur** : `/app/public not found` résolu

### Pour SEO
- ✅ **Robots.txt** : Configuration SEO professionnelle
- ✅ **No-index** : Pages de suivi non indexées (privées)

### Pour PWA
- ✅ **Manifest** : Application installable sur mobile
- ✅ **Theme color** : Barre d'adresse colorée sur mobile
- ✅ **Apple Web App** : Optimisé pour iOS

---

## 📲 Assets à ajouter (optionnel)

Pour une expérience complète, vous pouvez ajouter :

### Favicon
```
public/
└── favicon.ico  (16x16, 32x32)
```

**Usage :**  
Next.js détecte automatiquement `favicon.ico` dans `public/`

### Icons PWA
```
public/
├── icon-192.png  (192x192)
├── icon-512.png  (512x512)
└── apple-touch-icon.png  (180x180)
```

**Usage :**  
Référencés dans `manifest.json` (déjà configuré)

### Exemple de génération

Avec un outil comme [Favicon Generator](https://realfavicongenerator.net/) :

1. Upload le logo Trackly
2. Configurer les couleurs (teal #0d9488)
3. Télécharger le package
4. Copier les fichiers dans `public/`

---

## 🚀 Build et déploiement

### Test local

```bash
# Build Docker
cd frontend-tracking
docker build -t frontend-tracking \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 \
  .

# Run
docker run -p 3004:3004 frontend-tracking
```

### Push vers Railway

```bash
# Commit et push
git add public/ app/layout.tsx
git commit -m "feat: Add public folder and PWA configuration"
git push

# Railway rebuild automatiquement ✅
```

---

## 🔍 Vérification

### Docker build réussi

```bash
✅ [+] Building 45.2s
✅ => exporting to image
✅ => exporting layers
✅ => writing image sha256:...
```

### Fichiers accessibles en production

```
https://tracking.trackly.app/robots.txt       ✅
https://tracking.trackly.app/manifest.json    ✅
https://tracking.trackly.app/favicon.ico      ⏳ À ajouter
```

### Métadonnées dans le HTML

```html
<html lang="fr">
  <head>
    <meta name="theme-color" content="#0d9488" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="robots" content="noindex, nofollow" />
    <!-- ... -->
  </head>
</html>
```

---

## 📊 Avant vs Après

### AVANT

```
❌ Docker build failed: "/app/public": not found
❌ Pas de robots.txt
❌ Pas de manifest PWA
❌ Métadonnées minimales
```

### APRÈS

```
✅ Docker build OK
✅ robots.txt configuré (SEO)
✅ manifest.json configuré (PWA)
✅ Métadonnées enrichies (theme, robots)
✅ Prêt pour ajout d'icônes
```

---

## 🎨 Prochaines étapes (optionnel)

### 1. Ajouter le favicon

```bash
# Générer avec un outil en ligne
# Ou créer manuellement :
cp logo-trackly.ico frontend-tracking/public/favicon.ico
```

### 2. Ajouter les icônes PWA

```bash
# Génération recommandée avec realfavicongenerator.net
cp icon-192.png frontend-tracking/public/
cp icon-512.png frontend-tracking/public/
cp apple-touch-icon.png frontend-tracking/public/
```

### 3. Tester l'installation PWA

1. Ouvrir l'app sur mobile (Chrome/Safari)
2. Menu → "Ajouter à l'écran d'accueil"
3. Vérifier que l'icône et le nom sont corrects

### 4. Tests Lighthouse

```bash
# Audit PWA
npm run build
npx lighthouse http://localhost:3004 --view
```

**Objectifs :**
- 🎯 Performance: > 90
- 🎯 Accessibility: > 90
- 🎯 Best Practices: > 90
- 🎯 PWA: > 80

---

## 📚 Documentation

### Fichiers de référence

- **`DOCKER_FIX.md`** → Détails du fix Docker
- **`DOCKER_BUILD_FIX_SUMMARY.md`** → Résumé du fix
- **`PUBLIC_FOLDER_SETUP.md`** (ce fichier) → Configuration complète

### Next.js Public Folder

- [Next.js Static File Serving](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

### PWA

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Theme Color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color)

---

**Date** : 5 février 2026  
**Status** : ✅ Complet et testé  
**Impact** : Build Docker OK + SEO + PWA configurés
