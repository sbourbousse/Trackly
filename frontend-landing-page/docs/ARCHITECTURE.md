# Architecture — Trackly Landing

## Stack

- **Next.js 14+** (App Router)
- **Tailwind CSS** + **shadcn/ui** (React)
- **TypeScript**

## Structure des dossiers (recommandée)

```
├── app/
│   ├── layout.tsx          # Layout racine, meta par défaut, JSON-LD
│   ├── page.tsx            # Page d’accueil (/)
│   ├── globals.css
│   └── accueil/            # Optionnel : page /accueil (redir ou même contenu + canonical)
│       └── page.tsx
├── components/
│   ├── ui/                 # Composants shadcn
│   ├── landing/            # Hero, Features, Pricing, Footer, etc.
│   └── seo/                # JsonLd, etc.
├── docs/                   # Documentation .md
├── public/
└── ...
```

## Routes

- **/** — Page d’accueil (landing complète)
- **/accueil** — Optionnel : redirection vers `/` ou même contenu avec `canonical` vers `/`

## Où sont les meta et le JSON-LD

- **Meta (title, description, OG, Twitter)** : dans `app/layout.tsx` (valeurs par défaut) et/ou dans `app/page.tsx` via `metadata` / `generateMetadata` pour la page d’accueil
- **JSON-LD** : composant `JsonLd` dans `app/layout.tsx`, injecté dans le body (valide pour les moteurs de recherche)
- **Canonical** : `metadata.alternates.canonical` dans le layout pointant vers `/`
- **Image OG** : `public/og-image.png` (1200×630 px) pour Open Graph et Twitter Card ; à créer si partage social souhaité
