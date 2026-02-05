# Trackly — Landing Page

Landing page optimisée SEO pour **Trackly**, SaaS de gestion de livraisons pour TPE et artisans.

## Stack

- **Framework** : Next.js 14+ (App Router)
- **Styles** : Tailwind CSS + shadcn/ui (thème stone + teal)
- **Langue** : français

## Configuration

### Variables d'environnement

La landing page utilise des variables d'environnement pour configurer les URLs de redirection :

```bash
# Copier le fichier example
cp .env.example .env.local

# Modifier les valeurs dans .env.local selon votre environnement
```

Voir [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) pour plus de détails.

## Commandes

```bash
# Installation
npm install

# Développement
npm run dev

# Build (export statique possible)
npm run build

# Production
npm start

# Personnaliser les couleurs des illustrations unDraw
npm run customize-undraw
```

## Documentation

- [Contexte projet](docs/PROJECT_CONTEXT.md) — Produit, cible, proposition de valeur
- [Stratégie SEO](docs/SEO_STRATEGY.md) — Mots-clés, meta, JSON-LD, structure
- [Design system](docs/DESIGN_SYSTEM.md) — Thème stone/teal, typo, accessibilité
- [Architecture](docs/ARCHITECTURE.md) — Structure des dossiers et routes
- [Contenu landing](docs/CONTENT_LANDING.md) — Textes par section
- [Périmètre MVP](docs/MVP_SCOPE.md) — Arriving soon vs disponible
- [Illustrations unDraw](docs/UNDRAW_CUSTOMIZATION.md) — Personnalisation des couleurs et ajout de nouvelles illustrations
- [Variables d'environnement](docs/ENVIRONMENT_VARIABLES.md) — Configuration des URLs de redirection

## Choix SEO et structure

Voir [docs/SEO_STRATEGY.md](docs/SEO_STRATEGY.md) pour les choix SEO et la structure de la landing. En résumé : meta (title, description 150–160 car.), Open Graph et Twitter Card, JSON-LD (Organization, WebSite, SoftwareApplication), URL canonique `/`, redirection `/accueil` → `/`. Structure de la page : Hero (proximité, 2 CTA, réassurance), Par métier (3 blocs), Fonctionnalités (Bento Grid), Tarification, Preuve/confiance, CTA final, Footer (HTML sémantique, hiérarchie h1 → h2 → h3).
