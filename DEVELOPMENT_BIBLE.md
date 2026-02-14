# 📚 Trackly Development Bible

> Guide complet du workflow de développement et historique des décisions

---

## 📅 Chronologie des Actions

### 2026-02-14 - Session de développement

```mermaid
timeline
    title Historique chronologique - 14 Février 2026
    section Matin
        Analyse CI/CD : Diagnostic workflows existants
        Optimisation : Retrait lint + limitation E2E
        Configuration Vercel : Correction secrets + déploiement
    section Après-midi
        Problème CORS : URLs Railway changées
        Mise à jour URLs : Frontend → Backend
        Feature Settings : Ajout lien sidebar
        Features : Map filters + Delete button
    section Soir
        Documentation : Création de ce guide
```

---

## 🧠 Chemin de Pensée (Thought Process)

### Pattern de résolution de problèmes

```mermaid
flowchart TD
    A[Problème signalé] --> B{Comprendre la cause}
    B -->|Erreur CORS| C[Analyser headers/network]
    B -->|Build failed| D[Vérifier logs CI]
    B -->|Feature demandée| E[Lire spec existante]
    
    C --> F{Identifier la source}
    D --> F
    E --> F
    
    F -->|Config| G[Modifier fichier config]
    F -->|Code| H[Implémenter feature]
    F -->|Infrastructure| I[Mettre à jour env/secrets]
    
    G --> J[Test local/verification]
    H --> J
    I --> J
    
    J -->|OK| K[Commit + Push]
    J -->|KO| L[Debug + Retry]
    L --> B
    
    K --> M[Créer PR]
    M --> N[Attendre CI]
    N -->|Pass| O[Merge]
    N -->|Fail| P[Corriger]
    P --> K
```

### Exemple concret : Résolution CORS

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant A as Agent
    participant R as Railway Backend
    participant V as Vercel Frontend
    
    U->>A: "CORS bloqué sur preview"
    A->>V: Test URL preview
    A->>R: Test backend health
    R-->>A: 404 - URL changée !
    
    Note over A: 🔍 Découverte :<br/>trackly-backend-production →<br/>backend-production-050e
    
    A->>A: Recherche ancienne URL
    A->>A: Remplacement dans 7 fichiers
    
    par Mise à jour fichiers
        A->>A: .env.deployments
        A->>A: frontend-business/src/lib/api/client.ts
        A->>A: frontend-tracking/src/lib/config.ts
        A->>A: frontend-driver/src/lib/config.ts
        A->>A: .env.example files
    end
    
    A->>U: Push + Redéploiement nécessaire
```

---

## 🔄 Workflow de Développement

### Le Cycle Complet

```mermaid
flowchart LR
    subgraph "1. INPUT"
        P[Prompt Utilisateur]
    end
    
    subgraph "2. ANALYSE"
        A[Lire contexte]
        B[Identifier fichiers]
        C[Planifier changements]
    end
    
    subgraph "3. DÉVELOPPEMENT"
        D[Créer branche feature/]
        E[Implémenter]
        F[Test local]
    end
    
    subgraph "4. LIVRAISON"
        G[Commit conventionnel]
        H[Push origin]
        I[Créer PR]
    end
    
    subgraph "5. ATTENTE"
        J{CI passe ?}
        K[Build OK]
        L[Build FAIL]
    end
    
    subgraph "6. VALIDATION"
        M[Review utilisateur]
        N[Tester preview]
    end
    
    subgraph "7. MERGE"
        O[Merge vers develop]
        Q[Supprimer branche]
    end
    
    P --> A --> B --> C --> D --> E --> F --> G --> H --> I --> J
    J -->|Oui| K --> M --> N --> O --> Q
    J -->|Non| L --> E
    N -->|Corrections| E
```

### Workflow Git Détaillé

```mermaid
flowchart TB
    subgraph "Branches"
        MAIN[main<br/>Production]
        DEV[develop<br/>Intégration]
        F1[feature/X<br/>Développement]
        F2[feature/Y<br/>Développement]
    end
    
    subgraph "Règles"
        R1[Toujours partir de develop]
        R2[PR vers develop]
        R3[Jamais de push direct]
        R4[CI doit passer]
    end
    
    DEV -->|checkout| F1
    DEV -->|checkout| F2
    
    F1 -->|push + PR| DEV
    F2 -->|push + PR| DEV
    
    DEV -->|PR + review| MAIN
    
    R1 -.-> F1
    R2 -.-> F1
    R3 -.-> F1
    R4 -.-> F1
```

---

## 📋 Conventions de Commit

```mermaid
mindmap
  root((Conventions Git))
    Préfixes
      feat[Nouvelle feature]
      fix[Correction bug]
      ci[CI/CD]
      docs[Documentation]
      refactor[Refactoring]
      test[Tests]
    Format
      "type: description courte"
      ""
      "- Détail 1"
      "- Détail 2"
    Exemples
      "feat: add map filters by status"
      "fix: update Railway backend URL"
      "ci: disable automatic E2E tests"
