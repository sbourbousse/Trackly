# Stratégie SEO — Landing Trackly

## Mots-clés cibles

- Gestion de livraisons
- Tournées
- TPE, artisans
- Suivi colis
- Livraison locale

## Meta

- **Title** : unique, incluant marque et proposition (ex. « Trackly — Gestion de livraisons pour TPE et artisans »)
- **Meta description** : 150–160 caractères, mots-clés pertinents, CTA ou bénéfice clair

## Réseaux sociaux

- **Open Graph** : `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- **Twitter Card** : `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

## Données structurées (JSON-LD)

Dans le `<head>` :

1. **Organization** — Nom, URL, logo
2. **WebSite** — URL du site, potentiel SearchAction
3. **SoftwareApplication** (optionnel) — Nom, description, applicationCategory

## URLs et canonical

- **URL principale** : `/` (page d’accueil)
- **Canonical** : pointer vers `https://[domaine]/` pour éviter le contenu dupliqué
- Si route `/accueil` existe : redirection ou même contenu avec canonical vers `/`

## Structure HTML sémantique

- `header`, `main`, `section`, `article`, `footer`
- Hiérarchie des titres : un seul `h1`, puis `h2` → `h3` de façon logique
- Labels et contrastes pour l’accessibilité (WCAG AA)

## Performance

- **Images** : format WebP si possible ; utiliser le composant `next/image` de Next.js (optimisation et lazy-load automatique hors viewport). Pour le partage social, placer une image `og-image.png` (1200×630 px) dans `public/`.
- **LCP** : CSS/JS minimal pour le contenu above-the-fold ; pas de script bloquant le rendu ; police Inter chargée via `next/font` pour éviter les reflows.
- **Rendu** : contenu above-the-fold rendu côté serveur (SSR/SSG) pour une indexation et un affichage immédiat.

## Choix SEO et structure de la landing

- **Stack** : Next.js (App Router) pour meta par page, JSON-LD dans le layout, rendu serveur.
- **Canonical** : une seule URL d’accueil (`/`) pour éviter la duplication.
- **Sections** : Hero, Problème/solution, Fonctionnalités, Tarification, Preuve/confiance, CTA final, Footer — chaque bloc en `section` avec titres hiérarchiques.
- **JSON-LD** : Organization + WebSite (+ SoftwareApplication) pour enrichir les résultats de recherche et les extraits.
