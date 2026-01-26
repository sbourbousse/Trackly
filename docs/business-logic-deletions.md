# Logique Métier : Gestion des Suppressions

> **Note** : Pour une vue complète du modèle de données et des relations, voir [Modèle de Données](../metier/modele-donnees.md) et [Relations entre Entités](../metier/relations-entites.md).

## Workflow de Suppression

### Règles Générales

1. **Soft Delete** : Toutes les suppressions sont des "soft delete" (marquage avec `DeletedAt`)
   - Les données ne sont jamais supprimées physiquement
   - Les entités supprimées sont filtrées automatiquement dans les requêtes

2. **Dépendances** :
   - Une **Livraison** dépend d'une **Commande** (via `OrderId`)
   - Une **Commande** peut exister sans livraison (en attente de planification)

### Suppression de Livraisons (Tournées)

- ✅ **Indépendante** : Les livraisons peuvent être supprimées sans affecter la commande
- ✅ **Pas de vérification** : Aucune dépendance en aval
- ✅ **Suppression multiple** : Supportée via `/api/deliveries/batch/delete`

**Workflow :**
1. L'utilisateur sélectionne une ou plusieurs livraisons
2. Confirmation de suppression
3. Soft delete immédiat (marquage `DeletedAt`)
4. La commande associée reste intacte

### Suppression de Commandes

- ⚠️ **Dépendante** : Une commande peut avoir des livraisons actives
- ✅ **Vérification automatique** : Le système détecte les livraisons actives
- ✅ **Options de suppression** :
  - **Sans cascade** : Bloque la suppression si des livraisons actives existent
  - **Avec cascade** : Supprime aussi les livraisons associées (option `forceDeleteDeliveries`)

**Workflow :**

#### Cas 1 : Commande sans livraisons actives
1. L'utilisateur sélectionne la commande
2. Confirmation
3. Soft delete immédiat ✅

#### Cas 2 : Commande avec livraisons actives
1. L'utilisateur sélectionne la commande
2. Tentative de suppression
3. **Erreur retournée** : "X commande(s) ont des livraisons actives"
4. **Option proposée** : Cocher "Supprimer aussi les livraisons associées"
5. Nouvelle tentative avec `forceDeleteDeliveries: true`
6. Suppression en cascade : commande + livraisons ✅

### Suppression Multiple de Commandes

**Comportement :**
- Les commandes **sans livraisons** sont supprimées immédiatement
- Les commandes **avec livraisons** sont bloquées (sauf si `forceDeleteDeliveries: true`)
- Retour détaillé : nombre supprimé, nombre de livraisons supprimées en cascade, nombre ignoré

**Exemple de réponse :**
```json
{
  "deleted": 3,
  "deletedDeliveries": 5,
  "skipped": 0,
  "message": "3 commande(s) supprimée(s). 5 livraison(s) supprimée(s) en cascade."
}
```

## Endpoints API

### Livraisons
- `DELETE /api/deliveries/{id}` - Suppression simple
- `POST /api/deliveries/batch/delete` - Suppression multiple

### Commandes
- `DELETE /api/orders/{id}` - Suppression simple (bloque si livraisons actives)
- `POST /api/orders/batch/delete` - Suppression multiple avec option cascade

## Interface Utilisateur

### Page Livraisons
- Cases à cocher pour sélection multiple
- Menu contextuel avec bouton "Supprimer X tournée(s)"
- Suppression immédiate après confirmation

### Page Commandes
- Cases à cocher pour sélection multiple
- Menu contextuel avec :
  - Bouton "Supprimer X commande(s)"
  - Checkbox "Supprimer aussi les livraisons associées" (apparaît si erreur)
- Gestion des erreurs avec proposition de cascade

## Avantages de cette Approche

1. **Sécurité** : Empêche la suppression accidentelle de données importantes
2. **Flexibilité** : L'utilisateur choisit s'il veut supprimer en cascade
3. **Traçabilité** : Soft delete permet de garder l'historique
4. **Cohérence** : Workflow métier clair et prévisible
