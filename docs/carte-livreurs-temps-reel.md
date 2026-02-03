# Carte temps réel livreurs – fonctionnement

## Vue d’ensemble

La **page Carte unique** (`/map`) regroupe sur une seule carte :
- les **commandes** (adresses géocodées, avec couleurs de statut),
- les **tournées** (adresses des livraisons, avec couleurs de statut),
- le **suivi livreurs** (positions GPS en temps réel via SignalR).

Le suivi livreurs s’active via le toggle **« Suivi livreurs »** dans la barre d’actions en overlay. Les anciennes URLs `/orders/map`, `/deliveries/map` et `/drivers/map` redirigent vers `/map` avec le paramètre `?layer=orders`, `?layer=deliveries` ou `?layer=drivers` pour pré-activer le bon calque.

Les positions GPS en temps réel concernent les chauffeurs dont la **tournée est marquée « en cours »** côté backend. Une seule API **deliveries** fournit la liste des livraisons et leur statut ; le détail d’une livraison (dont le nom du chauffeur) est chargé à la demande.

---

## Flux côté frontend (business)

1. **Page Carte**  
   L’utilisateur ouvre `/map` et active éventuellement « Suivi livreurs » dans la barre d’actions.

2. **Période**  
   La page utilise la plage de dates du filtre global (`dateRangeState`), modifiable via le bouton « Période » dans l’overlay. Si aucune période n’est choisie → message « Période requise ».

3. **Chargement des tournées**  
   Un seul appel HTTP :
   - **`GET /api/deliveries?dateFrom=…&dateTo=…&dateFilter=…`**  
   → liste des livraisons pour la période, avec notamment `id`, `status`, `driverId`.

3. **« Tournées en cours »**  
   En frontend, une tournée est considérée « en cours » si :
   - `status === 'InProgress'` ou `status === 'En cours'`  
   (les autres statuts, ex. `Pending`, ne comptent pas).

   Les IDs de ces livraisons forment `inProgressIds`.

5. **Affichage**  
   - Si le toggle « Suivi livreurs » est activé et **aucune** livraison n’a le statut « en cours » : aucun marqueur livreur (la carte peut tout de même afficher commandes et tournées).
   - Si « Suivi livreurs » est activé et qu’il existe des tournées en cours : le client se connecte à SignalR et affiche les positions des livraisons dans `inProgressIds` sur la carte.

5. **Noms des chauffeurs**  
   Pour chaque livraison « en cours », un second appel (optionnel, pour les libellés) :
   - **`GET /api/deliveries/{id}`**  
   → détail (dont `driverName`).

7. **Temps réel (SignalR)**  
   - Connexion au hub avec `tenantId`.
   - Pour chaque `id` dans `inProgressIds`, appel côté client : **rejoindre le groupe** `delivery-{id}`.
   - Les positions reçues via le hub sont affichées sur la carte.

---

## Pourquoi le message « Aucune tournée en cours » alors qu’un chauffeur suit ?

La carte ne se base **pas** sur « un chauffeur est connecté à SignalR » ou « le chauffeur a ouvert le suivi », mais sur **le statut des livraisons renvoyé par l’API** :

- **`GET /api/deliveries`** ne renvoie des tournées « en cours » que si, en base, ces livraisons ont le statut **InProgress**.
- Si le chauffeur a simplement **démarré le suivi** dans l’app (connexion SignalR + envoi de positions) mais que **le backend n’a jamais mis à jour** le statut de la livraison de `Pending` → `InProgress`, alors :
  - l’API continue à renvoyer ces livraisons en **Pending** ;
  - le frontend calcule `inProgressIds` à partir des statuts → **aucune** tournée « en cours » ;
  - d’où le message « Aucune tournée en cours sur cette période ».

En résumé : **le statut « en cours » doit être mis à jour côté backend** (par exemple lorsque le chauffeur rejoint le groupe SignalR de la livraison ou envoie la première position). Tant que toutes les livraisons restent en `Pending`, la carte affichera « Aucune tournée en cours ».

---

## Comment une livraison passe en « en cours » (InProgress)

Deux mécanismes côté backend (redondants pour plus de robustesse) :

1. **Action explicite dans l’app chauffeur**  
   Quand le chauffeur clique sur **« Démarrer suivi »**, l’app appelle **`PATCH /api/deliveries/{id}/start`** (avec le header `X-Tenant-Id`), puis se connecte à SignalR. L’endpoint met la livraison en **InProgress** si elle est encore **Pending**. C’est l’action principale : « je démarre le suivi → la livraison est en cours ».

2. **Fallback dans le hub SignalR**  
   Lorsqu’un chauffeur appelle **`JoinDeliveryGroup(deliveryId)`** sur le hub (avec `tenantId` dans l’URL), le backend met aussi la livraison en **InProgress** si elle est encore **Pending**. Utile si l’app n’a pas appelé `/start` avant (ou en cas d’ordre d’appels différent).

Au prochain **`GET /api/deliveries`** (ou au rechargement de la page carte), ces livraisons apparaissent comme « en cours », `inProgressIds` n’est plus vide, la carte et SignalR s’activent.

**En pratique :** si tu as déjà la page `/map` ouverte quand le chauffeur démarre le suivi, il faut **rafraîchir la page** (ou modifier la période) pour que le front recharge la liste et affiche la tournée + les positions sur la carte.

Voir `TrackingHub.JoinDeliveryGroup` et la mise à jour du statut dans le module Tracking du backend.
