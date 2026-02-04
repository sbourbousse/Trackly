# Détail tournée : progress bar, ETA temps réel, tri des livraisons

> Récapitulatif du **minimum** à mettre en place pour une interface de détail d’une tournée avec barre de progression (X/Y livrées), ETA / tracking temps réel du chauffeur, et tri de l’ordre des livraisons.
> Inspiré du lazy component **App chauffeur** de la landing (progress bar « 3 / 5 livrées », « Prochain arrêt : 12 min »).

---

## 1. Objectif

- **Page détail d’une tournée** : une vue dédiée à une tournée (route) avec :
  - **Progress bar** : « X / Y livrées » (comme sur la landing App chauffeur).
  - **Liste ordonnée des livraisons** : statut, ETA (ou ordre d’arrêt), lien vers détail.
  - **Tracking temps réel** : position du chauffeur (SignalR déjà en place) + optionnel « Prochain arrêt : N min ».
- **Tri / ordre des livraisons** : pouvoir modifier l’ordre des arrêts dans la tournée (drag-and-drop ou boutons monter/descendre).

---

## 2. Existant (à réutiliser)

| Élément | Où | Note |
|--------|-----|------|
| **SignalR tracking** | `frontend-business/src/lib/realtime/tracking.svelte.ts` | `joinDeliveryGroup(deliveryId)`, `pointsByDeliveryId`, `point` |
| **Carte + position** | `Map.svelte`, page `/deliveries/[id]` | Réutilisable pour la livraison en cours sur la page détail tournée |
| **Liste des tournées** | `/deliveries/routes` | Lien « Voir les livraisons » → `/deliveries?routeId=...` (liste plate) |
| **Liste des livraisons** | `/deliveries` | Filtre `routeId` ; une ligne = une livraison ; ETA actuellement **en dur** `'11:40'` dans le store |
| **Backend Route** | `Route` (Id, TenantId, DriverId, Name, CreatedAt) | Pas d’endpoint **détail** d’une route (GET par id) |
| **Backend Delivery** | `Delivery` (RouteId, Status, CreatedAt, CompletedAt) | **Pas de champ ordre** (Sequence) dans une tournée |

---

## 3. Backend — minimum à ajouter

### 3.1 Ordre des livraisons dans une tournée

- **Entité `Delivery`** : ajouter une propriété **`Sequence`** (ou `Order`) de type `int` (nullable pour rétrocompatibilité).
  - Lors de la création d’un batch : attribuer Sequence = 0, 1, 2, … selon l’ordre des `OrderIds`.
  - Migration EF : `AddSequenceToDelivery`.
- **Réponse API** : dans `DeliveryResponse` et `DeliveryDetailResponse`, exposer **`Sequence`** (ou `order` en JSON) pour que le front puisse afficher et réordonner.

### 3.2 Endpoint détail d’une tournée

- **GET `/api/routes/{id}`** (ou `GET /api/routes/{id}/deliveries`) :
  - Retourner la route (id, driverId, name, createdAt, driverName) **et** la liste des livraisons de cette route, **ordonnées par `Sequence`** (puis par CreatedAt si égal).
  - Chaque livraison : id, orderId, status, sequence, createdAt, completedAt, customerName, address, driverName ; optionnel **eta** (voir 3.4).

### 3.3 Réordonnancement

- **PATCH `/api/routes/{routeId}/deliveries/order`** (ou `PATCH /api/deliveries/reorder`) :
  - Body : `{ "deliveryIds": ["guid1", "guid2", ...] }` — ordre souhaité.
  - Vérifier que tous les `deliveryIds` appartiennent à la route `routeId` et au tenant.
  - Mettre à jour `Delivery.Sequence` pour chaque livraison (0, 1, 2, …).

### 3.4 ETA (optionnel pour le MVP)

- **Option A (simple)** : pas d’ETA temps réel côté backend ; le front affiche « Arrêt 3/5 » ou « Livraison 3 sur 5 ». ETA affiché peut rester « – » ou un placeholder.
- **Option B (estimé)** : champ `EstimatedArrivalAt` (nullable) sur `Delivery`, mis à jour par un job ou par l’app chauffeur quand il démarre un arrêt (hors scope minimal).
- **Option C (calculé)** : service qui calcule ETA à partir de la position GPS (SignalR) + géocodage des adresses ; plus lourd, à traiter après le MVP.

**Recommandation** : livrer d’abord **Option A** (ordre + progress bar + tracking position), puis ajouter ETA estimé (B ou C) si besoin.

---

## 4. Frontend — minimum à ajouter

### 4.1 Page « Détail d’une tournée »

- **Route** : `/deliveries/routes/[routeId]` (ou `/routes/[routeId]` si on préfère un segment dédié).
  - Créer `frontend-business/src/routes/deliveries/routes/[routeId]/+page.svelte` et `+page.ts` (désactiver SSR si utilisation SignalR).
- **Données** : appeler `GET /api/routes/{routeId}` (nouvel endpoint) pour obtenir la route + livraisons ordonnées. Sinon, en attendant l’API : `getRoutes()` + `getDeliveries({ routeId })` et trier côté client par `sequence` une fois le champ disponible.

### 4.2 Contenu de la page (aligné sur le lazy component App chauffeur)

