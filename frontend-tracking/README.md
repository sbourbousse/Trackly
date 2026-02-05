# Trackly - Frontend Tracking (Client)

Application cliente ultra-légère pour le suivi des livraisons en temps réel.

## Caractéristiques

- **Next.js 15** avec App Router
- **Tailwind CSS** + **Framer Motion** pour les animations
- **React Leaflet** pour l'affichage de la carte
- Rafraîchissement automatique toutes les 30 secondes
- Optimisé pour mobile (< 50kb compressé)
- Design moderne avec le logo Trackly intégré

## Actions rapides

- **Appeler le livreur** : Lien tel: direct
- **Contacter le commerçant** : Lien mailto: ou WhatsApp

## Développement

```bash
npm install
npm run dev
```

L'application sera accessible sur http://localhost:3004

## API Backend

L'application consomme l'API backend Trackly :
- `GET /api/deliveries/{id}` - Détails complets de la livraison
- `GET /api/deliveries/{id}/tracking` - Statut de suivi simple

## URL de suivi

Format de l'URL : `https://trackly.app/track/{deliveryId}`

Cette URL est partagée au client par SMS ou email.

## Design System

Les couleurs utilisent les design tokens partagés avec les autres applications Trackly :
- **Stone** : Neutres (50 à 950)
- **Teal** : Primaire (50 à 950)
