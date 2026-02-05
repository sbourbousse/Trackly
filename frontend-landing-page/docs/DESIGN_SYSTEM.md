# Design system — Trackly Landing

## Thème

- **Neutres** : stone (gris chaud, type shadcn stone)
- **Primaire / CTA** : teal
- Cohérence avec shadcn-svelte / shadcn-ui : radius small, composants sobres

## Typographie

- **Police** : Inter (titres et corps)
- Hiérarchie claire : h1 (hero), h2 (sections), h3 (sous-blocs)

## Tokens (partagés avec frontend-business)

- **Fichier** : `lib/design-tokens.css` — variables CSS `--trackly-stone-*` et `--trackly-teal-*` (alignées avec le thème stone + teal du dashboard).
- **Couleurs** : background stone (clair/sombre selon thème), texte stone-900 / stone-50, accent teal-600 / teal-500 pour CTA ; dégradés légers (from-stone-50 to-teal-50/20) pour fonds de cartes.
- **Rayon** : rounded-xl pour cartes et Bento Grid, rounded-sm pour boutons sobres.
- **Espacements** : cohérents entre sections (py-16 ou py-24) et à l’intérieur des blocs.

## Accessibilité

- Contrastes WCAG AA (texte sur fond)
- Labels sur les liens et boutons (aria-label si besoin)
- Structure de navigation claire (landmarks : header, main, footer)
- Focus visible sur les éléments interactifs

## Composants

- Boutons : primaire (teal) pour CTA, secondaire (outline stone) pour actions secondaires ; rounded-xl pour style SaaS moderne.
- Badges : « Livraison en cours », placeholders UI (barre de progression) dans les cartes Features.
- Cartes : fond en dégradé léger (stone/teal), bordure légère, rounded-xl.
- **Bento Grid** : section Features en grille à blocs de tailles variées ; chaque carte affiche un **aperçu lazy** (composants dans `components/previews/`).
- **Aperçus d’apps (lazy)** : `AppBusinessPreview` (dashboard), `AppDriverPreview` (PWA chauffeur), `AppTrackingPreview` (suivi client), `MapPreview` (image statique de la carte). Chargés via `next/dynamic` pour le LCP. La carte utilise une image (`public/map-preview.svg`) — remplacer par une capture d’écran réelle si besoin.
