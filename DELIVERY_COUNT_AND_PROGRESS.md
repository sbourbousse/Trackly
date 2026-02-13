# Nombre de Livraisons et Visualisation de Progression

## Vue d'ensemble

Implémentation de deux fonctionnalités visuelles pour améliorer la lisibilité des listes :
1. **Nombre de livraisons** dans la liste des commandes avec code couleur si aucune livraison
2. **Visualisation intelligente de progression** dans la liste des tournées avec icônes colorées

## 1. Nombre de Livraisons par Commande

### Backend - Ajout du DeliveryCount

**Fichier modifié** : `backend/Features/Orders/OrderDtos.cs`

Ajout du champ `DeliveryCount` à `OrderResponse` :

```csharp
public sealed record OrderResponse(
    Guid Id,
    string CustomerName,
    string Address,
    string? PhoneNumber,
    string? InternalComment,
    DateTimeOffset? OrderDate,
    OrderStatus Status,
    DateTimeOffset CreatedAt,
    int DeliveryCount);  // Nouveau champ
```

**Fichier modifié** : `backend/Features/Orders/OrderEndpoints.cs`

Modification de `GetOrders()` pour calculer le nombre de livraisons par commande :

```csharp
var ordersList = await query
    .OrderByDescending(order => order.CreatedAt)
    .ToListAsync(cancellationToken);

// Récupérer le nombre de livraisons par commande
var orderIds = ordersList.Select(o => o.Id).ToList();
var deliveryCounts = await dbContext.Deliveries
    .AsNoTracking()
    .Where(d => orderIds.Contains(d.OrderId) && d.DeletedAt == null)
    .GroupBy(d => d.OrderId)
    .Select(g => new { OrderId = g.Key, Count = g.Count() })
    .ToDictionaryAsync(x => x.OrderId, x => x.Count, cancellationToken);

var orders = ordersList
    .Select(order => ToResponse(order, deliveryCounts.TryGetValue(order.Id, out var count) ? count : 0))
    .ToList();
```

Modification de `ToResponse()` :

```csharp
private static OrderResponse ToResponse(Order order, int deliveryCount = 0) =>
    new(order.Id, order.CustomerName, order.Address, order.PhoneNumber, 
        order.InternalComment, order.OrderDate, order.Status, order.CreatedAt, deliveryCount);
```

### Frontend - Type ApiOrder

**Fichier modifié** : `frontend-business/src/lib/api/orders.ts`

```typescript
export type ApiOrder = {
  id: string;
  customerName: string;
  address: string;
  orderDate: string | null;
  status: string;
  deliveryCount: number;  // Nouveau champ
};
```

### Mock Data

**Fichier modifié** : `frontend-business/src/lib/offline/mockData.ts`

Les commandes mock incluent maintenant `deliveryCount: 0` à la création, et `getMockOrders()` calcule dynamiquement le nombre réel de livraisons :

```typescript
export function getMockOrders(filters?: ...): ApiOrder[] {
  // ...
  
  // Calculer le deliveryCount pour chaque commande
  orders = orders.map(order => {
    const deliveryCount = mockDeliveriesState.filter(d => d.orderId === order.id).length;
    return { ...order, deliveryCount };
  });
  
  // ...
}
```

### Store Orders

**Fichier modifié** : `frontend-business/src/lib/stores/orders.svelte.ts`

Mise à jour pour utiliser `order.deliveryCount` au lieu de la valeur fixe `1` :

```typescript
deliveries: order.deliveryCount ?? 0
```

### Composant DeliveryCountBadge

**Fichier créé** : `frontend-business/src/lib/components/DeliveryCountBadge.svelte`

Badge affichant le nombre de livraisons avec code couleur :

**Props** :
- `count: number` - Nombre de livraisons
- `class?: string` - Classes CSS additionnelles

**Code couleur** :
- **count = 0** : Orange (alerte visuelle) - `border-orange-500 bg-orange-50 text-orange-700`
- **count > 0** : Gris standard - `border-border bg-background text-foreground`

**Affichage** :
```html
<Badge variant="outline">
  0 livraison   <!-- Orange si 0 -->
  1 livraison   <!-- Gris si > 0 -->
  3 livraisons  <!-- Pluriel automatique -->
</Badge>
```

### Interface - Liste des Commandes

