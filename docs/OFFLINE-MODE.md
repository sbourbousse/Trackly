# Mode Offline Démo - Trackly

## Vue d'ensemble

Le mode offline démo permet de tester les applications Trackly sans serveur backend. Toutes les données sont simulées côté client avec des données factices réalistes.

## Activation

### Frontend Driver

1. Créer un fichier `.env` à la racine de `frontend-driver/` :
```bash
VITE_OFFLINE_MODE=true
```

2. Démarrer l'application :
```bash
cd frontend-driver
npm run dev
```

3. L'application affichera dans la console : `[Offline] 🔌 Mode offline ACTIVÉ - Utilisation des données de démonstration`

### Frontend Business

1. Créer un fichier `.env` à la racine de `frontend-business/` :
```bash
PUBLIC_OFFLINE_MODE=true
```

2. Démarrer l'application :
```bash
cd frontend-business
npm run dev
```

**Alternative** : Pour activer le mode offline dynamiquement sans redémarrer, ouvrir la console du navigateur et exécuter :
```javascript
localStorage.setItem('trackly_offline_mode', 'true');
location.reload();
```

## Données de démonstration

### Driver App
- **Livraisons** : 5 livraisons avec différents statuts (Pending, InProgress, Completed)
- **Chauffeur** : Jean Martin (ID: demo-driver-001)
- **Adresses** : Adresses parisiennes fictives
- **Actions disponibles** :
  - Voir la liste des livraisons
  - Démarrer une livraison
  - Compléter une livraison
  - Voir les détails d'une livraison

### Business App
- **Commandes** : 8 commandes avec différents statuts
- **Livraisons** : 4 livraisons associées aux commandes
- **Chauffeurs** : 3 chauffeurs (Jean Martin, Marie Dupont, Pierre Durand)
- **Actions disponibles** :
  - Créer des commandes
  - Créer des livraisons (tournées)
  - Assigner des chauffeurs
  - Supprimer des commandes/livraisons
  - Créer des chauffeurs

## Architecture

### Configuration centralisée
- `frontend-driver/src/lib/offline/config.ts` - Configuration et détection du mode offline
- `frontend-business/src/lib/offline/config.ts` - Configuration et détection du mode offline

### Données factices
- `frontend-driver/src/lib/offline/mockData.ts` - Données de démonstration pour le driver
- `frontend-business/src/lib/offline/mockData.ts` - Données de démonstration pour le business

### Mocks API
- `frontend-driver/src/lib/offline/mockApi.ts` - Simulation des appels API pour le driver
- `frontend-business/src/lib/offline/mockApi.ts` - Simulation des appels API pour le business

### Intégration
Tous les clients API (`client.ts`, `deliveries.ts`, `orders.ts`, `drivers.ts`) vérifient automatiquement si le mode offline est activé et utilisent les mocks appropriés.

## Désactivation

Pour désactiver le mode offline :

1. Supprimer ou commenter `VITE_OFFLINE_MODE=true` / `PUBLIC_OFFLINE_MODE=true` dans le fichier `.env`
2. Redémarrer l'application

Ou via localStorage :
```javascript
localStorage.removeItem('trackly_offline_mode');
location.reload();
```

## Notes importantes

- **Pas de persistence** : Les données sont rechargées à chaque rafraîchissement
- **Délai simulé** : 300ms de latence réseau pour simuler des vraies API calls
- **Pas de validation serveur** : Toutes les opérations réussissent
- **Mode développement uniquement** : Ce mode est destiné aux tests et démos, pas à la production

## Usage pour Copilot Agent

Lors du développement avec Copilot Agent, ce mode est la configuration recommandée pour éviter les dépendances au backend :

```bash
# Frontend Driver
cd frontend-driver
cp .env.offline .env
npm run dev

# Frontend Business
cd frontend-business
cp .env.offline .env
npm run dev
```
