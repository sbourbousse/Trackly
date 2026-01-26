# Decision Log - Pourquoi on a fait tel choix technique

> **Format** : Date | Décision | Raison | Alternatives considérées

## 2026-01-26 | Structure Agent-First
**Décision** : Mise en place d'une structure de fichiers "Agent-First" pour maximiser l'autonomie des agents IA.

**Raison** : Les agents IA (Cursor, Windsurf, Antigravity) ont besoin de contexte structuré et de règles explicites pour travailler efficacement sans casser le code.

**Alternatives** : Documentation statique unique (rejetée car pas assez dynamique)

---

## Architecture : Monolithe Modulaire
**Décision** : Choisir un monolithe modulaire plutôt que des micro-services.

**Raison** : 
- Simplicité de déploiement pour développeur solo
- Performance (appels en mémoire)
- Coût de run minimal

**Alternatives** : Micro-services (rejeté car trop complexe pour le volume attendu)

---

## Base de données : PostgreSQL avec Shared Database/Shared Schema
**Décision** : Une seule base PostgreSQL avec isolation par TenantId.

**Raison** :
- Simplicité de gestion
- Coût réduit (une seule instance)
- Isolation garantie au niveau code via Global Query Filters

**Alternatives** : Base par tenant (rejetée car trop coûteuse), Base séparée par schéma (rejetée car complexité de migration)

---

## Frontend : Svelte 5 Runes uniquement
**Décision** : Utiliser exclusivement Svelte 5 avec l'API Runes, interdiction des stores classiques.

**Raison** :
- API moderne et performante
- Meilleure réactivité
- Alignement avec les standards futurs de Svelte

**Alternatives** : Svelte 4 avec stores (rejetée car API legacy)

---

## Temps Réel : SignalR avec Hubs fortement typés
**Décision** : Utiliser SignalR avec des interfaces typées plutôt que des hubs dynamiques.

**Raison** :
- Type-safety
- Meilleure maintenabilité
- IntelliSense amélioré

**Alternatives** : SignalR avec méthodes dynamiques (rejetée car moins sûr)

---

_Continuer à documenter les décisions importantes au fur et à mesure du développement..._
