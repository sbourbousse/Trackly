# Quick Start - Frontend Tracking

## Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local et définir NEXT_PUBLIC_API_URL

# 3. Lancer en développement
npm run dev

# L'app sera accessible sur http://localhost:3004
```

## Test rapide

### Sans backend

1. Ouvrir http://localhost:3003
2. Voir la page d'accueil avec les fonctionnalités

### Avec backend

1. S'assurer que le backend tourne sur http://localhost:5000
2. Créer une livraison depuis le business dashboard
3. Copier l'ID de la livraison
4. Ouvrir http://localhost:3003/track/{deliveryId}

## URLs principales

- **Accueil** : http://localhost:3003
- **Suivi** : http://localhost:3003/track/{id}

## Fonctionnalités clés

✅ Rafraîchissement automatique (30s)
✅ Carte interactive Leaflet
✅ Informations de livraison
✅ Boutons d'action (Appeler / Contacter)
✅ Design moderne et responsive
✅ Animations Framer Motion
✅ Design tokens partagés

## Structure des fichiers

```
frontend-tracking/
├── app/                  # Pages (App Router)
│   ├── page.tsx         # Accueil
│   ├── track/[id]/      # Suivi dynamique
│   └── layout.tsx       # Layout global
├── components/          # Composants React
├── lib/                 # API, hooks, utils
└── docs/               # Documentation
```

## Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Lancer en production
npm start

# Linter
npm run lint
```

## Prochaines étapes

1. **Personnaliser le logo** : Remplacer le logo placeholder dans `TrackingHeader.tsx`
2. **Configurer le géocodage** : Intégrer une API pour les vraies positions
3. **Ajouter SignalR** : Tracking GPS en temps réel
4. **Configurer les contacts** : Rendre dynamiques les numéros/emails
5. **Déployer** : Sur Vercel, Railway ou Docker

## Documentation complète

- **Architecture** : `docs/ARCHITECTURE.md`
- **Intégration** : `docs/INTEGRATION.md`
- **README** : `README.md`

## Support

En cas de problème :
1. Vérifier que le backend est lancé
2. Vérifier la variable `NEXT_PUBLIC_API_URL`
3. Vérifier les erreurs dans la console
4. Consulter `docs/INTEGRATION.md` (section Troubleshooting)
