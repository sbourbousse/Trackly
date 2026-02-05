# Application Cliente de Suivi (frontend-tracking)

## Vue d'ensemble

L'application cliente (`frontend-tracking`) est une interface web ultra-légère permettant aux clients finaux de suivre leurs livraisons en temps réel.

## Caractéristiques principales

### 🎯 Objectifs

- **Simplicité** : Une URL, une page, pas d'app à télécharger
- **Performance** : < 50kb compressé, < 3s TTI
- **Modernité** : Design moderne avec animations fluides
- **Accessibilité** : Responsive, mobile-first, touch-friendly

### ✨ Fonctionnalités

1. **Carte interactive** (React Leaflet + OpenStreetMap)
2. **Rafraîchissement automatique** (toutes les 30 secondes)
3. **Informations de livraison** (client, adresse, livreur, statut)
4. **Actions rapides** :
   - Appeler le livreur (`tel:`)
   - Contacter le commerçant (`mailto:` ou `wa.me/`)
5. **Design moderne** (Framer Motion, animations 60fps)
6. **Logo Trackly** intégré subtilement

### 🎨 Design

- **Couleurs** : Design tokens partagés (stone + teal)
- **Typographie** : Système par défaut (optimisé)
- **Animations** : Framer Motion pour transitions fluides
- **Responsive** : Mobile-first, optimisé pour tous les écrans

## Architecture

### Stack technique

- **Framework** : Next.js 15 (App Router)
- **UI** : Tailwind CSS + Framer Motion
- **Carte** : React Leaflet + OpenStreetMap
- **Langage** : TypeScript
- **Runtime** : React 18

### Structure

```
frontend-tracking/
├── app/                # Pages Next.js
│   ├── page.tsx       # Accueil
│   └── track/[id]/    # Suivi dynamique
├── components/         # Composants React
├── lib/               # API, hooks, utils
└── docs/              # Documentation
```

### API

- **GET** `/api/deliveries/{id}` : Détails complets
- **GET** `/api/deliveries/{id}/tracking` : Statut simple (optionnel)

## Installation

```bash
cd frontend-tracking
npm install
cp .env.example .env.local
# Éditer .env.local et définir NEXT_PUBLIC_API_URL
npm run dev
```

L'application sera accessible sur **http://localhost:3004**

## Utilisation

### Format de l'URL de suivi

```
https://trackly.app/track/{deliveryId}
```

Exemple :
```
https://trackly.app/track/550e8400-e29b-41d4-a716-446655440000
```

### Partage aux clients

**Par SMS** :
```
Votre colis est en cours de livraison !
Suivez-le ici : https://trackly.app/track/{id}
```

**Par email** :
```html
<a href="https://trackly.app/track/{id}">
  Suivre ma livraison
</a>
```

## Documentation complète

Pour plus de détails, consulter :

- **Vue d'ensemble** : `frontend-tracking/README.md`
- **Démarrage rapide** : `frontend-tracking/QUICKSTART.md`
- **Fonctionnalités** : `frontend-tracking/FEATURES.md`
- **Architecture** : `frontend-tracking/docs/ARCHITECTURE.md`
- **Intégration** : `frontend-tracking/docs/INTEGRATION.md`
- **Synthèse** : `frontend-tracking/SUMMARY.md`

## Déploiement

### Vercel (recommandé)

```bash
vercel
```

### Railway

```bash
railway up
```

### Docker

Voir `frontend-tracking/docs/INTEGRATION.md` pour les instructions détaillées.

## Améliorations futures

### Phase 2

- Géocodage réel des adresses (Google Maps API ou Nominatim)
- Tracking GPS en temps réel via SignalR
- Notifications push (PWA)
- Mode offline avec Service Worker

### Phase 3

- Multi-langue (i18n)
- Dark mode complet
- Historique des livraisons
- Évaluation du service

## Support

Pour toute question ou problème :
- Consulter la documentation dans `frontend-tracking/docs/`
- Section Troubleshooting dans `docs/INTEGRATION.md`
- Ouvrir une issue GitHub

---

**Ready to ship! 🚀**
