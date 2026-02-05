# Architecture - Frontend Tracking

## Vue d'ensemble

Application cliente ultra-légère pour le suivi des livraisons en temps réel. Conçue pour être rapide, responsive et optimisée pour mobile.

## Stack Technique

- **Framework** : Next.js 15 (App Router)
- **UI** : Tailwind CSS + Framer Motion
- **Carte** : React Leaflet + OpenStreetMap
- **Langage** : TypeScript
- **Runtime** : React 18

## Structure du projet

```
frontend-tracking/
├── app/                      # Pages Next.js (App Router)
│   ├── page.tsx             # Page d'accueil
│   ├── track/[id]/          # Page de suivi dynamique
│   ├── layout.tsx           # Layout global
│   └── globals.css          # Styles globaux
├── components/              # Composants React
│   ├── TrackingHeader.tsx   # En-tête avec logo
│   ├── DeliveryMap.tsx      # Carte Leaflet
│   ├── DeliveryInfo.tsx     # Informations de livraison
│   ├── StatusBadge.tsx      # Badge de statut animé
│   ├── ActionButtons.tsx    # Boutons d'action rapide
│   ├── LoadingSpinner.tsx   # Spinner de chargement
│   └── ErrorMessage.tsx     # Message d'erreur
├── lib/                     # Logique et utilitaires
│   ├── api/                 # Client API
│   │   ├── client.ts        # Client HTTP générique
│   │   └── deliveries.ts    # API des livraisons
│   ├── hooks/               # Hooks React personnalisés
│   │   └── useAutoRefresh.ts # Rafraîchissement automatique
│   ├── types/               # Types TypeScript
│   │   └── api.ts           # Types API
│   ├── utils/               # Utilitaires
│   │   └── status.ts        # Gestion des statuts
│   └── design-tokens.css    # Variables CSS partagées
└── docs/                    # Documentation
    └── ARCHITECTURE.md      # Ce fichier
```

## Flux de données

### 1. Chargement initial

```
Utilisateur accède à /track/{deliveryId}
     ↓
useAutoRefresh appelle getDeliveryDetail(id)
     ↓
API GET /api/deliveries/{id}
     ↓
Affichage des données (carte + infos + boutons)
```

### 2. Rafraîchissement automatique

```
Toutes les 30 secondes :
     ↓
useAutoRefresh rappelle getDeliveryDetail(id)
     ↓
Mise à jour du statut et des informations
     ↓
Animation Framer Motion sur les changements
```

## Optimisations

### Performance

- **Code Splitting** : Carte chargée dynamiquement (pas de SSR)
- **Lazy Loading** : Composants lourds chargés à la demande
- **Memoization** : Hooks optimisés avec `useCallback`
- **Standalone Output** : Build optimisé pour le déploiement

### Mobile

- **Responsive** : Design mobile-first
- **Touch-friendly** : Boutons et interactions adaptés
- **Viewport** : Meta viewport configuré
- **Performance** : < 50kb compressé (hors carte)

### SEO

- **Meta tags** : Title et description optimisés
- **Open Graph** : Prêt pour le partage social (à ajouter)
- **Structured Data** : JSON-LD pour les moteurs de recherche (à ajouter)

## Design System

### Couleurs (Design Tokens)

Les couleurs sont partagées avec les autres applications Trackly :

- **Stone** (50-950) : Neutres
- **Teal** (50-950) : Primaire
- **Radius** : 0.5rem

### Animations

Utilise Framer Motion pour :
- Transitions de page
- Apparition des composants
- Feedback utilisateur (boutons, loading)

### Typographie

- Font système : `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'...`
- Tailles responsive (text-sm à text-4xl)

## Intégration Backend

### Endpoints utilisés

**Endpoint PUBLIC** (sans authentification) :

1. **GET /api/public/deliveries/{id}/tracking**
   - Détails complets pour le client final
   - Utilisé pour l'affichage principal
   - Rafraîchi toutes les 30s
   - Retourne : status, customerName, address, driverName, driverPhone, sequence, completedAt
   - Accessible sans TenantId (mappé AVANT TenantMiddleware)

### Variables d'environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Déploiement

### Build

```bash
npm run build
```

Génère un build standalone dans `.next/standalone/`.

### Production

```bash
npm start
```

Lance le serveur sur le port 3003.

### Docker (à venir)

Un Dockerfile sera ajouté pour le déploiement containerisé.

## Améliorations futures

### Phase 2

- [ ] Géocodage réel des adresses (Google Maps API ou Nominatim)
- [ ] Tracking GPS en temps réel via SignalR
- [ ] Notifications push (PWA)
- [ ] Mode offline avec Service Worker

### Phase 3

- [ ] Multi-langue (i18n)
- [ ] Dark mode
- [ ] Historique des livraisons
- [ ] Feedback client (note, commentaire)

## Sécurité

### CORS

L'API backend doit autoriser les requêtes depuis le domaine de l'app cliente.

### Rate Limiting

À implémenter côté backend pour éviter les abus.

### Validation

Les IDs de livraison sont validés côté backend (UUID).

## Tests (à implémenter)

- **Unit tests** : Jest + React Testing Library
- **E2E tests** : Playwright ou Cypress
- **Visual regression** : Chromatic ou Percy
