# Correction des Filtres de Calendrier en Mode Démo

## Problème

Lorsque l'utilisateur sélectionnait des dates dans le filtre calendrier en mode démo, les données ne s'adaptaient pas. Toutes les données de démo étaient affichées quel que soit le filtre appliqué.

**Cause** : Les fonctions mock (`getMockOrders`, `getMockDeliveries`, `getMockRoutes`) recevaient bien les filtres en paramètre mais ne les utilisaient pas pour filtrer les données.

## Solution Implémentée

### 1. Filtres pour les Tournées

**Fichier** : `frontend-business/src/lib/offline/mockData.ts`

Ajout du support des filtres dans `getMockRoutes()` :

```typescript
export function getMockRoutes(filters?: { 
  dateFrom?: string; 
  dateTo?: string; 
  driverId?: string 
}): ApiRoute[]
```

**Filtres supportés** :
- `dateFrom` : Date de début (incluse)
- `dateTo` : Date de fin (incluse)
- `driverId` : ID du livreur

**Logique de filtrage** :
- Filtre par date de début : garde uniquement les tournées dont la date est >= dateFrom
- Filtre par date de fin : garde uniquement les tournées dont la date est <= dateTo
- Filtre par livreur : garde uniquement les tournées du livreur spécifié

### 2. Filtres pour les Commandes

**Fichier** : `frontend-business/src/lib/offline/mockData.ts`

Ajout du support des filtres dans `getMockOrders()` :

```typescript
export function getMockOrders(filters?: { 
  dateFrom?: string; 
  dateTo?: string; 
  dateFilter?: 'CreatedAt' | 'OrderDate';
  search?: string;
}): ApiOrder[]
```

**Filtres supportés** :
- `dateFrom` : Date de début
- `dateTo` : Date de fin
- `dateFilter` : Type de filtre de date ('CreatedAt' ou 'OrderDate')
- `search` : Recherche textuelle dans le nom du client ou l'adresse

