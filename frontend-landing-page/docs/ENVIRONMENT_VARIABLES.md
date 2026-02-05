# Variables d'environnement

## 📋 Vue d'ensemble

La landing page Trackly utilise des variables d'environnement pour configurer les URLs de redirection vers les différentes applications de l'écosystème Trackly.

---

## 🔧 Configuration

### 1. Fichiers de configuration

#### `.env.example`
Fichier template contenant toutes les variables disponibles avec des valeurs de production par défaut. **Ce fichier est versionné dans Git.**

#### `.env.local`
Fichier de configuration pour le développement local. **Ce fichier est ignoré par Git** (`.gitignore`).

#### `.env.production` (optionnel)
Fichier de configuration pour la production. À créer si nécessaire pour le déploiement.

---

## 🌍 Variables disponibles

### URLs des applications

| Variable | Description | Valeur locale (dev) | Valeur production |
|----------|-------------|---------------------|-------------------|
| `NEXT_PUBLIC_BUSINESS_APP_URL` | URL du dashboard business | `http://localhost:5173` | `https://business.trackly.app` |
| `NEXT_PUBLIC_DRIVER_APP_URL` | URL de l'app livreur | `http://localhost:5174` | `https://driver.trackly.app` |
| `NEXT_PUBLIC_TRACKING_APP_URL` | URL du suivi client | `http://localhost:3001` | `https://tracking.trackly.app` |
| `NEXT_PUBLIC_DEMO_URL` | URL de la démo | `http://localhost:5173/demo` | `https://demo.trackly.app` |
| `NEXT_PUBLIC_SIGNUP_URL` | URL d'inscription | `http://localhost:5173/signup` | `https://business.trackly.app/signup` |

### Note importante

⚠️ **Toutes les variables doivent commencer par `NEXT_PUBLIC_`** pour être accessibles côté client dans Next.js.

---

## 🚀 Installation et configuration

### Développement local

1. **Copier le fichier example**
   ```bash
   cp .env.example .env.local
   ```

2. **Modifier les valeurs** dans `.env.local`
   ```bash
   # Exemple : pointer vers vos apps locales
   NEXT_PUBLIC_BUSINESS_APP_URL=http://localhost:5173
   NEXT_PUBLIC_SIGNUP_URL=http://localhost:5173/signup
   NEXT_PUBLIC_DEMO_URL=http://localhost:5173/demo
   ```

3. **Redémarrer le serveur de développement**
   ```bash
   npm run dev
   ```

### Production (Vercel, Netlify, Railway, etc.)

1. **Configurer les variables dans l'interface de votre plateforme**
   
   **Vercel** :
   - Aller dans Project Settings > Environment Variables
   - Ajouter chaque variable avec sa valeur de production

   **Netlify** :
   - Aller dans Site settings > Build & deploy > Environment
   - Ajouter chaque variable

   **Railway** :
   - Aller dans Variables > New Variable
   - Ajouter chaque variable

2. **Exemple de configuration production**
   ```bash
   NEXT_PUBLIC_BUSINESS_APP_URL=https://business.trackly.app
   NEXT_PUBLIC_DRIVER_APP_URL=https://driver.trackly.app
   NEXT_PUBLIC_TRACKING_APP_URL=https://tracking.trackly.app
   NEXT_PUBLIC_DEMO_URL=https://business.trackly.app/demo
   NEXT_PUBLIC_SIGNUP_URL=https://business.trackly.app/signup
   ```

---

## 📁 Utilisation dans le code

### Import de la configuration

```typescript
import { config } from "@/lib/config";
```

### Utilisation des URLs

```typescript
// Dans un composant React
<Link href={config.signupUrl}>S'inscrire</Link>
<Link href={config.demoUrl}>Découvrir la démo</Link>
<Link href={config.businessAppUrl}>Dashboard</Link>
```

### Fichier de configuration centralisé

Le fichier `lib/config.ts` centralise toutes les variables d'environnement :

```typescript
export const config = {
  businessAppUrl: process.env.NEXT_PUBLIC_BUSINESS_APP_URL || 'http://localhost:5173',
  driverAppUrl: process.env.NEXT_PUBLIC_DRIVER_APP_URL || 'http://localhost:5174',
  trackingAppUrl: process.env.NEXT_PUBLIC_TRACKING_APP_URL || 'http://localhost:3001',
  demoUrl: process.env.NEXT_PUBLIC_DEMO_URL || 'http://localhost:5173/demo',
  signupUrl: process.env.NEXT_PUBLIC_SIGNUP_URL || 'http://localhost:5173/signup',
} as const;
```