**Fichier modifié** : `frontend-business/src/routes/orders/+page.svelte`

Remplacement de l'affichage simple par le composant `DeliveryCountBadge` :

**Avant** :
```svelte
<TableCell class="tabular-nums">{order.deliveries}</TableCell>
```

**Après** :
```svelte
<TableCell>
  <DeliveryCountBadge count={order.deliveryCount ?? 0} />
</TableCell>
```

## 2. Visualisation de Progression des Tournées

### Backend - Ajout du Résumé des Statuts

**Fichier modifié** : `backend/Features/Deliveries/DeliveryDtos.cs`

Ajout de `DeliveryStatusSummary` et mise à jour de `RouteResponse` :

```csharp
public sealed record DeliveryStatusSummary(
    int Pending,
    int InProgress,
    int Completed,
    int Failed);

public sealed record RouteResponse(
    Guid Id,
    Guid DriverId,
    string? Name,
    DateTimeOffset CreatedAt,
    int DeliveryCount,
    string DriverName,
    DeliveryStatusSummary StatusSummary);  // Nouveau champ
```

**Fichier modifié** : `backend/Features/Deliveries/RouteEndpoints.cs`

Modification de `GetRoutes()` pour calculer le résumé des statuts :

```csharp
// Récupérer les statuts des livraisons par tournée
var deliveriesByRoute = await dbContext.Deliveries
    .AsNoTracking()
    .Where(d => d.RouteId != null && routeIds.Contains(d.RouteId.Value) && d.DeletedAt == null)
    .GroupBy(d => d.RouteId!.Value)
    .Select(g => new
    {
        RouteId = g.Key,
        Pending = g.Count(d => d.Status == DeliveryStatus.Pending),
        InProgress = g.Count(d => d.Status == DeliveryStatus.InProgress),
        Completed = g.Count(d => d.Status == DeliveryStatus.Completed),
        Failed = g.Count(d => d.Status == DeliveryStatus.Failed)
    })
    .ToDictionaryAsync(x => x.RouteId, cancellationToken);

var responses = routes
    .Select(r =>
    {
        var summary = deliveriesByRoute.TryGetValue(r.Id, out var statusCounts)
            ? new DeliveryStatusSummary(statusCounts.Pending, statusCounts.InProgress, statusCounts.Completed, statusCounts.Failed)
            : new DeliveryStatusSummary(0, 0, 0, 0);
        
        return new RouteResponse(r.Id, r.DriverId, r.Name, r.CreatedAt, 
            counts.TryGetValue(r.Id, out var c) ? c : 0,
            drivers.TryGetValue(r.DriverId, out var name) ? name : "Non assigné",
            summary);
    })
    .ToList();
```

### Frontend - Types

**Fichier modifié** : `frontend-business/src/lib/api/routes.ts`

```typescript
export type DeliveryStatusSummary = {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
};

export type ApiRoute = {
  id: string;
  driverId: string;
  name: string | null;
  createdAt: string;
  deliveryCount: number;
  driverName: string;
  statusSummary: DeliveryStatusSummary;  // Nouveau champ
};
```

### Mock Data

**Fichier modifié** : `frontend-business/src/lib/offline/mockData.ts`

Calcul du `statusSummary` lors de la génération des routes :

```typescript
// Calculer le résumé des statuts
const statusSummary = {
  pending: deliveries.filter(d => d.status === 'Pending').length,
  inProgress: deliveries.filter(d => d.status === 'InProgress').length,
  completed: deliveries.filter(d => d.status === 'Completed').length,
  failed: deliveries.filter(d => d.status === 'Failed').length
};

routes.push({
  id: `demo-route-${routeId}`,
  name: routeName,
  driverId: driver.id,
  createdAt: firstDelivery.createdAt,
  deliveryCount: deliveries.length,
  driverName: driver.name,
  statusSummary
});
```

### Composant RouteProgressIndicator

**Fichier créé** : `frontend-business/src/lib/components/RouteProgressIndicator.svelte`

Composant affichant visuellement la progression d'une tournée avec des icônes :

**Props** :
- `deliveries: Array<{ status: string; sequence?: number | null }>` - Livraisons à afficher
- `class?: string` - Classes CSS additionnelles

**Fonctionnalités** :