```

---

## 🏗️ Architecture des Workflows CI/CD

### Vue d'ensemble

```mermaid
flowchart TB
    subgraph "Triggers"
        T1[Push develop/main]
        T2[PR vers develop]
        T3[PR vers main]
        T4[Manual dispatch]
    end
    
    subgraph "Workflows"
        W1[CI - Build & Lint]
        W2[Vercel Preview]
        W3[Vercel Production]
        W4[Railway Deploy]
        W5[GHCR Images]
        W6[E2E Tests<br/>MANUEL UNIQUEMENT]
    end
    
    T1 -->|develop| W1
    T1 -->|main| W1
    T1 -->|main + backend change| W4
    
    T2 --> W1
    T2 --> W2
    
    T3 --> W1
    T3 -->|si E2E demandé| W6
    
    T4 --> W6
    
    W1 -->|success + PR| W2
    W1 -->|success + main| W3
    W1 -->|success + main| W4
    
    W5 -->|on path change| W4
```

### Séquence de Déploiement

```mermaid
sequenceDiagram
    participant Dev as Développeur
    participant Git as GitHub
    participant Act as GitHub Actions
    participant Ver as Vercel
    participant Rail as Railway
    
    Dev->>Git: Push sur feature/X
    Dev->>Git: Créer PR → develop
    
    Git->>Act: Trigger workflow CI
    Act->>Act: Build & Lint
    Act-->>Git: Status check
    
    par Déploiements parallèles
        Act->>Ver: Deploy Preview
        Ver-->>Act: URL Preview
    end
    
    Dev->>Git: Merge PR
    Git->>Act: Push develop
    
    Act->>Ver: Deploy Preview develop
    
    Dev->>Git: PR develop → main
    Git->>Act: CI + Deploy Prod
    
    Act->>Ver: Deploy Production
    Act->>Rail: Redeploy Backend
    
    Ver-->>Dev: URLs prod disponibles
    Rail-->>Dev: Backend à jour
```

---

## 🎯 Checklist de Développement

### Avant de commencer

```mermaid
flowchart TD
    A[Nouvelle tâche] --> B{Type ?}
    B -->|Feature| C[Lire docs/features-user-redacted/]
    B -->|Bug| D[Analyser logs/erreurs]
    B -->|Config| E[Vérifier env/secrets]
    
    C --> F[Créer branche feature/]
    D --> F
    E --> F
    
    F --> G[git checkout -b feature/xxx]
    G --> H[Développer]
```

### Avant chaque commit

```markdown
- [ ] Code testé localement
- [ ] Pas de console.log ou debug
- [ ] Types TypeScript corrects
- [ ] Pas d'erreurs de lint (si activé)
- [ ] Message de commit conventionnel
```

### Avant de demander review

```markdown
- [ ] CI passe (Build OK)
- [ ] Pas de conflits avec develop
- [ ] Description de PR claire
- [ ] Lien vers feature doc si applicable
- [ ] Screenshots si UI modifiée
```

---

## 🚨 Résolution des Problèmes Courants

### CI Failed

```mermaid
flowchart TD
    A[CI Failed] --> B[Voir logs]
    
    B -->|Build error| C[TypeScript/Erreur syntaxe]
    B -->|Test fail| D[Vérifier tests E2E]
    B -->|Deploy fail| E[Vérifier secrets/env]
    
    C --> F[Corriger code]
    D --> G[Mettre à jour selectors]
    E --> H[Vérifier Railway/Vercel]
    
    F --> I[git commit --amend]
    G --> I
    H --> I
    
    I --> J[git push --force-with-lease]
    J --> K[Attendre nouveau CI]
```

### CORS Issues

```mermaid
flowchart TD
    A[CORS Error] --> B{Vérifier}
    
    B -->|Backend URL| C[URL correcte ?]
    B -->|Headers| D[Access-Control-Allow-Origin ?]
    B -->|Config| E[CORS configuré ?]
    
    C -->|Non| F[Mettre à jour URLs frontend]
    D -->|Non| G[Ajouter header CORS backend]
    E -->|Non| H[Configurer CORS policy]
    
    F --> I[Redéployer frontend]
    G --> J[Redéployer backend]
    H --> J
    
    I --> K[Test fetch]
    J --> K
```

---

## 📝 Structure des Fichiers de Feature

```
docs/features-user-redacted/
├── feature-xxx.md          # Spec complète
├── improvement-xxx.md      # Amélioration
├── bugfix-xxx.md           # Correction
└── misc.md                 # Divers

Pour chaque feature :
- Description
- Fichiers concernés
- Implémentation step-by-step
- Tests à faire
```

---

## 🔗 Liens Rapides

- **Repo** : https://github.com/sbourbousse/Trackly
- **Backend** : https://backend-production-050e.up.railway.app
- **Vercel Dashboard** : https://vercel.com/sbourbousses-projects
- **Railway Dashboard** : https://railway.app/dashboard

---

## 🎓 Leçons Apprises

### Ce qui marche
1. **Feature branches** : Une branche = une feature
2. **Commits petits** : Facile à reviewer et revert
3. **CI comme garde-fou** : Jamais merger si CI fail
4. **Variables d'env** : Toujours vérifier Railway/Vercel

### Ce qui ne marche pas
1. ❌ Merger sans attendre CI
2. ❌ Modifier directement sur main
3. ❌ Oublier de mettre à jour URLs après changement Railway
4. ❌ Laisser les E2E actifs sur chaque PR (trop lent)

### Bonnes pratiques établies
1. ✅ E2E uniquement manuel
2. ✅ Preview Vercel sur chaque PR
3. ✅ Backend Railway séparé des frontends
4. ✅ CORS avec patterns pour les URLs de preview

---

*Dernière mise à jour : 2026-02-14*
*Prochaine review : À chaque nouvelle feature*
