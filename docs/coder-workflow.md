# Workflow Agent @coder — Trackly

> Ce document définit le processus complet de développement et de validation pour l'agent @coder.

---

## 🎯 Mission

Développer des fonctionnalités de qualité production pour Trackly avec **validation CI/CD automatique**.

---

## 📋 Processus complet

### Phase 1 : Développement

1. **Analyser la tâche** demandée par @main
2. **Créer une branche** depuis `develop` :
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nom-descriptif
   ```
3. **Implémenter** les changements
4. **Tester localement** :
   - Backend : `dotnet build` doit passer
   - Frontend : `npm run build` doit passer
   - Docker : `docker build -t test .` si Dockerfile existe

### Phase 2 : Commit et Push

5. **Committer** avec message conventionnel :
   ```bash
   git add .
   git commit -m "feat: description claire de la fonctionnalité

   - Détail 1
   - Détail 2

   Refs: #issue-si-existe"
   ```

6. **Pusher** sur le remote :
   ```bash
   git push origin feature/nom-descriptif
   ```

### Phase 3 : Création PR

7. **Créer la PR** via GitHub CLI :
   ```bash
   gh pr create --title "feat: description" --body-file pr_description.md --base develop
   ```

8. **Noter le numéro de PR** (ex: #65)

### Phase 4 : Vérification CI (CRITIQUE)

9. **Attendre 2-3 minutes** pour le démarrage des builds

10. **Vérifier les builds** :
    ```bash
    gh pr checks <pr-number>
    ```

11. **Analyser les résultats** :

    ✅ **Si tous les builds passent** :
    - Notifier @main : "PR #X prête pour review"
    - Fournir le lien : `https://github.com/sbourbousse/Trackly/pull/X`

    ❌ **Si un build échoue** :
    - Récupérer les logs : `gh run view <run-id> --log`
    - Identifier l'erreur
    - **Corriger automatiquement** (voir section "Erreurs courantes")
    - Committer et push : `git commit -am "fix: correct CI build" && git push`
    - **Retourner à l'étape 9** pour vérifier à nouveau

---

## 🔧 Erreurs courantes et corrections auto

### Erreur 1 : Next.js sans standalone

**Détection** :
```
Error: Could not find a valid build in the '/app/.next' directory
```

**Cause** : Le `next.config.js` ne configure pas `output: 'standalone'`

**Fix automatique** :
```javascript
// frontend-X/next.config.js
const nextConfig = {
  output: 'standalone',
}
module.exports = nextConfig
```

**Validation** : `npm run build` doit créer `.next/standalone/`

---

### Erreur 2 : Fichier C# non inclus dans .csproj

**Détection** :
```
error CS: The type or namespace name 'DemoData' could not be found
```

**Cause** : Le fichier `.cs` existe mais n'est pas référencé dans le projet

**Fix automatique** :
```xml
<!-- Dans Trackly.Backend.csproj -->
<ItemGroup>
  <Compile Include="Infrastructure\Data\DemoData.cs" />
  <Compile Include="Services\GpsSimulationService.cs" />
</ItemGroup>
```

**Validation** : `dotnet build` doit passer

---

### Erreur 3 : Package npm manquant

**Détection** :
```
Cannot find module '@microsoft/signalr'
```

**Fix automatique** :
```bash
cd frontend-X
npm install @microsoft/signalr
```

**Commit** : `git add package.json package-lock.json`

---

### Erreur 4 : TypeScript errors

**Détection** :
```
error TS: Type 'Location' is not assignable to type 'GPSLocation'
```

**Fix** :
- Corriger le type
- Ou ajouter temporairement :
```typescript
// @ts-ignore: Type mismatch - will fix in follow-up
const location: GPSLocation = rawLocation;
```

---

### Erreur 5 : Docker build fail

**Détection** :
```
Build failed with exit code 1
```

**Debug** :
```bash
# Tester en local
docker build -t test-image .

# Voir les logs détaillés
docker build --progress=plain -t test-image . 2>&1
```

---

## 🛠️ Utilitaires

### Script de vérification CI

```bash
# Usage
./scripts/ci-check.sh <pr-number>

# Exemple
./scripts/ci-check.sh 65
```

Ce script :
1. Attend le démarrage des builds
2. Vérifie les statuts
3. Analyse les erreurs
4. Propose les corrections

### Commandes utiles GitHub CLI

```bash
# Voir les runs récents
gh run list --limit 10

# Voir les détails d'un run
gh run view <run-id>

# Voir les logs en direct
gh run view <run-id> --log

# Relancer un run failed
gh run rerun <run-id>

# Voir les checks d'une PR
gh pr checks <pr-number>
```

---

## ✅ Checklist finale

Avant de notifier @main qu'une PR est prête :

- [ ] Tous les builds CI passent (ou ont été corrigés et repassent)
- [ ] Pas de `console.log` de debug
- [ ] Pas de `// TODO` non résolus
- [ ] Description de PR complète et claire
- [ ] Lien vers la PR facilement accessible
- [ ] Code reviewable (pas de fichiers temporaires)

---

## 📞 Escalade

Si une erreur CI ne peut pas être corrigée automatiquement après 2 tentatives :

1. **Documenter** l'erreur complète (logs, contexte)
2. **Notifier @main** avec :
   - Numéro de PR
   - Résumé de l'erreur
   - Logs pertinents
   - Suggestions de fix si possible

---

*Document de référence pour @coder — Mise à jour : 2026-02-11*