1. **Icônes selon le statut** :
   - ✓ `PackageCheckIcon` - Livraison complétée (vert)
   - ◉ `PackageIcon` - Livraison en cours (bleu) ou prévue (gris)
   - ✗ `PackageXIcon` - Livraison échouée (rouge)

2. **Code couleur selon le statut** :
   - **Completed** : Vert `text-green-600`
   - **InProgress** : Bleu `text-blue-600`
   - **Failed** : Rouge `text-red-600`
   - **Pending** : Gris `text-muted-foreground`

3. **Opacité progressive pour les livraisons en attente** :
   - Les livraisons "Pending" ont une opacité décroissante (100% → 30%)
   - Crée un effet visuel de "file d'attente"
   - Les livraisons complétées/en cours/échouées sont toujours à 100%

4. **Indicateur textuel** :
   - Format : `X/Y` (X livrées sur Y total)
   - Exemple : `3/5` pour 3 livraisons sur 5

5. **Tooltip détaillé** :
   - **Par icône** : "Livraison #1 - Livrée"
   - **Sur indicateur textuel** : Résumé complet
     ```
     État de la tournée :
     ✓ 3 livrées
     ◉ 1 en cours
     ○ 2 prévues
     ```

**Exemple d'affichage** :

Pour une tournée avec 5 livraisons (2 complétées, 1 en cours, 2 prévues) :
```
[✓ vert] [✓ vert] [◉ bleu] [◉ gris 70%] [◉ gris 40%] 2/5
```

### Interface - Liste des Tournées

**Fichier modifié** : `frontend-business/src/routes/deliveries/routes/+page.svelte`

Remplacement de la colonne "Date" et suppression de la colonne "Arrêts" par une colonne "Progression" :

**Avant** :
```svelte
<TableHead>Date</TableHead>
<TableHead class="tabular-nums">Arrêts</TableHead>

<TableCell class="tabular-nums">{formatRouteDate(route.createdAt)}</TableCell>
<TableCell class="tabular-nums">{route.deliveryCount}</TableCell>
```

**Après** :
```svelte
<TableHead>Progression</TableHead>

<TableCell class="min-w-[200px]">
  <RouteProgressIndicator deliveries={getDeliveriesForProgress(route)} />
</TableCell>
```

**Fonction helper** pour générer les livraisons depuis le résumé :

```typescript
function getDeliveriesForProgress(route: ApiRoute): Array<{ status: string; sequence: number | null }> {
  const deliveries: Array<{ status: string; sequence: number | null }> = [];
  let sequence = 0;

  // Ordre logique : Completed → InProgress → Failed → Pending
  for (let i = 0; i < route.statusSummary.completed; i++) {
    deliveries.push({ status: 'Completed', sequence: sequence++ });
  }
  for (let i = 0; i < route.statusSummary.inProgress; i++) {
    deliveries.push({ status: 'InProgress', sequence: sequence++ });
  }
  for (let i = 0; i < route.statusSummary.failed; i++) {
    deliveries.push({ status: 'Failed', sequence: sequence++ });
  }
  for (let i = 0; i < route.statusSummary.pending; i++) {
    deliveries.push({ status: 'Pending', sequence: sequence++ });
  }

  return deliveries;
}
```

## Exemples Visuels

### Exemple 1 : Commande sans Livraison

**Liste des commandes** :
```
Commande #001 | Entreprise Alpha | [0 livraison] ← Badge orange
```

**Indication visuelle** : L'absence de livraison est immédiatement visible en orange.

### Exemple 2 : Commande avec Livraisons

**Liste des commandes** :
```
Commande #002 | Boutique Beta | [2 livraisons] ← Badge gris standard
```

### Exemple 3 : Tournée Complétée

**Liste des tournées** :
```
Tournée Centre-Ville | Alice Martin | [✓✓✓] 3/3 ← 3 icônes vertes
```

**Tooltip sur "3/3"** :
```
État de la tournée :
✓ 3 livrées
```

### Exemple 4 : Tournée en Cours

**Liste des tournées** :
```
Tournée Quartier Est | Bob Bernard | [✓✓◉○○] 2/5 ← Mix d'icônes
```

- 2 vertes (complétées)
- 1 bleue (en cours)
- 2 grises avec opacité décroissante (prévues)

**Tooltip sur "2/5"** :
```
État de la tournée :
✓ 2 livrées
◉ 1 en cours
○ 2 prévues
```

### Exemple 5 : Tournée avec Échec