1. **En-tête** : nom de la tournée, chauffeur, date.
2. **Progress bar** :
   - Calcul : `completedCount = livraisons.filter(s => s.status === 'Completed' | 'Livree').length`, `total = livraisons.length`.
   - Affichage : « X / Y livrées » + barre de progression (même style que `AppDriverPreview` : fond stone-200, barre teal-500, `width: (completedCount / total) * 100` %).
3. **Liste des livraisons** (ordre = Sequence) :
   - Pour chaque livraison : numéro d’arrêt (1, 2, 3…), statut (badge), client/adresse ou lien vers détail, ETA si disponible (sinon « – » ou « Arrêt N/Y »).
   - Lien vers `/deliveries/[id]` pour le détail d’une livraison.
4. **Tracking temps réel** :
   - Sur la page détail tournée : connecter SignalR (`trackingActions.connect()`), rejoindre le groupe de la **livraison en cours** (celle dont le statut = InProgress) si elle existe : `joinDeliveryGroup(deliveryId)`.
   - Afficher la carte (composant `Map`) avec la position du chauffeur (`trackingState.point`) et les marqueurs des livraisons de la tournée (optionnel).
   - Texte type : « Position chauffeur en direct » / « En attente de position… » comme sur la page détail livraison.
5. **Optionnel** : « Prochain arrêt : N min » si ETA disponible (sinon masquer ou afficher « Prochain arrêt : [client] » sans durée).

### 4.3 Composant réutilisable « Progress bar tournée »

- Créer un composant (ex. `RouteProgressBar.svelte` ou dans un bloc de la page) :
  - Props : `completedCount: number`, `totalCount: number`, optionnel `label?: string` (ex. « 3 / 5 livrées »).
  - Style : identique au lazy component landing (barre arrondie, teal, largeur en %).
  - Réutilisable sur la page détail tournée et, si besoin, sur la liste des tournées (colonne « Avancement »).

### 4.4 Tri / réordonnancement des livraisons

- Sur la page détail tournée : afficher les livraisons dans l’ordre `Sequence`.
  - **MVP** : boutons « Monter » / « Descendre » par ligne (ou drag-and-drop avec un composant Svelte, ex. sortable).
  - Au changement d’ordre : appeler `PATCH /api/routes/{routeId}/deliveries/order` avec le nouvel ordre des `deliveryIds`, puis recharger la route (ou mettre à jour le state local).
- Gestion des états : désactiver les boutons pendant la requête ; en cas d’erreur, afficher un message et garder l’ordre précédent.

### 4.5 API frontend (à ajouter / adapter)

- **`getRoute(routeId: string)`** : `GET /api/routes/{routeId}` → type `ApiRouteDetail` (route + livraisons ordonnées).
- **`reorderRouteDeliveries(routeId: string, deliveryIds: string[])`** : `PATCH /api/routes/{routeId}/deliveries/order` avec body `{ deliveryIds }`.
- **Store ou chargement** : soit un store dédié « route detail », soit chargement dans la page et réutilisation de `trackingState` existant.

### 4.6 Store deliveries et ETA

- Aujourd’hui le store mappe chaque livraison API en `DeliveryRoute` avec **`eta: '11:40'` en dur**. Pour la liste filtrée par `routeId`, on peut :
  - Soit garder un ETA factice jusqu’à ce que le backend expose un ETA ;
  - Soit afficher « Arrêt N » ou « – » quand on affiche une liste par tournée.
- Lors du chargement des livraisons par route (nouvel endpoint détail), utiliser `sequence` pour l’ordre et `eta` du DTO s’il existe.

---

## 5. Récap des tâches (ordre suggéré)

| # | Tâche | Détail |
|---|--------|--------|
| 1 | Backend : `Sequence` sur `Delivery` | Migration + remplir à la création (batch) + exposer dans DTOs |
| 2 | Backend : GET `/api/routes/{id}` | Détail route + livraisons ordonnées par Sequence |
| 3 | Backend : PATCH reorder | `/api/routes/{routeId}/deliveries/order` avec `deliveryIds[]` |
| 4 | Frontend : API `getRoute`, `reorderRouteDeliveries` | Types + appels dans `api/routes.ts` ou `api/deliveries.ts` |
| 5 | Frontend : page `/deliveries/routes/[routeId]` | En-tête, progress bar, liste livraisons, tracking (SignalR + carte optionnelle) |
| 6 | Frontend : composant Progress bar | Réutilisable (style App chauffeur) |
| 7 | Frontend : tri des livraisons | Boutons Monter/Descendre ou drag-and-drop + appel PATCH reorder |
| 8 | (Optionnel) ETA temps réel | Champ backend + calcul ou saisie ; affichage « Prochain arrêt : N min » |

---

## 6. Références

- Lazy component **App chauffeur** : `frontend-landing-page/components/previews/AppDriverPreview.tsx` (progress bar « 3 / 5 livrées », « Prochain arrêt : 12 min »).
- Page détail livraison (tracking) : `frontend-business/src/routes/deliveries/[id]/+page.svelte`.
- Tracking SignalR : `frontend-business/src/lib/realtime/tracking.svelte.ts`.
- Liste tournées : `frontend-business/src/routes/deliveries/routes/+page.svelte`.
- Backend Route/Delivery : `backend/Features/Deliveries/`.
