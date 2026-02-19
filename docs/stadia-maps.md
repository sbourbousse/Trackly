# Stadia Maps – Temps de trajet, itinéraires et isochrones

Ce document décrit l’intégration **Stadia Maps** (Valhalla) pour la gestion du temps (temps de trajet entre livraisons, itinéraires sur la carte, isochrones autour du siège social).

---

## Configuration

- **Variable d’environnement ou config** : `STADIA_MAPS_API_KEY` (ou clé dans `appsettings.json`).
- La clé est utilisée **uniquement côté backend** pour les appels Route, Matrix et Isochrone ; elle n’est pas exposée au client.
- Si la clé est absente, les fonctionnalités sont désactivées (endpoints renvoient un message explicite ou des tableaux vides).

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/routes/{routeId}/travel-times` | Temps de trajet entre chaque paire consécutive (siège → livraison 1 → … → N) + durée totale. Utilise Order.Lat/Lng ou géocode l'adresse à la volée (Nominatim). |
| `GET /api/routes/{routeId}/travel-times-matrix` | Matrice des temps entre tous les points (siège + livraisons). Un appel Stadia Maps Matrix ; le front dérive les temps pour tout ordre sans rappel API. |
| `GET /api/routes/{routeId}/route-geometry` | Géométrie (polyligne) de l’itinéraire pour affichage sur la carte. Retourne aussi `legs` (un segment par étape) pour tracer chaque tronçon en couleur semi-transparente distincte. Idem : coordonnées ou géocodage à la volée. |
| `GET /api/tenants/me/isochrones?minutes=10,20,30` | Polygones isochrones **uniquement s'ils sont stockés en base**. Le calcul est fait **exclusivement à l'enregistrement du siège social** (PUT headquarters). Si rien en base : contours vides + message. Max 4 contours, 60 min. |

Tous ces endpoints sont protégés et scopés au tenant (header `X-Tenant-Id` ou JWT).

---

## Données requises

- **Siège social** : `Tenant.HeadquartersLat`, `HeadquartersLng` (paramètres entreprise). Obligatoire pour inclure le siège en premier point des itinéraires.
- **Commandes** : champs optionnels `Order.Lat`, `Order.Lng`. S’ils sont renseignés, ils sont utilisés directement. Sinon, le backend géocode l'adresse (Order.Address) à la volée via Nominatim (OpenStreetMap) ; l’erreur « Coordonnées manquantes… » ou « Adresse introuvable pour le géocodage… » n’apparaît que si l’adresse est vide ou si Nominatim ne trouve pas de résultat.

---

## Cache

- **Nominatim** (géocodage à la volée) : lorsqu’une commande n’a pas de Lat/Lng, l’adresse est géocodée via Nominatim et le résultat (lat, lng) est mis en cache par adresse. **TTL : 24 h.**
- **Directions** (route-geometry et travel-times) : résultat Stadia Maps mis en cache en mémoire avec une clé dérivée du hash des coordonnées (siège + livraisons). **TTL : 1 heure.**
- **Matrix** (travel-times-matrix) : matrice des temps mise en cache (clé = hash des coordonnées en ordre canonique). **TTL : 1 heure.**
- **Isochrones** : **calculés et stockés en base** (table `TenantIsochrones`, JSONB) **uniquement lors du PUT /api/tenants/me/headquarters**. Le GET isochrones ne fait aucun appel API : il renvoie uniquement les contours stockés ; si aucun n’est enregistré, contours vides + message invitant à enregistrer le siège social. Voir [stockage-zones-et-trajets.md](stockage-zones-et-trajets.md).

---

## Optimisation de l’ordre de tournée

L’interface **détail tournée** permet de :
- **Choisir l’ordre** des livraisons (flèches haut/bas) et voir le **temps estimé entre chaque paire** (départ → 1ère livraison, 1ère → 2e, etc.) sans rappel API une fois la matrice chargée.
- **Optimiser l’ordre** via un bouton « Optimiser l’ordre » qui applique l’algorithme du **plus proche voisin** (depot → livraison la plus proche → … → retour depot). C’est une heuristique simple, rapide côté client (O(n²) avec la matrice), sans appel Stadia Maps supplémentaire.

Coût API : **un seul appel Matrix** par tournée (et par changement d’ensemble de points) ; tous les temps affichés et l’optimisation en découlent sans coût additionnel.

---

## Affichage des segments d’itinéraire

L’endpoint **route-geometry** renvoie en plus de la polyligne globale un tableau **legs** : chaque élément correspond à un segment entre deux étapes (dépôt → 1ère livraison, 1ère → 2e, …, dernière livraison → dépôt). Le frontend trace chaque segment en **couleur différente** et **semi-transparente** (opacité 0,7) pour distinguer visuellement les étapes du trajet. Les numéros d’étape (1, 2, 3…) restent affichés sur les points du tracé.

**Liaison route ↔ marqueurs :** Le routier (Stadia/Valhalla) « snap » les waypoints sur la chaussée, alors que les marqueurs utilisent les coordonnées exactes des adresses (géocodage). Pour éviter un décalage visuel, de courts segments en **pointillés** (connecteurs) sont tracés entre la fin de chaque tronçon et le marqueur de la livraison correspondante, afin que la route semble bien rejoindre chaque point de commande.

---

## Quotas et coûts

- Route, Matrix et Isochrone sont facturés par Stadia Maps (voir [pricing](https://stadiamaps.com/pricing/) et [limits](https://docs.stadiamaps.com/limits/)).
- Limites : Matrix (éléments selon plan) ; Route max 20 waypoints (auto) ; Isochrone max 4 contours, 60 min.
- Le cache ci-dessus limite les appels répétés pour les mêmes itinéraires ou isochrones.

---

## Fichiers concernés

| Fichier | Rôle |
|--------|------|
| `backend/Features/Mapbox/IMapboxService.cs` | Interface du service de routing (implémentée par Stadia) |
| `backend/Features/Mapbox/MapboxDtos.cs` | DTOs de résultat (route, matrix, isochrones) |
| `backend/Features/StadiaMaps/StadiaMapsService.cs` | Appels HTTP Stadia Maps (Route, Matrix, Isochrone) |
| `backend/Features/StadiaMaps/PolylineDecoder.cs` | Décodeur polyline encodée (Valhalla) |
| `backend/Features/Deliveries/RouteEndpoints.cs` | Endpoints travel-times, travel-times-matrix, route-geometry |
| `backend/Program.cs` | Enregistrement HttpClient Stadia Maps, endpoint isochrones |
| `frontend-business/src/lib/components/Map.svelte` | Affichage polylignes et polygones Leaflet |
| `frontend-business/src/lib/api/routes.ts` | Client API getRouteGeometry, getRouteTravelTimes, getRouteTravelTimesMatrix, getIsochrones |
| `frontend-business/src/routes/deliveries/routes/[routeId]/+page.svelte` | Détail tournée : matrice, temps par segment, « Optimiser l’ordre » |
