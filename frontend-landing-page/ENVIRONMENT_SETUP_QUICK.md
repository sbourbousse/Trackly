# 🚀 Configuration des URLs - Guide rapide

> Configuration des liens de redirection vers les applications Trackly en 2 minutes

---

## ⚡ Configuration en 3 étapes

### 1️⃣ Copier le fichier de configuration

```bash
cp .env.example .env.local
```

### 2️⃣ Modifier les URLs (optionnel)

Ouvrir `.env.local` et ajuster selon votre environnement :

```bash
# Développement local (valeurs par défaut)
NEXT_PUBLIC_BUSINESS_APP_URL=http://localhost:5173
NEXT_PUBLIC_SIGNUP_URL=http://localhost:5173/signup
NEXT_PUBLIC_DEMO_URL=http://localhost:5173/demo

# OU Production
NEXT_PUBLIC_BUSINESS_APP_URL=https://business.trackly.app
NEXT_PUBLIC_SIGNUP_URL=https://business.trackly.app/signup
NEXT_PUBLIC_DEMO_URL=https://demo.trackly.app
```

### 3️⃣ Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

---

## ✅ Vérification

### Tester les redirections

1. Ouvrir http://localhost:3000
2. Cliquer sur "Découvrir la démo" → doit ouvrir `NEXT_PUBLIC_DEMO_URL`
3. Cliquer sur "S'inscrire (Gratuit)" → doit ouvrir `NEXT_PUBLIC_SIGNUP_URL`

### Boutons concernés

| Localisation | Bouton | Variable |
|--------------|--------|----------|
| Hero | "Découvrir la démo" | `NEXT_PUBLIC_DEMO_URL` |
| Hero | "S'inscrire (Gratuit)" | `NEXT_PUBLIC_SIGNUP_URL` |
| CTA Final | "Essai gratuit" | `NEXT_PUBLIC_SIGNUP_URL` |
| Pricing | "Démarrer" | `NEXT_PUBLIC_SIGNUP_URL` |

---

## 🌍 Déploiement en production

### Vercel

1. Aller dans **Project Settings** > **Environment Variables**
2. Ajouter :
   ```
   NEXT_PUBLIC_BUSINESS_APP_URL=https://business.trackly.app
   NEXT_PUBLIC_SIGNUP_URL=https://business.trackly.app/signup
   NEXT_PUBLIC_DEMO_URL=https://demo.trackly.app
   ```
3. Redéployer

### Railway / Netlify

1. Aller dans **Variables** / **Environment**
2. Ajouter les mêmes variables
3. Redéployer

---

## 📝 Variables disponibles

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BUSINESS_APP_URL` | Dashboard business |
| `NEXT_PUBLIC_DRIVER_APP_URL` | App livreur |
| `NEXT_PUBLIC_TRACKING_APP_URL` | Suivi client |
| `NEXT_PUBLIC_DEMO_URL` | Démo |
| `NEXT_PUBLIC_SIGNUP_URL` | Inscription |

---

## 🐛 Problème ?

**Les liens ne changent pas ?**
→ Redémarrer le serveur de développement

**Variable non trouvée ?**
→ Vérifier que le nom commence par `NEXT_PUBLIC_`

**Plus de détails ?**
→ Voir [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

---

**C'est prêt ! 🎉**