**Liste des tournées** :
```
Tournée Zone Commerciale | Carla Dubois | [✓✗○○] 1/4
```

- 1 verte (complétée)
- 1 rouge (échouée)
- 2 grises (prévues)

**Tooltip sur "1/4"** :
```
État de la tournée :
✓ 1 livrée
✗ 1 échouée
○ 2 prévues
```

## Performance

### Backend

**Optimisation** : Une seule requête additionnelle pour récupérer les comptes par route/commande au lieu d'une requête par élément.

**GetOrders** :
- Requête principale : `SELECT * FROM Orders WHERE ...`
- Requête comptes : `SELECT OrderId, COUNT(*) FROM Deliveries GROUP BY OrderId`
- Complexité : O(1) au lieu de O(n)

**GetRoutes** :
- Requête principale : `SELECT * FROM Routes WHERE ...`
- Requête comptes : `SELECT RouteId, COUNT(*), Status FROM Deliveries GROUP BY RouteId, Status`
- Complexité : O(1) au lieu de O(n)

### Frontend

**Calculs** : Les calculs d'opacité et de formatage sont faits côté client avec `$derived`, garantissant la réactivité.

## Code Couleur Unifié

### DeliveryCountBadge
- **Orange** : Aucune livraison (alerte)
- **Gris** : Au moins une livraison (normal)

### RouteProgressIndicator
- **Vert** : Livraison complétée
- **Bleu** : Livraison en cours
- **Rouge** : Livraison échouée
- **Gris** : Livraison prévue (avec opacité décroissante)

Ces couleurs correspondent aux couleurs des badges de statut existants, assurant une cohérence visuelle dans toute l'application.

## Responsive Design

Les deux composants sont conçus pour être lisibles sur tous les écrans :
- Icônes de taille fixe (16px)
- Espacement minimal entre les icônes
- Tooltips pour plus d'informations
- Largeur minimale pour RouteProgressIndicator (200px)

## Accessibilité

1. **Tooltips** : Informations supplémentaires au survol (délai 200ms)
2. **Aria labels** : Descriptions accessibles pour les lecteurs d'écran
3. **Contraste** : Couleurs respectant les standards WCAG
4. **Mode sombre** : Variantes adaptées pour tous les états

## Tests Recommandés

### Nombre de Livraisons

1. Créer une commande sans livraison → Badge orange "0 livraison"
2. Créer une livraison pour la commande → Badge gris "1 livraison"
3. Créer 2 livraisons supplémentaires → Badge gris "3 livraisons" (pluriel)

### Progression des Tournées

1. **Tournée non démarrée** (toutes Pending) :
   - Toutes les icônes grises avec opacité décroissante
   - Indicateur "0/5"

2. **Tournée en cours** (mix de statuts) :
   - Icônes vertes pour complétées
   - Icône bleue pour en cours
   - Icônes grises pour prévues
   - Indicateur "2/5"

3. **Tournée terminée** (toutes Completed) :
   - Toutes les icônes vertes
   - Indicateur "5/5"

4. **Tournée avec échec** :
   - Icône rouge pour échouée
   - Tooltip affiche le décompte des échecs

5. **Tooltip détaillé** :
   - Survol des icônes → Statut individuel
   - Survol de l'indicateur → Résumé complet

## Avantages

### Nombre de Livraisons
- ✅ Identification immédiate des commandes sans livraison
- ✅ Alerte visuelle en orange
- ✅ Format lisible avec pluriel automatique

### Progression des Tournées
- ✅ Vue d'ensemble instantanée de l'état de chaque tournée
- ✅ Identification rapide des tournées en retard/échouées
- ✅ Visualisation de l'ordre des livraisons
- ✅ Information détaillée via tooltips
- ✅ Remplace la colonne date moins informative

## Impact Visuel

L'interface devient plus **informative** et **actionnable** :
- Les problèmes (commandes sans livraison, échecs) sont visibles immédiatement
- La progression des tournées est claire sans cliquer
- Le code couleur guide l'attention sur ce qui nécessite une action

## Notes Techniques

- Utilisation de Lucide Icons (`package`, `package-check`, `package-x`)
- Composants Svelte 5 avec `$derived` et `$state`
- Tooltips shadcn/ui avec délai de 200ms
- Support complet du mode sombre
- Aucune dépendance externe additionnelle
