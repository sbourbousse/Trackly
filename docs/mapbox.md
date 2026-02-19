# Mapbox – Temps de trajet, itinéraires et isochrones

> **Note :** Le projet utilise désormais **Stadia Maps** pour le routing (Directions, Matrix, Isochrones). Voir [stadia-maps.md](stadia-maps.md) pour la configuration et les détails.

Ce document décrivait l’intégration Mapbox (conservé pour référence).

---

## Configuration

- **Variable d’environnement** : `MAPBOX_ACCESS_TOKEN` (ou clé dans `appsettings`).
- Le token est utilisé **uniquement côté backend** pour les appels Directions, Matrix et Isochrone ; il n’est pas exposé au client.
- Si le token est absent, les fonctionnalités Mapbox sont désactivées (endpoints renvoient un message explicite ou des tableaux vides).

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/routes/{routeId}/travel-times` | Temps de trajet entre chaque paire consécutive (siège → livraison 1 → … → N) + durée totale. Utilise Order.Lat/Lng ou géocode l'adresse à la volée (Nominatim). |
| `GET /api/routes/{routeId}/travel-times-matrix` | Matrice des temps entre tous les points (siège + livraisons). Un appel Mapbox Matrix ; le front dérive les temps pour tout ordre sans rappel API. |
| `GET /api/routes/{routeId}/route-geometry` | Géométrie (polyligne) de l’itinéraire pour affichage sur la carte. Retourne aussi `legs` (un segment par étape) pour tracer chaque tronçon en couleur semi-transparente distincte. Idem : coordonnées ou géocodage à la volée. |
| `GET /api/tenants/me/isochrones?minutes=10,20,30` | Polygones isochrones depuis le siège social (durées en minutes, max 4 contours, max 60 min). |

Tous ces endpoints sont protégés et scopés au tenant (header `X-Tenant-Id` ou JWT).

---

## Données requises

- **Siège social** : `Tenant.HeadquartersLat`, `HeadquartersLng` (paramètres entreprise). Obligatoire pour inclure le siège en premier point des itinéraires.
- **Commandes** : champs optionnels `Order.Lat`, `Order.Lng`. S’ils sont renseignés, ils sont utilisés directement. Sinon, le backend géocode l'adresse (Order.Address) à la volée via Nominatim (OpenStreetMap) ; l'erreur « Coordonnées manquantes… » ou « Adresse introuvable pour le géocodage… » n'apparaît que si l'adresse est vide ou si Nominatim ne trouve pas de résultat.

---

## Cache

- **Nominatim** (géocodage à la volée) : lorsqu'une commande n'a pas de Lat/Lng, l'adresse est géocodée via Nominatim et le résultat (lat, lng) est mis en cache par adresse. **TTL : 24 h.** Une même adresse ne déclenche qu'un seul appel Nominatim par jour ; le délai 1 req/s n'est appliqué que lors d'un vrai appel (pas quand le résultat vient du cache).
- **Directions** (route-geometry et travel-times) : résultat Mapbox mis en cache en mémoire avec une clé dérivée du hash des coordonnées (siège + livraisons). **TTL : 1 heure.** Les deux endpoints partagent le même cache pour une même liste de points.
- **Matrix** (travel-times-matrix) : matrice des temps mise en cache (clé = hash des coordonnées en ordre canonique). **TTL : 1 heure.**
- **Isochrones** : résultat Mapbox mis en cache en mémoire avec une clé tenant + siège (lat/lng) + paramètre `minutes`. **TTL : 1 heure.**

Après redémarrage de l’application, le cache est vide ; les prochains appels rechargent le cache.

---

## Optimisation de l'ordre de tournée

L’interface **détail tournée** permet de :
- **Choisir l’ordre** des livraisons (flèches haut/bas) et voir le **temps estimé entre chaque paire** (départ → 1ère livraison, 1ère → 2e, etc.) sans rappel API une fois la matrice chargée.
- **Optimiser l’ordre** via un bouton « Optimiser l’ordre » qui applique l’algorithme du **plus proche voisin** (depot → livraison la plus proche → … → retour depot). C’est une heuristique simple, rapide côté client (O(n²) avec la matrice), sans appel Mapbox supplémentaire. Elle ne garantit pas l’optimum global mais donne en pratique un ordre souvent bien meilleur que l’ordre initial.

Coût API : **un seul appel Matrix** par tournée (et par changement d’ensemble de points) ; tous les temps affichés et l’optimisation en découlent sans coût additionnel.

---

## Affichage des segments d’itinéraire

L’endpoint **route-geometry** renvoie en plus de la polyligne globale un tableau **legs** : chaque élément correspond à un segment entre deux étapes (dépôt → 1ère livraison, 1ère → 2e, …, dernière livraison → dépôt). Le frontend trace chaque segment en **couleur différente** et **semi-transparente** (opacité 0,7) pour distinguer visuellement les étapes du trajet. Les numéros d’étape (1, 2, 3…) restent affichés sur les points du tracé.

---

## Quotas et coûts

- Directions, Matrix et Isochrone sont facturés par Mapbox (voir [pricing](https://www.mapbox.com/pricing/)).
- Limites : Matrix max 25 points par requête (10 pour `driving-traffic`) ; Directions 2–25 waypoints ; Isochrone max 4 contours, 60 min.
- Le cache ci-dessus limite les appels répétés pour les mêmes itinéraires ou isochrones.

---

## Fichiers concernés

| Fichier | Rôle |
|--------|------|
| `backend/Features/Mapbox/IMapboxService.cs` | Interface du service Mapbox |
| `backend/Features/Mapbox/MapboxService.cs` | Appels HTTP Directions, Matrix, Isochrone |
| `backend/Features/Mapbox/MapboxDtos.cs` | DTOs de résultat |
| `backend/Features/Deliveries/RouteEndpoints.cs` | Endpoints travel-times, travel-times-matrix, route-geometry, résolution des coordonnées |
| `backend/Program.cs` | Enregistrement HttpClient Mapbox, endpoint isochrones |
| `frontend-business/src/lib/components/Map.svelte` | Affichage polylignes (itinéraires) et polygones (isochrones) Leaflet |
| `frontend-business/src/lib/api/routes.ts` | Client API getRouteGeometry, getRouteTravelTimes, getRouteTravelTimesMatrix, getIsochrones |
| `frontend-business/src/routes/deliveries/routes/[routeId]/+page.svelte` | Détail tournée : matrice, temps par segment, bouton « Optimiser l’ordre » (plus proche voisin) |