**Logique de filtrage** :
- Recherche textuelle : case-insensitive sur `customerName` et `address`
- Filtres de dates : utilise `orderDate` (car les commandes mock n'ont pas de `createdAt` distinct)

### 3. Filtres pour les Livraisons

**Fichier** : `frontend-business/src/lib/offline/mockData.ts`

Ajout du support des filtres dans `getMockDeliveries()` :

```typescript
export function getMockDeliveries(filters?: { 
  dateFrom?: string; 
  dateTo?: string; 
  dateFilter?: 'CreatedAt' | 'OrderDate';
  routeId?: string;
}): ApiDelivery[]
```

**Filtres supportés** :
- `dateFrom` : Date de début
- `dateTo` : Date de fin
- `dateFilter` : 'CreatedAt' (date de création) ou 'OrderDate' (date de la commande)
- `routeId` : ID de la tournée

**Logique de filtrage** :
- Filtre par tournée : garde uniquement les livraisons de la tournée spécifiée
- Filtres de dates avec `CreatedAt` : utilise `delivery.createdAt`
- Filtres de dates avec `OrderDate` : cherche la commande associée et utilise `order.orderDate`

### 4. Stats des Commandes

**Fichier** : `frontend-business/src/lib/offline/mockApi.ts`

Modification de `getOrdersStats()` pour prendre les filtres en compte :

```typescript
async getOrdersStats(filters?: OrdersListFilters)
```

**Améliorations** :
- Récupère les commandes filtrées via `getMockOrders(filters)`
- Génère des stats réelles basées sur les données filtrées
- **Stats par jour** : compte le nombre de commandes par jour
- **Stats par heure** : compte le nombre de commandes par heure de la journée

### 5. Mise à Jour des Appels

**Fichier** : `frontend-business/src/lib/offline/mockApi.ts`

Simplification des fonctions mock pour passer directement les filtres :

**Avant** :
```typescript
async getOrders(filters?: OrdersListFilters): Promise<ApiOrder[]> {
  let orders = getMockOrders();
  // Filtrage manuel ici...
  return orders;
}
```

**Après** :
```typescript
async getOrders(filters?: OrdersListFilters): Promise<ApiOrder[]> {
  return getMockOrders(filters);  // Filtrage délégué
}
```

**Fichier** : `frontend-business/src/lib/api/orders.ts`

Correction de l'appel à `getOrdersStats` pour passer les filtres :

```typescript
return await mockOrdersApi.getOrdersStats(filters);  // Ajout de filters
```

## Exemples de Filtrage

### Exemple 1 : Tournées d'une Période

**Requête** :
```typescript
getRoutes({ dateFrom: '2026-02-10', dateTo: '2026-02-15' })
```

**Résultat** : Seules les tournées entre le 10 et le 15 février sont retournées.

### Exemple 2 : Commandes d'Aujourd'hui

**Requête** :
```typescript
getOrders({ 
  dateFrom: '2026-02-12', 
  dateTo: '2026-02-12',
  dateFilter: 'OrderDate'
})
```

**Résultat** : Seules les commandes du 12 février sont retournées (2 commandes avec statut "InDelivery").

### Exemple 3 : Tournées d'un Livreur Spécifique

**Requête** :
```typescript
getRoutes({ driverId: 'demo-driver-001' })
```

**Résultat** : Seules les tournées d'Alice Martin (driver-001) sont retournées.

### Exemple 4 : Stats des Commandes de la Semaine Dernière

**Requête** :
```typescript
getOrdersStats({ 
  dateFrom: '2026-02-05', 
  dateTo: '2026-02-11'
})
```

**Résultat** : Stats réelles calculées uniquement sur les commandes de cette période.

## Comparaison de Dates

La logique de comparaison de dates est cohérente dans toutes les fonctions :

```typescript
// Normalisation de la date (heure à 00:00:00)
const fromDate = new Date(filters.dateFrom);
fromDate.setHours(0, 0, 0, 0);

const toDate = new Date(filters.dateTo);
toDate.setHours(23, 59, 59, 999);  // Fin de journée

// Comparaison
const itemDate = new Date(item.date);
itemDate.setHours(0, 0, 0, 0);

return itemDate >= fromDate && itemDate <= toDate;
```

Cela garantit que :
- `dateFrom` inclut toute la journée de début
- `dateTo` inclut toute la journée de fin
- Les comparaisons sont précises au jour près

## Bénéfices

1. **Expérience Réaliste** : Les filtres fonctionnent comme avec de vraies données
2. **Tests Facilités** : Possibilité de tester les filtres en mode démo
3. **Stats Cohérentes** : Les statistiques reflètent les données filtrées
4. **Code DRY** : Logique de filtrage centralisée dans `mockData.ts`

## Tests Recommandés

1. **Tournées** :
   - Sélectionner une période de 3 jours → Voir uniquement les tournées de cette période
   - Sélectionner un livreur → Voir uniquement ses tournées

2. **Commandes** :
   - Filtrer par date → Voir les commandes de la période
   - Rechercher "Alpha" → Voir uniquement "Entreprise Alpha"
   - Combiner date + recherche → Filtres cumulatifs

3. **Livraisons** :
   - Filtrer par tournée → Voir uniquement les livraisons de cette tournée
   - Filtrer par date + OrderDate → Voir les livraisons dont la commande est dans la période

4. **Stats** :
   - Filtrer les commandes par semaine → Stats affichant uniquement cette semaine
   - Vérifier que les graphiques correspondent aux données filtrées

## Notes Techniques

- Les filtres sont optionnels (backward compatible)
- Les fonctions retournent toutes les données si aucun filtre n'est spécifié
- Les filtres de dates incluent les bornes (>= dateFrom ET <= dateTo)
- La recherche textuelle est insensible à la casse
- Les filtres sont cumulatifs (tous doivent être satisfaits)
