# Géocodage et tuiles – réduction des coûts et des requêtes

Ce document décrit les solutions mises en place pour limiter les coûts du géocodage et l’usage des tuiles cartographiques, et les pistes d’évolution.

---

## Géocodage (Nominatim)

### Contraintes

- **Nominatim** (OpenStreetMap) : gratuit, **1 requête/seconde** max.
- Appels directs depuis le frontend (cartes commandes/tournées) ou via l’API backend `/api/geocode`.

### Solutions en place

1. **Cache mémoire (session)**  
   Les résultats sont gardés en mémoire pendant la session pour éviter les appels répétés sur les mêmes adresses.

2. **Cache persistant (localStorage)**  
   - Clé : `trackly-geocode-cache`  
   - **TTL : 30 jours**  
   - **Max 500 entrées** (les plus anciennes sont évincées)  
   - Réduit fortement les appels Nominatim après les premières visites.

3. **Rate limiting 1 req/s**  
   Une file d’attente assure au plus **1 appel Nominatim toutes les ~1,1 s**. Les cartes qui géocodent beaucoup d’adresses (ex. 30 commandes) enchaînent les requêtes au lieu de les lancer en parallèle, ce qui évite le blocage (429) et respecte la politique d’usage.

### Ordre de résolution

Pour chaque adresse, `geocodeAddressCached()` :

1. Cherche dans le **cache mémoire**  
2. Puis dans le **cache localStorage** (avec TTL)  
3. Sinon appelle **Nominatim** (rate-limited), puis met en cache (mémoire + localStorage).

### En place (Mapbox / temps de trajet)

- **Order.Lat / Order.Lng** (optionnels) : stockés sur les commandes à la création si fournis ; utilisés par le backend pour calculer itinéraires et temps de trajet (Mapbox Directions/Matrix) sans géocoder à chaque requête.
- Si une commande n’a pas de lat/lng, les endpoints `route-geometry` et `travel-times` renvoient une erreur explicite (« Coordonnées manquantes ») ; le géocodage (Nominatim ou Mapbox Geocoding) peut être ajouté côté backend pour remplir ces champs à la volée.

### Pistes d’évolution

- **API backend** : utiliser `/api/geocode` depuis les pages carte pour centraliser le cache côté serveur (et éventuellement un cache Redis).
- **Provider payant** : pour un volume élevé, Mapbox Geocoding avec quota plus large.

---

## Tuiles cartographiques (OpenStreetMap)

### Contraintes

- Tuiles OSM : **usage raisonnable** attendu (voir [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)).
- Pas de cache côté app par défaut : le navigateur met en cache les URLs (tuiles) selon les en-têtes HTTP du serveur OSM.

### Solutions en place

1. **`keepBuffer: 2`** (Leaflet)  
   Réduit le nombre de tuiles gardées en mémoire autour de la vue. Moins de tuiles conservées hors écran, ce qui limite la bande passante lors des pans et la mémoire.

### Pistes d’évolution

- **Cache des tuiles** : service worker ou proxy backend pour mettre en cache les tuiles (avec respect de la politique OSM et des en-têtes Cache-Control).
- **Tuiles hébergées** : pour un trafic important, héberger un mirror ou utiliser un fournisseur (Mapbox, Maptiler, etc.) avec conditions d’usage adaptées.
- **maxNativeZoom** : limiter le niveau de zoom max si une résolution très fine n’est pas nécessaire, pour réduire le nombre de tuiles demandées.

---

## Fichiers concernés

| Fichier | Rôle |
|--------|------|
| `frontend-business/src/lib/utils/geocoding.ts` | Cache mémoire + localStorage, rate limit, `geocodeAddress` / `geocodeAddressCached` |
| `frontend-business/src/lib/components/Map.svelte` | Options tuiles Leaflet (`keepBuffer`, `maxZoom`) |
| `frontend-business/src/lib/api/geocode.ts` | Client API backend `/api/geocode` (création commande, etc.) |
| `backend/Features/Geocode/` | Endpoints de géocodage côté serveur |
