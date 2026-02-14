---
layout: default
title: Troubleshooting
---

# 🛠️ Troubleshooting

Guide de résolution des problèmes courants.

---

## 🔴 CI Failed (Build Error)

### Symptôme
GitHub Actions rouge ❌ sur la PR

### Diagnostic
```
1. Cliquer sur "Details" du check qui fail
2. Lire le log d'erreur
3. Identifier la ligne problématique
```

### Causes fréquentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `TypeScript error` | Erreur de type | Corriger le type, ajouter `// @ts-ignore` si justifié |
| `Module not found` | Import inexistant | Vérifier le chemin, installer package manquant |
| `Build failed` | Erreur compilation | Vérifier `npm run build` en local |
| `Vercel deploy failed` | Config manquante | Vérifier `output: 'standalone'` dans next.config.js |

### Résolution

```bash
# 1. Corriger le code
git add .
git commit --amend --no-edit

# 2. Push forcé (même commit, nouveau code)
git push --force-with-lease

# 3. Attendre nouveau CI
```

---

## 🟡 CORS Error

### Symptôme
```
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

### Diagnostic
```bash
# Tester le backend
curl -I https://backend-production-050e.up.railway.app/health

# Vérifier l'URL appelée dans Network tab (DevTools)
```

### Causes

1. **URL Railway changée**
   - Symptôme : 404 sur les appels API
   - Solution : Mettre à jour URLs frontends

2. **CORS non configuré**
   - Symptôme : Preflight fail
   - Solution : Ajouter `Cors__AllowedPatterns` dans Railway

### Solution rapide

**Si URL Railway changée** :
```bash
# Mettre à jour dans tous les fichiers
find . -type f \( -name "*.ts" -o -name "*.md" \) -exec \
  sed -i 's/ancienne-url/nouvelle-url/g' {} \;
```

**Si CORS manquant** :
```
Railway Dashboard → Variables → Ajouter :
Cors__AllowedPatterns__0 = https://*.vercel.app
```

---

## 🔴 Vercel Deploy Failed

### Symptôme
```
Error: output directory not found
Build failed
```

### Causes

| Projet | Cause | Solution |
|--------|-------|----------|
| Next.js | Pas de `output: 'standalone'` | Ajouter dans `next.config.js` |
| SvelteKit | Mauvais adapter | Vérifier `@sveltejs/adapter-auto` |
| Tous | Build commande incorrecte | Vérifier `package.json` scripts |

### Vérification

**frontend-tracking/next.config.js** :
```javascript
const nextConfig = {
  output: 'standalone', // ← REQUIS
  // ...
}
```

---

## 🟡 Preview URL 404

### Symptôme
La preview Vercel retourne 404

### Diagnostic
1. Vérifier que le build a réussi
2. Vérifier l'URL dans le commentaire PR
3. Tester en navigation privée

### Solution
```bash
# Forcer un redeploy
Vercel Dashboard → Project → Deployments → Redeploy
```

---

## 🔴 Railway Backend Down

### Symptôme
```
Application not found
503 Service Unavailable
```

### Diagnostic
```bash
# Test health endpoint
curl https://backend-production-050e.up.railway.app/health

# Vérifier logs Railway Dashboard
```

### Solutions

1. **Redeploy manuel**
   ```
   Railway Dashboard → Deploy → Redeploy
   ```

2. **Vérifier variables d'environnement**
   ```
   DATABASE_URL doit être définie
   JWT_SECRET doit être présent
   ```

3. **Rollback**
   ```
   Railway Dashboard → Deployments → Rollback
   ```

---

## 🟡 E2E Tests Fail

### Symptôme
Playwright tests échouent

### Diagnostic
```bash
# Lancer en local pour voir
cd frontend-business
npx playwright test --headed
```

### Causes fréquentes

| Problème | Solution |
|----------|----------|
| Selecteur cassé | Mettre à jour le `data-testid` |
| Page pas chargée | Ajouter `await page.waitForLoadState()` |
| API down | Vérifier que le backend tourne |
| Timeout | Augmenter `timeout` dans playwright.config.ts |

### Lancer manuellement

GitHub Actions → E2E Tests → Run workflow

---

## 🔴 Conflits de merge

### Symptôme
```
CONFLICT (content): Merge conflict in file.ts
```

### Résolution

```bash
# 1. Voir les fichiers en conflit
git status

# 2. Éditer les fichiers, chercher <<<< ==== >>>>
# Choisir la bonne version ou fusionner

# 3. Marquer comme résolu
git add <fichier>

# 4. Continuer le merge
git commit
```

---

## 🟡 Git : branche bloquée

### Symptôme
```
fatal: The current branch has no upstream branch
```

### Solution
```bash
# Pousser et lier
git push --set-upstream origin feature/ma-feature

# Ou raccourci
git push -u origin feature/ma-feature
```

---

## 📋 Checklist de debug

### Avant de demander de l'aide

- [ ] Lire le message d'erreur complet
- [ ] Vérifier les logs (CI, Vercel, Railway)
- [ ] Tester en local (`npm run build`)
- [ ] Vérifier les variables d'environnement
- [ ] Chercher dans cette doc

### Informations à fournir

```
1. Message d'erreur exact
2. URL de la PR (si applicable)
3. Étape du workflow concernée
4. Ce qui a été tenté
```

---

## 🔗 Liens utiles

- [GitHub Actions Logs](https://github.com/sbourbousse/Trackly/actions)
- [Vercel Dashboard](https://vercel.com/sbourbousses-projects)
- [Railway Dashboard](https://railway.app/dashboard)
- [Backend Health](https://backend-production-050e.up.railway.app/health)

---

*Dernière mise à jour : {{ site.time | date: "%d %B %Y" }}*