**Avantages** :
- ✅ Valeurs par défaut si les variables ne sont pas définies
- ✅ Autocomplétion dans l'IDE
- ✅ Type-safety avec TypeScript
- ✅ Point unique de configuration

---

## 🔍 Composants utilisant les URLs configurables

| Composant | Bouton/Lien | Variable utilisée |
|-----------|-------------|-------------------|
| **Hero.tsx** | "Découvrir la démo" | `config.demoUrl` |
| **Hero.tsx** | "S'inscrire (Gratuit)" | `config.signupUrl` |
| **CtaFinal.tsx** | "Essai gratuit" | `config.signupUrl` |
| **CtaFinal.tsx** | "Voir la tarification" | `internalLinks.pricing` (ancrage) |
| **Pricing.tsx** | "Démarrer" | `config.signupUrl` |

---

## 🧪 Tester la configuration

### Vérifier les valeurs chargées

1. Lancer le serveur de développement
   ```bash
   npm run dev
   ```

2. Ouvrir la console du navigateur (F12)

3. Exécuter dans la console :
   ```javascript
   console.log({
     businessAppUrl: process.env.NEXT_PUBLIC_BUSINESS_APP_URL,
     signupUrl: process.env.NEXT_PUBLIC_SIGNUP_URL,
     demoUrl: process.env.NEXT_PUBLIC_DEMO_URL,
   });
   ```

### Tester les redirections

1. Cliquer sur "Découvrir la démo" → doit rediriger vers `NEXT_PUBLIC_DEMO_URL`
2. Cliquer sur "S'inscrire (Gratuit)" → doit rediriger vers `NEXT_PUBLIC_SIGNUP_URL`
3. Cliquer sur "Démarrer" (Pricing) → doit rediriger vers `NEXT_PUBLIC_SIGNUP_URL`

---

## 🐛 Dépannage

### Les variables ne sont pas chargées

**Problème** : Les liens redirigent vers les valeurs par défaut au lieu des valeurs configurées

**Solutions** :

1. ✅ Vérifier que les variables commencent par `NEXT_PUBLIC_`
2. ✅ Redémarrer le serveur de développement (`Ctrl+C` puis `npm run dev`)
3. ✅ Vérifier que le fichier `.env.local` existe à la racine du projet
4. ✅ Vérifier qu'il n'y a pas d'espaces autour du `=` dans `.env.local`

### Les variables sont différentes en production

**Problème** : Les variables fonctionnent en local mais pas en production

**Solutions** :

1. ✅ Vérifier que les variables sont configurées dans l'interface de la plateforme de déploiement
2. ✅ Vérifier les logs de build pour voir si les variables sont chargées
3. ✅ Redéployer l'application après avoir ajouté les variables

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## 🔒 Sécurité

### Variables publiques vs privées

- **Variables `NEXT_PUBLIC_*`** : Exposées côté client, visibles dans le bundle JavaScript
  - ✅ URLs publiques (dashboard, signup, démo)
  - ❌ Clés API secrètes, tokens d'authentification

- **Variables sans `NEXT_PUBLIC_`** : Accessibles uniquement côté serveur
  - ✅ Clés API secrètes, database URLs, tokens privés

### Bonnes pratiques

1. ✅ Ne jamais commit `.env.local` dans Git (déjà dans `.gitignore`)
2. ✅ Toujours commit `.env.example` avec des valeurs d'exemple
3. ✅ Utiliser des URLs différentes pour dev/staging/production
4. ✅ Documenter toutes les variables dans ce fichier
5. ✅ Valider les URLs avant de déployer en production

---

## 📝 Checklist de déploiement

- [ ] Copier `.env.example` vers `.env.local` pour le dev
- [ ] Configurer toutes les variables dans la plateforme de déploiement
- [ ] Vérifier les URLs en production après déploiement
- [ ] Tester tous les boutons CTA en production
- [ ] Documenter les URLs configurées dans la doc projet

---

**Dernière mise à jour** : 5 février 2026  
**Version** : 1.0
