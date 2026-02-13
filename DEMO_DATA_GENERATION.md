# Génération des Données de Démo - Documentation Technique

## Vue d'ensemble

Les données de démonstration sont générées dynamiquement en fonction de la date actuelle pour fournir une expérience réaliste et cohérente. Ce document explique la logique de génération des données.

## Principes de Base

### 1. Fenêtre Temporelle

Toutes les données de démo sont réparties dans une fenêtre de **15 jours** :
- **J-7** : Il y a 7 jours (passé lointain)
- **J** : Aujourd'hui (présent)
- **J+7** : Dans 7 jours (futur proche)

### 2. Cohérence Temporelle

Les statuts des entités correspondent logiquement à leurs dates :

| Période | Commandes | Livraisons | Tournées |
|---------|-----------|------------|----------|
| **J-7 à J-1** (Passé) | `Delivered` | `Completed` + date de complétion | `Completed` |
| **J** (Aujourd'hui) | `InDelivery` | `InProgress` | `Active` |
| **J+1 à J+7** (Futur) | `Pending` | `Pending` | `Pending` |

## Fonctions Utilitaires

### `getDateWithOffset(dayOffset: number): Date`

Génère une date avec un décalage par rapport à aujourd'hui.

**Paramètres** :
- `dayOffset` : Décalage en jours (négatif = passé, positif = futur)

**Comportement** :
- Génère une heure aléatoire entre 8h et 18h pour plus de réalisme
- Reset les secondes à 0

**Exemple** :
```typescript
getDateWithOffset(-3) // Il y a 3 jours à 14h32 (heure aléatoire)
getDateWithOffset(0)  // Aujourd'hui à 10h15 (heure aléatoire)
getDateWithOffset(5)  // Dans 5 jours à 16h47 (heure aléatoire)
```

### `getOrderStatus(orderDate: Date): Status`

Détermine le statut d'une commande en fonction de sa date.

**Logique** :
```typescript
if (orderDate < today) return 'Delivered';      // Passé
if (orderDate === today) return 'InDelivery';   // Aujourd'hui
return 'Pending';                                // Futur
```

### `getDeliveryStatus(orderDate: Date): Status`

Détermine le statut d'une livraison en fonction de la date de commande.

**Logique** :
```typescript
if (orderDate < today) return 'Completed';      // Passé
if (orderDate === today) return 'InProgress';   // Aujourd'hui
return 'Pending';                                // Futur
```

### `getRouteIdForDate(date: Date): string`

Génère un identifiant de tournée basé sur la date.

**Logique** :
- Calcule le nombre de jours entre la date et aujourd'hui
- Retourne un ID formaté (ex: "-003", "000", "005")

**Exemple** :
```typescript
getRouteIdForDate(J-3) // "-003"
getRouteIdForDate(J)   // "000"
getRouteIdForDate(J+5) // "005"
```

## Génération des Commandes

### Fonction `generateMockOrders()`

Génère **8 commandes** réparties intelligemment sur la fenêtre temporelle.

**Répartition** :
- **Index 0-1** : J-7 à J-5 (passé lointain)
- **Index 2-3** : J-3 à J-1 (passé récent)
- **Index 4-5** : J (aujourd'hui)
- **Index 6-7** : J+1 à J+3 (futur proche)

**Pour chaque commande** :
1. Calcul du décalage de jours selon l'index
2. Génération de la date avec `getDateWithOffset()`
3. Détermination du statut avec `getOrderStatus()`
4. Assignation à un client fictif

**Résultat** :
```typescript
{
  id: 'demo-order-001',
  customerName: 'Entreprise Alpha',
  address: '1 Place de la Comédie, 34000 Montpellier',
  orderDate: '2026-02-05T14:32:00.000Z', // J-7 avec heure aléatoire
  status: 'Delivered' // Cohérent avec la date passée
}
```

## Génération des Livraisons

### Fonction `generateMockDeliveries()`

Génère une livraison pour **chaque commande existante**.

**Pour chaque livraison** :
1. Récupération de la commande associée
2. Assignation d'un livreur (rotation entre les 3 livreurs)
3. Date de création = même jour que la commande
4. Statut cohérent avec la date via `getDeliveryStatus()`
5. **Si statut = `Completed`** : ajout d'une date de complétion (2-8h après création)
6. Génération du `routeId` basé sur la date

**Résultat** :
```typescript
{
  id: 'demo-delivery-001',
  orderId: 'demo-order-001',
  driverId: 'demo-driver-001',
  routeId: '-007', // J-7
  status: 'Completed',
  createdAt: '2026-02-05T14:32:00.000Z',
  completedAt: '2026-02-05T19:15:00.000Z' // 2-8h après
}
```

## Génération des Tournées

### Fonction `getMockRoutes()`

Génère dynamiquement les tournées en regroupant les livraisons par date.

**Processus** :
1. Regroupement des livraisons par `routeId` (= par date)
2. Pour chaque groupe :
   - Calcul de la date de la tournée
   - Détermination du statut (`Completed`, `Active`, ou `Pending`)
   - Assignation d'un livreur (rotation)
   - Assignation d'un nom de tournée (rotation parmi 5 noms)
3. Tri des tournées par date (plus récente en premier)

**Noms de tournées** (rotation) :
- Tournée Centre-Ville
- Tournée Quartier Est
- Tournée Zone Commerciale
- Tournée Périphérie Nord
- Tournée Sud Montpellier

**Résultat** :
```typescript
{
  id: 'demo-route-000', // J (aujourd'hui)
  name: 'Tournée Centre-Ville',
  driverId: 'demo-driver-001',
  date: '2026-02-12',
  status: 'Active' // Cohérent avec aujourd'hui
}
```

## Détails d'une Tournée

### Fonction `getMockRouteById(id: string)`

Retourne le détail d'une tournée avec la liste de ses livraisons.

**Processus** :
1. Recherche de la tournée par ID
2. Extraction du `routeId` interne
3. Filtrage des livraisons correspondantes
4. Enrichissement avec les données des commandes
5. Résolution du nom du livreur

**Résultat** :
```typescript
{
  id: 'demo-route-000',
  name: 'Tournée Centre-Ville',
  driverId: 'demo-driver-001',
  driverName: 'Alice Martin',
  date: '2026-02-12',
  status: 'Active',
  deliveries: [
    {
      id: 'demo-delivery-005',
      orderId: 'demo-order-005',
      status: 'InProgress',
      sequence: 0,
      customerName: 'Librairie Epsilon',
      address: '15 Boulevard Louis Blanc, 34000 Montpellier'
    },
    // ... autres livraisons du jour
  ]
}
```

## Exemples de Données Générées

### Exemple 1 : Commande Passée (J-5)

```typescript
// Commande
{
  id: 'demo-order-001',
  customerName: 'Entreprise Alpha',
  orderDate: '2026-02-07T09:15:00.000Z', // J-5
  status: 'Delivered'
}

// Livraison associée
{
  id: 'demo-delivery-001',
  orderId: 'demo-order-001',
  status: 'Completed',
  createdAt: '2026-02-07T09:15:00.000Z',
  completedAt: '2026-02-07T15:42:00.000Z', // +6h
  routeId: '-005'
}

// Tournée associée
{
  id: 'demo-route--005',
  name: 'Tournée Centre-Ville',
  date: '2026-02-07',
  status: 'Completed'
}
```

### Exemple 2 : Commande d'Aujourd'hui (J)

```typescript
// Commande
{
  id: 'demo-order-005',
  customerName: 'Librairie Epsilon',
  orderDate: '2026-02-12T11:30:00.000Z', // Aujourd'hui
  status: 'InDelivery'
}

// Livraison associée
{
  id: 'demo-delivery-005',
  orderId: 'demo-order-005',
  status: 'InProgress',
  createdAt: '2026-02-12T11:30:00.000Z',
  completedAt: null, // Pas encore complétée
  routeId: '000'
}

// Tournée associée
{
  id: 'demo-route-000',
  name: 'Tournée Quartier Est',
  date: '2026-02-12',
  status: 'Active' // En cours aujourd'hui
}
```

### Exemple 3 : Commande Future (J+3)

```typescript
// Commande
{
  id: 'demo-order-007',
  customerName: 'Pharmacie Êta',
  orderDate: '2026-02-15T16:20:00.000Z', // J+3
  status: 'Pending'
}

// Livraison associée
{
  id: 'demo-delivery-007',
  orderId: 'demo-order-007',
  status: 'Pending',
  createdAt: '2026-02-15T16:20:00.000Z',
  completedAt: null,
  routeId: '003'
}

// Tournée associée
{
  id: 'demo-route-003',
  name: 'Tournée Zone Commerciale',
  date: '2026-02-15',
  status: 'Pending' // Planifiée pour le futur
}
```

## Avantages de cette Approche

1. **Réalisme** : Les données correspondent à ce qu'un utilisateur verrait dans un système réel
2. **Cohérence** : Les statuts sont toujours logiques par rapport aux dates
3. **Dynamisme** : Les données restent pertinentes quel que soit le jour où le mode démo est activé
4. **Facilité de test** : Les développeurs voient immédiatement des données dans différents états
5. **Prévisibilité** : La logique est claire et déterministe

## Notes d'Implémentation

- Les données sont régénérées à chaque appel de `initMockData()`
- Les heures sont aléatoires (8h-18h) mais cohérentes pour une même session
- Les dates de complétion sont réalistes (2-8h après création)
- Les IDs de tournées sont basés sur les jours relatifs (facilite le groupement)
- La rotation des livreurs et noms de tournées assure de la variété

## Maintenance Future

Si vous souhaitez modifier la génération :
- **Fenêtre temporelle** : Modifier les calculs dans `generateMockOrders()`
- **Statuts** : Ajuster les fonctions `getOrderStatus()` et `getDeliveryStatus()`
- **Nombre de commandes** : Ajouter des clients dans `DEMO_CUSTOMERS`
- **Heures** : Modifier la plage dans `getDateWithOffset()` (actuellement 8h-18h)
- **Noms de tournées** : Ajouter des noms dans le tableau de `getMockRoutes()`
