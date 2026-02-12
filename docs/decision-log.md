# Decision Log - Pourquoi on a fait tel choix technique

> **Format** : Date | Décision | Raison | Alternatives considérées

## 2026-02-12 | Système d'Icônes Cohérent pour les Concepts Métier
**Décision** : Définir et appliquer une convention d'icônes cohérente dans toute l'application pour les 4 concepts clés : Commandes, Livraisons, Tournées, Livreurs.

**Raison** :
- Améliore la reconnaissance visuelle et la navigation
- Réduit la charge cognitive de l'utilisateur
- Professionnalise l'interface
- Crée une cohérence dans toute l'expérience utilisateur
- Facilite l'apprentissage de l'application

**Alternatives** :
- Pas d'icônes (rejeté : moins intuitif, plus textuel)
- Icônes uniquement dans la navigation (rejeté : manque de cohérence)
- Icônes aléatoires sans convention (rejeté : confusion)
- Icônes uniquement pour certaines sections (rejeté : incohérence)

**Convention adoptée** :
| Concept | Icône Principale | Icône Secondaire | Usage |
|---------|-----------------|------------------|-------|
| Commande | ClipboardList | ClipboardEdit | Liste vs Édition |
| Livraison | Package | - | Toutes vues |
| Tournée | Route | MapPin | Liste vs Détails |
| Livreur | User | UserCircle | Liste vs Profil |

**Implémentation** :
- `PageHeader` : Prop `icon` optionnelle (size-5)
- `CardTitle` : Inline flexbox (size-4)
- `TopNav` : Icônes dans les liens de navigation (size-4)
- Style : `text-muted-foreground` pour cohérence discrète

**Impact** : 18 pages modifiées, ~35 instances d'icônes ajoutées. Aucune nouvelle dépendance (Lucide déjà présent).

---

## 2026-02-12 | Visualisation de Progression avec Icônes au Lieu de Colonnes Textuelles
**Décision** : Remplacer la colonne "Date" des tournées par une visualisation graphique de progression avec des icônes colorées représentant chaque livraison et son statut.

**Raison** :
- La date seule n'indique pas l'état d'avancement de la tournée
- Identification visuelle instantanée de la progression (X/Y livrées)
- Repérage immédiat des problèmes (échecs) avec icônes rouges
- Plus informatif dans le même espace écran
- Correspond mieux aux besoins métier (suivi de progression)

**Alternatives** :
- Barre de progression classique (rejetée car ne montre pas les échecs individuels)
- Pourcentage textuel "60%" (rejeté car moins intuitif que "3/5")
- Garder la date (rejetée car peu utile dans une liste)

**Implémentation** : 
- Composant `RouteProgressIndicator` avec icônes Lucide (package-check, package, package-x)
- Code couleur selon statut (vert/bleu/rouge/gris)
- Opacité décroissante pour les livraisons en attente (effet file d'attente)
- Tooltips informatifs sur chaque icône et sur le résumé

**Impact** : Backend modifié pour inclure `DeliveryStatusSummary` dans `RouteResponse`, permettant d'afficher l'état sans requête supplémentaire.

---

## 2026-02-12 | Calcul Côté Backend du Nombre de Livraisons
**Décision** : Ajouter le champ `DeliveryCount` dans `OrderResponse` et `RouteResponse`, calculé côté backend avec une requête groupée.

**Raison** :
- Performance : Une seule requête avec `GroupBy` pour tous les éléments au lieu d'une requête par élément
- Cohérence : Les comptes sont calculés côté serveur avec la même logique pour tous les clients
- Fiabilité : Le backend est la source de vérité pour les données

**Alternatives** :
- Calcul côté frontend avec requête par élément (rejetée : O(n) requêtes)
- Inclusion des entités complètes avec `.Include()` (rejetée : surcharge de données)
- Champ calculé dans l'entité (rejeté : complexité EF Core)

**Implémentation** :
```csharp
var deliveryCounts = await dbContext.Deliveries
    .Where(d => orderIds.Contains(d.OrderId) && d.DeletedAt == null)
    .GroupBy(d => d.OrderId)
    .Select(g => new { OrderId = g.Key, Count = g.Count() })
    .ToDictionaryAsync(x => x.OrderId, x => x.Count);
```

**Complexité** : O(1) avec indexation sur OrderId.

---

## 2026-02-12 | Store Réactif pour le Mode Offline/Démo
**Décision** : Créer un store Svelte 5 réactif (`offline.svelte.ts`) pour gérer l'état du mode offline au lieu d'utiliser uniquement des fonctions et le localStorage.

**Raison** :
- Permet la réactivité automatique de l'UI (DemoBanner) lors du changement de mode
- Évite les rechargements de page pour afficher/masquer le banner
- Centralise la logique d'état du mode offline
- Compatible avec l'API Runes de Svelte 5

**Alternatives** : 
- Fonction `isOfflineMode()` non-réactive avec `$derived` (rejetée car ne réagit pas aux changements de localStorage)
- Custom event pour notifier les changements (rejetée car plus complexe qu'un store)

**Implémentation** : Le bouton "Mode demo" active maintenant correctement le mode démo avec :
1. Activation du mode offline via `setOfflineModeReactive(true)`
2. Configuration du `DEMO_TENANT_ID` dans localStorage
3. Authentification avec données de démo
4. Affichage automatique du banner de démo

---

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
