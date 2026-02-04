# Prompt : Landing page Trackly optimisée SEO

Ce document contient le prompt à utiliser pour initier la création d’une landing page présentant Trackly et optimisée pour le référencement (SEO).

---

## Prompt à copier-coller

```
Crée une landing page pour le projet Trackly, optimisée pour le référencement (SEO).

## Contexte du projet Trackly
- **Type** : SaaS de gestion de livraisons pour TPE et artisans
- **Cible** : Commerçants locaux, artisans, micro-entrepreneurs (~73 colis/mois)
- **Proposition de valeur** : Simplicité radicale et coût minimal vs solutions type Onfleet/Stuart
- **Offre** : Plan Starter gratuit (20–25 livraisons/mois), Plan Pro payant (~20€/mois) avec SMS
- **Produits** : Dashboard business (gestion de tournées), app chauffeur (PWA), page de suivi client en temps réel

## Exigences techniques SEO
- **Meta** : title unique, meta description 150–160 caractères, mots-clés pertinents (gestion livraisons, tournées, TPE, artisans, suivi colis)
- **Open Graph** et **Twitter Card** pour le partage social
- **Données structurées** : JSON-LD (Organization, WebSite, éventuellement SoftwareApplication)
- **HTML sémantique** : header, main, section, article, footer, balises heading hiérarchiques (h1 → h2 → h3)
- **Performance** : images optimisées (WebP, lazy-load), CSS/JS minimal pour le LCP, pas de blocage du rendu
- **Accessibilité** : contrastes, labels, structure de navigation claire
- **URL** : structure propre (ex. / ou /accueil), canonical, pas de contenu dupliqué

## Structure de la page (sections)
1. **Hero** : titre accrocheur, sous-titre, CTA principal (ex. « Essai gratuit » ou « Démarrer »)
2. **Problème / solution** : en 2–3 phrases, pourquoi Trackly pour les TPE
3. **Fonctionnalités** : 3–4 blocs (ex. tournées, suivi temps réel, app chauffeur, tarif simple)
4. **Tarification** : résumé Starter (gratuit) vs Pro (~20€/mois) avec CTA
5. **Preuve / confiance** : court témoignage ou « Pour les artisans et commerçants locaux »
6. **CTA final** : rappel de l’essai gratuit
7. **Footer** : liens légaux (Mentions légales, CGU, Politique de confidentialité), contact, réseaux si pertinent

## Contraintes
- Langue : français
- Ton : professionnel mais accessible, orienté TPE/artisans
- Rester cohérent avec l’existant : thème stone + teal, Inter, radius small (shadcn-svelte) si intégration dans le monorepo
- Si nouveau sous-projet : préciser la stack (ex. SvelteKit pour SSR et SEO, ou site statique)

## Livrables attendus
- Une page d’accueil (route / ou /accueil) avec le contenu et la structure ci-dessus
- Fichiers SEO : meta dans le layout ou la page, JSON-LD dans le head
- Un fichier ou section README/docs décrivant les choix SEO et la structure de la landing
```

---

## Utilisation

1. Copier le bloc du prompt ci-dessus (entre les triples backticks).
2. Coller dans Cursor (ou l’outil IA utilisé) en précisant si la landing doit être :
   - intégrée dans `frontend-business` (SvelteKit existant), ou
   - un nouveau projet (ex. `frontend-landing` ou site statique).
3. Ajouter si besoin : « Intègre la landing dans le projet frontend-business » ou « Crée un nouveau projet frontend-landing avec SvelteKit ».

## État actuel

La landing page a été créée dans le dossier **`frontend-landing-page/`** (projet Next.js 14+ App Router, React/TypeScript). Voir le [README du projet](../frontend-landing-page/README.md) et la doc interne dans `frontend-landing-page/docs/` (SEO, design, contenu). Le [project-log](project-log.md) décrit l’ajout dans une entrée datée du 2026-02-04.

## Références

- [docs/project-context.md](./project-context.md) – Vision et objectifs Trackly (inclut frontend-landing-page)
- [docs/README.md](./README.md) – Documentation générale
- [docs/metier/glossaire.md](./metier/glossaire.md) – Termes métier pour le contenu
