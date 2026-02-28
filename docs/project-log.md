# Project Log - Journal des Modifications

> **Usage** : Résumé de ce qui a été fait après chaque tâche complétée.
> Format : Date | Tâche | Fichiers modifiés | Notes

## 2026-02-28 | Finalisation landing : pages légales, suppression FAQ, contact

**Tâche** : Finaliser la landing : créer les pages CGU, Mentions légales et Politique de confidentialité (contenus conformes droit français), retirer la FAQ, garder le contact par email uniquement.

**Fichiers modifiés** :
- `frontend-landing-page/app/page.tsx` – retrait de la section `<Faq />`
- `frontend-landing-page/components/landing/Footer.tsx` – suppression du lien FAQ, conservation Contact (mailto) + liens vers mentions-legales, cgu, confidentialite
- `frontend-landing-page/lib/config.ts` – retrait de `faq` dans `internalLinks`
- `frontend-landing-page/components/landing/Faq.tsx` et `frontend-landing-page/lib/faq.ts` – supprimés
- `frontend-landing-page/components/landing/LegalPageLayout.tsx` – nouveau composant (Header + main + Footer, titre + article)
- `frontend-landing-page/app/mentions-legales/page.tsx` – page Mentions légales (LCEN : Arrivo micro-entreprise, Vercel hébergeur)
- `frontend-landing-page/app/cgu/page.tsx` – page CGU (objet, acceptation, freemium, obligations, PI, responsabilité, résiliation, droit français, médiation à indiquer)
- `frontend-landing-page/app/confidentialite/page.tsx` – page Politique de confidentialité (RGPD : responsable, finalités, données, durées, Vercel/Railway, droits, pas de cookies site vitrine)
- `frontend-landing-page/app/sitemap.ts` – ajout des URLs /mentions-legales, /cgu, /confidentialite
- `frontend-landing-page/docs/CONTENT_LANDING.md` – footer et liens légaux à jour, FAQ retirée
- `docs/project-log.md` – présente entrée

**Résultat** :
- Les liens du footer mènent vers des pages réelles (plus de 404).
- Contact : email uniquement (contact@arrivo.fr).
- FAQ retirée de la home et du footer.
- Contenus juridiques (Arrivo, micro-entreprise) ; hébergeur site = Vercel, backend = Railway. Version bêta gratuite : pas de placeholders, marque Arrivo uniquement (contact@arrivo.fr, arrivo.fr).

---

## 2026-02-28 | Quota livraisons (API + badge dashboard réactif)

**Tâche** : Système de quota pour les livraisons : endpoint quota, badge dashboard affichant le nombre de livraisons restantes (mis à jour à chaque chargement).

**Fichiers modifiés** :
- `backend/Features/Billing/DeliveryQuotaResult.cs` – DTO (Plan, MonthlyLimit, UsedThisMonth, Remaining)
- `backend/Features/Billing/IBillingService.cs` – `GetDeliveryQuotaAsync`
- `backend/Features/Billing/BillingService.cs` – calcul livraisons du mois en cours, limite 25 pour Starter, illimité pour Pro
- `backend/Program.cs` – `GET /api/billing/quota` (après TenantMiddleware)
- `frontend-business/src/lib/api/billing.ts` – `getDeliveryQuota()`, type `DeliveryQuotaResponse`
- `frontend-business/src/lib/offline/mockApi.ts` – `mockBillingApi.getDeliveryQuota()` (dérivé des livraisons mock du mois)
- `frontend-business/src/routes/dashboard/+page.svelte` – état `quota`, chargement dans `loadDashboardData`, badge dérivé `quotaBadgeText` (Plan X · N livraisons restantes / Illimité)

**Résultat** :
- Le badge « Plan Starter · 7 livraisons restantes » est remplacé par les données réelles (ou « … » pendant le chargement, « Illimité » pour Pro).
- Rechargement du dashboard (changement de période ou entrée sur la page) met à jour le quota.

---

## 2026-02-28 | SEO landing page (sitemap, robots, FAQ, BreadcrumbList)

**Tâche** : Optimiser le référencement de la landing page : sitemap.xml et robots.txt dynamiques, section FAQ avec schéma FAQPage, BreadcrumbList en JSON-LD, lien FAQ dans le footer.

**Fichiers modifiés** :
- `frontend-landing-page/app/sitemap.ts` – sitemap dynamique (URL canonique, changeFrequency weekly, priority 1)
- `frontend-landing-page/app/robots.ts` – robots.txt avec allow / et sitemap
- `frontend-landing-page/lib/faq.ts` – données FAQ (5 questions/réponses)
- `frontend-landing-page/components/landing/Faq.tsx` – section FAQ (h2, dl/dt/dd) + script JSON-LD FAQPage
- `frontend-landing-page/components/seo/JsonLd.tsx` – ajout BreadcrumbList (Accueil)
- `frontend-landing-page/lib/config.ts` – internalLinks.faq = "#faq"
- `frontend-landing-page/app/page.tsx` – intégration Faq entre Trust et CtaFinal
- `frontend-landing-page/components/landing/Footer.tsx` – lien FAQ dans la nav

**Résultat** :
- `/sitemap.xml` et `/robots.txt` générés par Next.js (NEXT_PUBLIC_SITE_URL pour l’URL de base).
- Section « Questions fréquentes » avec schéma FAQPage pour les extraits enrichis Google.
- Fil d’Ariane structuré (BreadcrumbList) pour la home.
- Ancrage #faq et lien footer vers la FAQ.

---

## 2026-02-28 | Vérification email à l'inscription

**Tâche** : Ajouter une étape de confirmation par email lors de l'inscription : envoi d'un code à 6 chiffres, saisie du code avant d'accéder au tableau de bord. En mode dev, le code s'affiche dans la console backend.

**Fichiers modifiés** :
- `backend/Features/Auth/TracklyUser.cs` – champs `EmailVerificationCode` et `EmailVerificationSentAt`
- `backend/Features/Auth/AuthDtos.cs` – `RegisterPendingResponse`, `VerifyEmailRequest`
- `backend/Program.cs` – register retourne `RegisterPendingResponse` et log le code en dev ; nouvel endpoint `POST /api/auth/verify-email` ; login refusé (403) si email non vérifié
- `backend/Infrastructure/MultiTenancy/TenantMiddleware.cs` – route `/api/auth/verify-email` publique
- `backend/Migrations/20260228100000_AddEmailVerificationToUser.cs` + snapshot
- `frontend-business/src/lib/api/client.ts` – types `RegisterPendingResponse`, `verifyEmailCode()` ; `registerAccount` retourne `RegisterPendingResponse`
- `frontend-business/src/lib/offline/mockApi.ts` – mock register → pending, `verifyEmail()` avec code `123456` (log en console en mock)
- `frontend-business/src/routes/login/+page.svelte` – 3 étapes : Compte → Vérification email → Siège social ; formulaire code 6 chiffres (Label, Input, Alert, Button Shadcn) ; gestion erreur 403 login

**Résultat** :
- Inscription : après création du compte, l'utilisateur voit l'étape « Vérification email » et saisit le code reçu (en dev : code affiché dans la console backend ; en mock : code `123456`).
- Après vérification, même flux qu'avant (token, puis étape Siège social optionnelle).
- Connexion refusée tant que l'email n'est pas vérifié (message d'erreur explicite).

---

## 2026-02-20 | Sidebar gauche (listes/création) et droite (calendrier seul, date commande)

**Tâche** : Réorganiser la sidebar gauche (3 listes + 3 pages création) et simplifier la sidebar période à droite (calendrier uniquement, filtre toujours par date commande).

**Fichiers modifiés** :
- `frontend-business/src/lib/components/AppSidebar.svelte` – deux groupes : « Listes » (Dashboard, Carte, Commandes, Livraisons, Livreurs) et « Création » (Créer commande, Créer tournée, Créer livreur) ; plus de sous-menus déroulants
- `frontend-business/src/lib/components/DateFilterSidebar.svelte` – suppression des raccourcis (déjà dans le widget rapide), suppression du sélecteur « Filtrer par date création / date commande », suppression du graphique intégré ; ne garde que le calendrier pour choisir un jour
- `frontend-business/src/lib/stores/dateRange.svelte.ts` – valeur par défaut `dateFilter: 'OrderDate'` ; à la restauration depuis le storage, forçage à « date commande »
- `frontend-business/src/lib/components/PageWithPeriodSidebar.svelte` – retrait de la prop `onDateFilterChange` passée à `DateFilterSidebar`

**Résultat** :
- ✅ Sidebar gauche : listes et création clairement séparées
- ✅ Sidebar droite : uniquement le calendrier pour un jour précis ; les raccourcis restent dans le widget de période en haut
- ✅ Filtrage toujours par date commande (plus d’option « date création »)

---

## 2026-02-20 | Timeline visuelle Dashboard (période sélectionnée)

**Tâche** : Ajouter une timeline visuelle dans l’onglet Dashboard > Livraisons, alignée sur la période sélectionnée, avec affichage des tournées et des commandes positionnées dans chaque tournée.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – ajout d’une carte "Timeline des tournées" avec regroupement par `routeId`, ordre des commandes par `sequence`, statuts et liens vers détail tournée/commande
- `docs/project-log.md` – journalisation de la modification
- `ROADMAP.md` – mise à jour de la roadmap (fonctionnalité timeline dashboard)

**Implémentation** :
1. Chargement dédié des livraisons filtrées par la période courante (`getListFilters()`), avec gestion loading/error/race condition.
2. Regroupement des livraisons par tournée (`routeId`) et tri des commandes selon `sequence` puis date de création.
3. Affichage visuel en timeline : une section par tournée + items commandes positionnés avec index d’arrêt, statut et métadonnées client/adresse.
4. Réutilisation du design system existant (`Card`, `Badge`, `Button`, `StatusBadge`, `RelativeTimeIndicator`) pour rester cohérent avec l’UI actuelle.

**Résultat** :
- ✅ Vue timeline claire sur la période sélectionnée
- ✅ Visibilité immédiate de la composition de chaque tournée
- ✅ Position des commandes dans la tournée visible (ordre d’arrêt)
- ✅ Navigation rapide vers les pages détail (`/deliveries/routes/[id]`, `/orders/[id]`)

---

## 2026-02-20 | Refonte Dashboard timeline (sans onglets, sans card imbriquée)

**Tâche** : Revoir complètement le dashboard pour supprimer le système d’onglets, enlever le titre de section timeline, éviter les cards imbriquées et afficher les tournées directement sur le fond.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – suppression des onglets, suppression des sections legacy, layout direct en `flex-wrap` avec `max-width` par tournée
- `docs/project-log.md` – journalisation de la refonte

**Implémentation** :
1. Suppression du bloc `Tabs` (plus de double onglet).
2. Suppression des cards imbriquées (plus de `Card` englobante + card interne).
3. Suppression du titre de section timeline.
4. Rendu direct des tournées sous forme de blocs alignés sur le background.
5. Mise en page responsive : `flex-wrap` + `min/max width` par tournée (`min-w-[320px]`, `max-w-[560px]`, `basis-[420px]`).

**Résultat** :
- ✅ Dashboard centré sur la timeline
- ✅ Interface plus lisible et plus dense
- ✅ Plus de structure "card dans card"
- ✅ Meilleure adaptation desktop/tablette via wrapping des tournées

---

## 2026-02-20 | Dashboard timeline : affichage chauffeur par tournée

**Tâche** : Afficher le chauffeur sur chaque card tournée dans le dashboard timeline.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – chargement des routes (`getRoutes`) pour enrichir les cards avec `driverName`
- `docs/project-log.md` – journalisation de l’évolution

**Résultat** :
- ✅ Chaque tournée affiche maintenant le nom du chauffeur directement dans la card
- ✅ Fallback explicite si info manquante : `Livreur non assigne`

---

## 2026-02-20 | Dashboard par rubriques (KPI, alertes, affectation, livreurs, performance)

**Tâche** : Mettre en place une refonte complète du dashboard en rubriques métier avec vue synthétique + actions.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – ajout des rubriques KPI, alertes, commandes en attente, livreurs, actions rapides, graphiques de performance, conservation de la timeline
- `docs/project-log.md` – journalisation de la refonte
- `ROADMAP.md` – mise à jour du suivi roadmap

**Implémentation** :
1. Chargement consolidé des données dashboard (livraisons, tournées, livreurs, stats commandes, stats livraisons) selon la période sélectionnée.
2. Ajout d’une grille KPI en tête (tournées, commandes à affecter, livraisons en cours, taux de réussite).
3. Colonne opérationnelle avec rubriques : Alertes, Commandes en attente d’affectation, Livreurs, Actions rapides.
4. Rubrique performance sur 7 jours avec deux graphiques (`OrdersChartContent`) : commandes et livraisons.
5. Conservation de la timeline de tournées avec les améliorations précédentes (chauffeur, date, tranche 4h, position des commandes).

**Résultat** :
- ✅ Dashboard structuré en rubriques lisibles
- ✅ Vision “pilotage” + “action” sur un seul écran
- ✅ Priorisation visuelle des problèmes (alertes)
- ✅ Passage plus simple vers les workflows clés (affectation, création tournée, import, carte)

---

## 2026-02-20 | Dashboard desktop : style template KPI + grille rééquilibrée

**Tâche** : Aligner les KPI avec le style du template `dashboard-01` et corriger l’organisation desktop pour mieux exploiter toute la largeur.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – style KPI type template (`CardDescription`, `CardAction`, gradient), refonte de la disposition desktop en sections pleine largeur et grille homogène
- `docs/project-log.md` – journalisation de l’évolution

**Résultat** :
- ✅ KPI visuellement proches du template `dashboard-01`
- ✅ Disparition de la colonne droite “quart d’écran” trop étroite
- ✅ Rubriques mieux réparties sur desktop (timeline pleine largeur + grilles équilibrées)

---

## 2026-02-20 | Dashboard : ajustement affectation + croisillon overdue dans le graphe

**Tâche** : Exclure les commandes planifiées de la rubrique “en attente d’affectation” et améliorer le code couleur du graphique du haut pour les statuts dépassés dans le temps.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – les commandes `Planned` ne sont plus comptées comme “à affecter”
- `frontend-business/src/lib/components/OrdersChartContent.svelte` – ajout de variantes `pending_overdue` et `planned_overdue` avec croisillon rouge sur fond bleu/gris
- `docs/project-log.md` – journalisation de l’évolution

**Résultat** :
- ✅ “Commandes à affecter” = uniquement les vraies commandes en attente (pas les planifiées)
- ✅ Graphique du haut : en attente/planifiée dépassées visibles avec un motif croisillon rouge

---

## 2026-02-20 | Homogénéisation statuts + filtre affectation dashboard

**Tâche** : Harmoniser les termes de statut (`Planifiée`), exclure les commandes en attente déjà dépassées de la rubrique d’affectation, et appliquer la couleur de statut sur la tête de chaque tournée dans le dashboard.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte` – exclusion des commandes en attente dépassées du card “Commandes à affecter”, pastille de couleur liée au statut tournée
- `frontend-business/src/lib/components/StatusBadge.svelte` – statut livraison pending affiché en `Planifiée` (au lieu de `Prévue`)
- `frontend-business/src/lib/components/OrdersChartContent.svelte` – libellé livraison pending aligné sur `Planifiée`
- `frontend-business/src/lib/components/RouteProgressIndicator.svelte` – libellé pending aligné sur `Planifiée`
- `frontend-business/src/routes/deliveries/+page.svelte` – libellé `pending` aligné sur `Planifiée`
- `frontend-business/src/lib/components/map/MapFilters.svelte` – filtre `planned` aligné sur `Planifiée`

**Résultat** :
- ✅ Les commandes en attente mais déjà dépassées ne gonflent plus la rubrique “à affecter”
- ✅ Vocabulaire homogène dans l’UI : `Planifiée`
- ✅ Timeline dashboard : couleur de statut visible directement sur chaque tournée

---

## 2026-02-20 | Correctif couleurs badges statuts (Livrée en vert)

**Tâche** : Restaurer les variantes de couleur des badges après l’overwrite du template, pour retrouver le code couleur métier attendu.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/ui/badge/badge.svelte` – réintégration des variantes `info`, `warning`, `success`

**Résultat** :
- ✅ Les badges `Livrée` redeviennent verts (`success`)
- ✅ Les badges `En cours` / `En attente` récupèrent aussi leurs couleurs dédiées

---

## 2026-02-20 | Badge statut : croisillon overdue aussi en détail tournée

**Tâche** : Appliquer le quadrillage rouge directement sur `StatusBadge` pour les statuts planifiés/en attente dépassés (logique tranche 4h), y compris dans le détail d’une tournée.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/StatusBadge.svelte` – ajout d’une prop `date` et d’une classe `overdue-hatch` conditionnelle
- `frontend-business/src/routes/deliveries/routes/[routeId]/+page.svelte` – passage de `delivery.createdAt` au badge statut
- `frontend-business/src/routes/dashboard/+page.svelte` – passage des dates au badge statut de la timeline

**Résultat** :
- ✅ Le badge statut dans le détail tournée affiche bien le croisillon rouge quand la commande/livraison planifiée est dans une tranche 4h déjà dépassée

---

## 2026-02-20 | Harmonisation badges commandes/livraisons + tranche neutre

**Tâche** : Finaliser l’harmonisation des badges statut et du graphe du haut, avec quadrillage overdue cohérent et couleurs métier.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/StatusBadge.svelte` – Commandes : `Planifiée` en bleu (`info`), `En attente` en gris (`outline`), quadrillage overdue conservé
- `frontend-business/src/lib/components/OrdersChartContent.svelte` – même quadrillage rouge sans bordure sur le graphe du haut, inversion des couleurs `pending/planned` selon la convention
- `frontend-business/src/routes/orders/+page.svelte` – colonne Tranche en style neutre (suppression code couleur rouge/jaune), badge commande avec date pour overdue
- `frontend-business/src/routes/orders/[id]/+page.svelte` – badge commande/livraison avec date pour overdue
- `frontend-business/src/routes/deliveries/new/+page.svelte` – badge commande avec date pour overdue
- `frontend-business/src/routes/deliveries/+page.svelte` – badge livraison avec date pour overdue
- `frontend-business/src/routes/deliveries/[id]/+page.svelte` – badge livraison avec date pour overdue
- `frontend-business/src/routes/dashboard/+page.svelte` – badge commande avec date dans la rubrique d’affectation

**Résultat** :
- ✅ Graphique du haut : quadrillage rouge visible sans bordure
- ✅ Commande : `Planifiée` bleu, `En attente` gris, overdue hatch
- ✅ Livraisons : quadrillage overdue visible là où la date est disponible
- ✅ Colonne Tranche neutralisée visuellement (pas de code couleur d’urgence)

---

## 2026-02-20 | Dashboard : nettoyage actions rapides + icônes KPI

**Tâche** : Retirer l’action “Importer CSV” du dashboard et ajouter des icônes sur les cards KPI du haut.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte`

**Résultat** :
- ✅ Bouton “Importer CSV” retiré des actions rapides dashboard
- ✅ KPI enrichis visuellement avec icônes (`Route`, `Box`, `Truck`, `CheckCircle`)

---

## 2026-02-20 | KPI taux de réussite : exclusion des commandes dépassées

**Tâche** : Ajuster le calcul du KPI “Taux de réussite” pour exclure les commandes `Planifiée` / `En attente` déjà dépassées.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte`

**Résultat** :
- ✅ Les commandes planifiées/en attente dépassées ne sont plus prises en compte dans la base de calcul du taux de réussite

---

## 2026-02-20 | KPI taux de réussite : commandes dépassées comptées en échec

**Tâche** : Ajuster le KPI “Taux de réussite” pour considérer les commandes `Planifiée` / `En attente` dépassées comme des échecs.

**Fichiers modifiés** :
- `frontend-business/src/routes/dashboard/+page.svelte`

**Résultat** :
- ✅ Les commandes planifiées/en attente dépassées pénalisent désormais le taux de réussite (comptées dans les échecs)

---

## 2026-02-20 | Widget période : style, largeur fixe, indicateur et bug premier chargement

**Tâche** : Améliorer le widget de sélection de période (ergonomie + visuel) et corriger l’affichage `...` au premier chargement.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/PeriodBadge.svelte` – fond modernisé, largeur fixe, flèches toujours visibles (désactivées aux bornes), indicateur à points du preset actif
- `frontend-business/src/lib/stores/dateRange.svelte.ts` – `dateRangeUI.ready` activé même sans valeur en localStorage

**Résultat** :
- ✅ Widget visuellement plus lisible
- ✅ Taille stable pour faciliter le clic sur les flèches, même quand le libellé change
- ✅ Indicateur de “position” par points sous le widget
- ✅ Plus besoin de recharger la page au premier login pour sortir du `...`

---

## 2026-02-20 | Widget période : design system Past / Present / Future

**Tâche** : Ajouter un code couleur intelligent au widget période selon la temporalité (Passé, Présent, Futur).

**Fichiers modifiés** :
- `frontend-business/src/lib/components/PeriodBadge.svelte`

**Implémentation** :
- Détection de tonalité basée sur les presets (et fallback intelligent pour la plage personnalisée).
- Couleurs sémantiques appliquées au widget :
  - **Passé** : ambre
  - **Présent** : émeraude
  - **Futur** : bleu ciel
- Application cohérente sur la bordure du widget, le badge central, et le point actif de l’indicateur.

**Résultat** :
- ✅ Lecture temporelle immédiate (sans lire le texte)
- ✅ Cohérence visuelle du widget avec un système de couleurs métier stable

---

## 2026-02-20 | Widget graphique haut : skeleton loading sans saut de layout

**Tâche** : Éviter les micro-périodes de “flash” lors du chargement du graphique de la barre du haut en remplaçant le texte de chargement par des placeholders visuels.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/OrdersChartContent.svelte`

**Résultat** :
- ✅ Plus de texte “Chargement…” qui change la hauteur du widget
- ✅ Skeleton barres avec hauteur stable pendant le loading
- ✅ Transition visuelle plus fluide dans la barre haute

---

## 2026-02-20 | Widget graphique haut : hauteur verrouillée pendant loading

**Tâche** : Éliminer la micro-variation de taille restante pendant le chargement du widget graphique.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/OrdersChartContent.svelte`

**Résultat** :
- ✅ Hauteur fixe explicite pendant le loading (compact et normal)
- ✅ Plus de variation perceptible du widget dans la barre du haut

---

## 2026-02-12 | Turborepo et CI

**Tâche** : Mise en place d’un monorepo Turborepo pour build, lint et tests, et d’un workflow CI unique.

**Fichiers créés** :
- `package.json` (racine) – workspaces npm, scripts turbo, devDependency turbo
- `turbo.json` – pipeline (build, dev, lint, test) et cache
- `.github/workflows/ci.yml` – CI : install, build, lint, test via turbo
- `TURBOREPO.md` – doc structure, commandes, déploiement Vercel/Railway

**Fichiers modifiés** :
- `frontend-business/package.json` – scripts `lint` (svelte-check), `test` (playwright)
- `frontend-driver/package.json` – scripts `lint`, `test`, devDependency `@playwright/test`
- `frontend-tracking/package.json` – script `test`, devDependency `@playwright/test`
- `frontend-landing-page/package.json` – script `test` (no-op), format
- `.gitignore` – entrée `.turbo`

**Workflow** : À la racine, `npm install` puis `npm run build` / `npm run lint` / `npm run test`. Backend reste dans `backend/` (hors workspaces, déployé sur Railway). Fronts déployables sur Vercel avec Root Directory par projet.

---

## 2026-02-12 | Cohérence des Icônes dans l'Application

**Tâche** : Ajouter des icônes cohérentes dans toute l'application pour les concepts clés : Commandes, Livraisons, Tournées, Livreurs.

**Problème** : L'application manquait d'indicateurs visuels cohérents pour identifier rapidement le type de contenu, rendant la navigation moins intuitive.

**Fichier créé** :
- `ICONS_CONSISTENCY.md` – Documentation complète du système d'icônes

**Fichiers modifiés** :
- `frontend-business/src/lib/components/PageHeader.svelte` – Ajout d'une prop `icon` optionnelle
- `frontend-business/src/lib/components/TopNav.svelte` – Ajout d'icônes dans la navigation
- `frontend-business/src/lib/components/AppSidebar.svelte` – Mise à jour des icônes pour cohérence
- Toutes les pages principales (`routes/*`) – Ajout d'icônes dans PageHeader et CardTitle

**Convention des Icônes** :
- **Commandes** : `ClipboardList` (liste) / `ClipboardEdit` (édition)
- **Livraisons** : `Package`
- **Tournées** : `Route` (navigation) / `MapPin` (détails)
- **Livreurs** : `User` (liste) / `UserCircle` (détails)

**Implémentation** :
1. **PageHeader** :
   - Nouvelle prop `icon?: ComponentType<IconProps>`
   - Icône affichée à gauche du titre (size-5, text-muted-foreground)
   - Ajoutée dans toutes les pages principales (18 pages)

2. **CardTitle** :
   - Modification inline avec flexbox
   - Icône size-4 avec gap-2
   - ~25 CardTitle mis à jour dans le dashboard, listes, et formulaires

3. **Navigation TopNav** :
   - Icônes ajoutées aux liens de navigation
   - Dashboard → `LayoutDashboard`
   - Commandes → `ClipboardList`
   - Livraisons → `Package`

4. **Sidebar (AppSidebar)** :
   - Mise à jour complète pour cohérence
   - Commandes : `PackageIcon` → `ClipboardListIcon`
   - Livraisons : `TruckIcon` → `PackageIcon`
   - Livreurs : `UsersIcon` → `UserIcon`
   - Sous-menus : icônes plus sémantiques (`ClipboardEdit`, `UserPlus`, `MapPin`)

**Design** :
- Taille : size-5 (PageHeader), size-4 (CardTitle et Navigation)
- Couleur : `text-muted-foreground` (cohérent avec le design system)
- Espacement : gap-2 (titres), gap-1.5 (navigation)

**Résultat** :
- ✅ Reconnaissance visuelle immédiate du type de contenu
- ✅ Cohérence dans toute l'application
- ✅ Navigation plus intuitive
- ✅ Interface plus professionnelle
- ✅ Support complet du mode sombre
- ✅ Accessibilité respectée (icônes complètent le texte sans le remplacer)

**Notes** : Utilisation de Lucide Icons (déjà présent dans le projet). Aucune nouvelle dépendance. Pattern réutilisable pour les futurs ajouts. Les icônes utilisent `svelte:component` pour le rendu dynamique.

---

## 2026-02-12 | Nombre de Livraisons et Visualisation de Progression

**Tâche** : Ajouter l'affichage du nombre de livraisons par commande avec code couleur si aucune livraison, et créer une visualisation intelligente de progression des tournées avec des icônes colorées.

**Problème 1** : Dans la liste des commandes, impossible de savoir rapidement combien de livraisons sont associées à chaque commande, ni d'identifier les commandes sans livraison.

**Problème 2** : Dans la liste des tournées, la colonne "Date" n'était pas très informative et il n'y avait aucune indication visuelle sur l'état d'avancement de chaque tournée.

**Fichiers créés** :
- `frontend-business/src/lib/components/DeliveryCountBadge.svelte` – Badge affichant le nombre de livraisons avec alerte orange si = 0
- `frontend-business/src/lib/components/RouteProgressIndicator.svelte` – Visualisation de l'état d'avancement avec icônes colorées
- `DELIVERY_COUNT_AND_PROGRESS.md` – Documentation complète des fonctionnalités

**Fichiers modifiés - Backend** :
- `backend/Features/Orders/OrderDtos.cs` – Ajout du champ `DeliveryCount` à `OrderResponse`
- `backend/Features/Orders/OrderEndpoints.cs` – Modification de `GetOrders()` pour calculer le nombre de livraisons par commande, mise à jour de `ToResponse()`
- `backend/Features/Deliveries/DeliveryDtos.cs` – Ajout de `DeliveryStatusSummary` et mise à jour de `RouteResponse`
- `backend/Features/Deliveries/RouteEndpoints.cs` – Modification de `GetRoutes()` pour inclure le résumé des statuts des livraisons

**Fichiers modifiés - Frontend** :
- `frontend-business/src/lib/api/orders.ts` – Ajout de `deliveryCount` à `ApiOrder`
- `frontend-business/src/lib/api/routes.ts` – Ajout de `DeliveryStatusSummary` et `statusSummary` à `ApiRoute`
- `frontend-business/src/lib/stores/orders.svelte.ts` – Utilisation de `order.deliveryCount` au lieu de valeur fixe
- `frontend-business/src/lib/offline/mockData.ts` – Calcul dynamique de `deliveryCount` et `statusSummary` dans les mock data
- `frontend-business/src/routes/orders/+page.svelte` – Utilisation de `DeliveryCountBadge` dans la colonne Livraisons
- `frontend-business/src/routes/deliveries/routes/+page.svelte` – Remplacement de la colonne "Date" par "Progression" avec `RouteProgressIndicator`

**Implémentation - Backend** :
1. **OrderResponse** : Ajout du champ `DeliveryCount` calculé par une requête groupée efficace
2. **RouteResponse** : Ajout de `DeliveryStatusSummary` avec le nombre de livraisons dans chaque statut (Pending, InProgress, Completed, Failed)
3. **Optimisation** : Une seule requête additionnelle avec `GroupBy` au lieu d'une requête par élément

**Implémentation - Frontend** :
1. **DeliveryCountBadge** :
   - Badge avec code couleur orange si `count = 0` (alerte)
   - Badge gris standard si `count > 0`
   - Pluriel automatique ("livraison" vs "livraisons")

2. **RouteProgressIndicator** :
   - Icônes selon statut : ✓ (vert), ◉ (bleu/gris), ✗ (rouge)
   - Opacité décroissante pour les livraisons en attente (100% → 30%)
   - Indicateur textuel "X/Y" (X livrées sur Y total)
   - Tooltip par icône : "Livraison #N - Statut"
   - Tooltip sur indicateur : Résumé détaillé avec décompte par statut

3. **Mock Data** :
   - `deliveryCount` calculé dynamiquement en comptant les livraisons par commande
   - `statusSummary` calculé en groupant les livraisons par statut

**Résultat** :
- ✅ Identification immédiate des commandes sans livraison (badge orange)
- ✅ Vue d'ensemble instantanée de l'état de chaque tournée
- ✅ Visualisation de l'ordre et du statut des livraisons avec icônes colorées
- ✅ Information détaillée accessible via tooltips
- ✅ Code couleur cohérent avec les badges de statut existants
- ✅ Performance optimale avec requêtes groupées
- ✅ Support complet du mode sombre

**Notes** : La colonne "Date" des tournées a été remplacée car moins informative que la visualisation de progression. Les icônes utilisent les couleurs des statuts de livraison pour une cohérence visuelle maximale. L'opacité décroissante des livraisons en attente crée un effet de "file d'attente" intuitif.

---

## 2026-02-12 | Affichage de Temps Relatif avec Code Couleur Unifié

**Tâche** : Ajouter l'affichage de temps relatif avec tooltip pour la date complète dans toutes les interfaces, avec un code couleur unifié à travers le site.

**Problème** : Les dates étaient affichées en format complet dans les listes, prenant beaucoup de place et rendant difficile l'identification rapide des urgences.

**Fichiers créés** :
- `frontend-business/src/lib/components/RelativeTimeIndicator.svelte` – Nouveau composant pour affichage temps relatif avec code couleur
- `RELATIVE_TIME_INDICATOR.md` – Documentation complète du système de temps relatif

**Fichiers modifiés** :
- `frontend-business/src/routes/deliveries/new/+page.svelte` – Ajout colonne "Date" avec temps relatif dans "Commandes à livrer"
- `frontend-business/src/routes/deliveries/+page.svelte` – Ajout colonne "Date" avec temps relatif dans "Liste des livraisons"
- `frontend-business/src/routes/dashboard/+page.svelte` – Remplacement `OrderDateIndicator` par `RelativeTimeIndicator` dans "Commandes récentes"
- `frontend-business/src/routes/orders/+page.svelte` – Utilisation de `RelativeTimeIndicator` dans la liste des commandes
- `frontend-business/src/routes/orders/[id]/+page.svelte` – Utilisation de `RelativeTimeIndicator` dans le détail

**Composant RelativeTimeIndicator** :
- **Affichage principal** : Temps relatif court (ex: "Dans 2h", "Il y a 3j", "Demain")
- **Tooltip** : Date et heure complètes (ex: "12/02/2026 14:30")
- **Code couleur selon urgence** :
  - Rouge : Date passée (en retard)
  - Jaune : < 30 minutes (urgent)
  - Orange : 30min - 2h (bientôt)
  - Gris : > 2h (normal)
- **Option `showTime`** : Affiche l'heure pour dates < 24h (ex: "Dans 2h (14:30)")

**Format de temps relatif** :
- **Passé** : "Il y a Xm/h/j/sem" ou "Hier"
- **Futur** : "Dans Xm/h/j/sem", "Maintenant", "Demain"
- **Compacité** : Formats courts pour économiser l'espace

**Interfaces mises à jour** :
1. ✅ Nouvelle tournée → Commandes à livrer : Colonne "Date" avec temps relatif
2. ✅ Liste des livraisons : Colonne "Date" ajoutée
3. ✅ Dashboard → Commandes récentes : Temps relatif au lieu de date complète
4. ✅ Liste des commandes : Uniformisation avec temps relatif
5. ✅ Détail de commande : Temps relatif dans les infos

**Code couleur unifié** : Le même système de couleur est utilisé par `OrderDateIndicator` (date complète → temps relatif dans tooltip) et `RelativeTimeIndicator` (temps relatif → date complète dans tooltip), garantissant une cohérence visuelle complète.

**Résultat** : Amélioration de la lisibilité et identification immédiate des urgences grâce au code couleur, tout en conservant l'accès à la date complète via tooltip.

**Notes** : Les deux composants (`OrderDateIndicator` et `RelativeTimeIndicator`) coexistent et peuvent être utilisés selon le contexte (détail vs liste). Support complet du mode sombre et format français.

---

## 2026-02-12 | Support des Filtres de Calendrier en Mode Démo

**Tâche** : Corriger les filtres de calendrier qui ne fonctionnaient pas en mode démo.

**Problème** : Lorsque l'utilisateur sélectionnait des dates dans le filtre calendrier, les données de démo ne s'adaptaient pas. Toutes les données étaient affichées quel que soit le filtre.

**Fichiers modifiés** :
- `frontend-business/src/lib/offline/mockData.ts` – Ajout des filtres dans `getMockOrders()`, `getMockDeliveries()`, et `getMockRoutes()`
- `frontend-business/src/lib/offline/mockApi.ts` – Simplification pour passer les filtres directement, amélioration de `getOrdersStats()` pour générer des stats basées sur les données filtrées
- `frontend-business/src/lib/api/orders.ts` – Correction de l'appel à `getOrdersStats()` pour passer les filtres
- `DEMO_FILTERS_FIX.md` – Documentation de la correction

**Implémentation** :
1. **Tournées** : Support de `dateFrom`, `dateTo`, et `driverId`
2. **Commandes** : Support de `dateFrom`, `dateTo`, `dateFilter` (CreatedAt/OrderDate), et `search`
3. **Livraisons** : Support de `dateFrom`, `dateTo`, `dateFilter`, et `routeId`
4. **Stats** : Génération basée sur les vraies données filtrées au lieu de données factices

**Logique de filtrage** :
- Normalisation des dates pour comparer au niveau du jour
- `dateFrom` inclut toute la journée de début (00:00:00)
- `dateTo` inclut toute la journée de fin (23:59:59)
- Recherche textuelle insensible à la casse
- Filtres cumulatifs (tous doivent être satisfaits)

**Résultat** : Les filtres de calendrier fonctionnent maintenant correctement en mode démo :
- ✅ Filtrage des tournées par date et livreur
- ✅ Filtrage des commandes par date et recherche textuelle
- ✅ Filtrage des livraisons par date et tournée
- ✅ Stats générées dynamiquement selon les filtres
- ✅ Expérience utilisateur cohérente avec le mode en ligne

**Notes** : Les filtres sont rétrocompatibles (optionnels). Si aucun filtre n'est spécifié, toutes les données sont retournées.

---

## 2026-02-12 | Correction du Mode Démo et Dates Cohérentes

**Tâche 1** : Corriger le bouton "Mode demo" qui ne configurait pas correctement le mode démo et n'affichait pas les données de démonstration.

**Problème** : Le bouton "Mode demo" effectuait une simple redirection vers `/dashboard` sans activer le mode offline, configurer le `DEMO_TENANT_ID` ou initialiser les données de démo. Résultat : l'utilisateur était connecté avec un tenantId réel (ou aucun) et aucune donnée de démo n'était affichée.

**Tâche 2** : Adapter les dates des données de démo pour qu'elles soient réalistes et cohérentes avec les statuts.

**Problème** : Les dates des commandes et livraisons de démo étaient générées aléatoirement dans le passé, sans cohérence avec les statuts (une commande "Pending" pouvait avoir une date passée, etc.).

**Fichiers créés** :
- `frontend-business/src/lib/stores/offline.svelte.ts` – Store réactif Svelte 5 pour gérer l'état du mode offline
- `DEMO_MODE_FIX.md` – Documentation détaillée de la correction

**Fichiers modifiés** :
- `frontend-business/src/routes/login/+page.svelte` – Ajout de la fonction `handleDemoMode()` et modification du bouton pour l'utiliser
- `frontend-business/src/lib/components/DemoBanner.svelte` – Utilisation du store réactif au lieu d'une fonction non-réactive
- `frontend-business/src/lib/offline/config.ts` – Mise à jour pour utiliser le store réactif
- `frontend-business/src/lib/offline/mockData.ts` – Refonte complète de la génération des données de démo avec dates cohérentes
- `docs/decision-log.md` – Documentation de la décision d'utiliser un store réactif

**Implémentation** :
1. Création d'un store réactif `offlineState` avec Svelte 5 Runes
2. Fonction `handleDemoMode()` qui :
   - Active le mode offline via `setOfflineModeReactive(true)`
   - Configure le `DEMO_TENANT_ID` (`'demo-tenant-fake-001'`)
   - Configure un token de démo
   - Authentifie l'utilisateur avec des données de démo
   - Redirige vers le dashboard
3. Modification du bouton pour appeler `handleDemoMode()` au lieu de faire un lien simple
4. Mise à jour du `DemoBanner` pour être réactif aux changements de mode
5. **Génération intelligente des données de démo** :
   - Dates réparties entre J-7 et J+7 (7 jours avant/après aujourd'hui)
   - Heures aléatoires entre 8h et 18h pour plus de réalisme
   - Statuts cohérents avec les dates :
     - **Passé (J-7 à J-1)** : "Delivered" pour commandes, "Completed" pour livraisons
     - **Aujourd'hui (J)** : "InDelivery" pour commandes, "InProgress" pour livraisons
     - **Futur (J+1 à J+7)** : "Pending" pour commandes et livraisons
   - Tournées générées dynamiquement selon les dates avec statuts cohérents
   - Dates de complétion des livraisons (2 à 8 heures après création)

**Résultat** : Le mode démo fonctionne maintenant correctement avec :
- ✅ Activation automatique du mode offline
- ✅ Configuration du `DEMO_TENANT_ID`
- ✅ Affichage du banner de démo en temps réel
- ✅ Données de démonstration réalistes et cohérentes temporellement
- ✅ 8 commandes réparties sur 15 jours avec statuts logiques
- ✅ Plusieurs tournées avec dates et statuts cohérents
- ✅ Isolation complète des données réelles

**Notes** : Le store réactif permet au `DemoBanner` de s'afficher immédiatement sans rechargement de page. Les données de démo sont regénérées à chaque initialisation en fonction de la date actuelle, garantissant toujours des données pertinentes.

---

## 2026-02-04 | Suppression de la colonne ETA non fonctionnelle

**Tâche** : Supprimer la colonne ETA (Estimated Time of Arrival) qui affichait une valeur hardcodée "11:40" sans fonctionnalité réelle.

**Fichiers modifiés** :
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – Suppression du champ `eta` des types `DeliveryRoute` et `DeliveryStop`
- `frontend-business/src/routes/dashboard/+page.svelte` – Suppression de la colonne ETA des tableaux "Tournées prévues" et "En cours"
- `frontend-business/src/routes/deliveries/+page.svelte` – Suppression de la colonne ETA du tableau des livraisons

**Notes** : La colonne ETA n'était pas calculée et affichait une valeur statique. L'API backend ne fournit pas cette information. La colonne pourra être réintroduite ultérieurement si un calcul d'ETA réel est implémenté.

---

## 2026-02-04 | Indicateur visuel d'urgence des dates de commande

**Tâche** : Ajouter un indicateur visuel pour les dates de commande avec codes couleur selon l'urgence et tooltip avec temps relatif.

**Fichiers créés** :
- `frontend-business/src/lib/components/OrderDateIndicator.svelte` – Composant d'affichage des dates avec indicateur d'urgence

**Fichiers modifiés** :
- `frontend-business/src/routes/orders/+page.svelte` – Utilisation du composant OrderDateIndicator dans le tableau des commandes
- `frontend-business/src/routes/orders/[id]/+page.svelte` – Utilisation du composant dans la page de détail de commande
- `frontend-business/src/routes/dashboard/+page.svelte` – Utilisation du composant dans le tableau de bord

**Fonctionnalités** :
- **Rouge** : Date dépassée (retard)
- **Jaune** : Moins de 30 minutes restantes (urgent)
- **Orange** : Entre 30 minutes et 2 heures (bientôt)
- **Gris** : Plus de 2 heures (normal)
- **Tooltip au hover** : Affiche le temps relatif en français (ex: "En retard de 2 heures", "Dans 15 minutes", "Demain", etc.)

**Notes** : Le composant utilise les composants UI Tooltip existants avec un délai de 200ms. Les calculs sont réactifs et se mettent à jour automatiquement grâce à `$derived`.

---

## 2026-02-04 | Implémentation détail tournée : progress bar, ETA, tri livraisons

**Tâche** : Implémenter l’interface de détail d’une tournée avec progress bar (X/Y livrées), tracking temps réel et tri des livraisons (spec [docs/tournee-detail-tracking-eta.md](tournee-detail-tracking-eta.md)).

**Backend** :
- `Delivery.Sequence` (int?) ajouté ; migration `AddSequenceToDelivery`. Création batch : Sequence = 0, 1, 2…
- `DeliveryResponse` et `DeliveryDetailResponse` : champ `Sequence` exposé.
- GET `/api/deliveries` avec `routeId` : tri par `Sequence` puis `CreatedAt`.
- GET `/api/routes/{id}` : détail tournée + livraisons ordonnées par Sequence (DTOs `RouteDetailResponse`, `DeliveryInRouteResponse`).
- PATCH `/api/routes/{routeId}/deliveries/order` : body `{ "deliveryIds": ["guid", ...] }`, met à jour `Sequence` 0, 1, 2…

**Frontend** :
- API : `getRoute(routeId)`, `reorderRouteDeliveries(routeId, deliveryIds)` ; types `ApiRouteDetail`, `ApiDeliveryInRoute`.
- Composant `RouteProgressBar.svelte` : X/Y livrées, barre de progression (style App chauffeur landing).
- Page `/deliveries/routes/[routeId]` : en-tête, progress bar, liste livraisons (ordre + statut + client + adresse), boutons Monter/Descendre pour réordonner, tracking SignalR + carte si livraison en cours.
- Liste tournées : lien « Détail » vers `/deliveries/routes/[id]`, lien « Livraisons » vers `/deliveries?routeId=…`.
- Store deliveries : ETA affiché = « Arrêt N » si `sequence` présent, sinon « – ».
- Mode offline : `getMockRouteDetail`, `reorderMockRouteDeliveries` ; mock données avec `sequence`.

**À faire** : Appliquer la migration en base (`dotnet ef database update` ou script de déploiement).

---

## 2026-02-04 | App chauffeur : progress bar, ordre des arrêts, routeId/sequence

**Tâche** : Aligner l’app driver (frontend-driver) avec la tournée, la progress bar (X/Y livrées) et l’ordre des arrêts (sequence).

**Backend** :
- `DeliveryDetailResponse` : ajout de `RouteId` (pour que le chauffeur puisse charger le détail de la tournée et afficher la progress).
- GET `/api/deliveries` : filtre optionnel **`driverId`** ; tri par `RouteId` puis `Sequence` quand `driverId` ou `routeId` est fourni (app chauffeur = ses livraisons ordonnées par tournée et arrêt).

**Frontend-driver** :
- **API** : `ApiDelivery` et `ApiDeliveryDetail` avec `routeId` et `sequence`. `getDeliveries(driverId?)` envoie `driverId` en query pour ne récupérer que les livraisons du chauffeur. Nouveau module **`lib/api/routes.ts`** avec `getRoute(routeId)` pour le détail tournée (progress X/Y).
- **Page Liste (Deliveries.svelte)** : progress bar « X / Y livrées » en haut ; tri des livraisons par `routeId` puis `sequence` ; libellé « Arrêt N » par livraison quand `sequence` présent.
- **Page Détail (DeliveryDetail.svelte)** : si la livraison a un `routeId`, appel à `getRoute(routeId)` et affichage d’une progress bar « X / Y livrées » + « Arrêt N sur M » ; titre du type « Arrêt 3 / 5 — Livraison XXX ».
- **Mode offline** : mock données avec `routeId`, `sequence`, `createdAt` ; `getMockRouteDetail(routeId)` ; `mockRoutesApi.getRoute(routeId)`.

---

## 2026-02-04 | Spec détail tournée : progress bar, ETA, tri livraisons

**Tâche** : Rassembler le minimum pour une interface de détail d’une tournée avec progress bar (X/Y livrées), ETA temps réel du chauffeur et tri de l’ordre des livraisons.

**Document créé** : [docs/tournee-detail-tracking-eta.md](tournee-detail-tracking-eta.md)

**Contenu** :
- Objectif : page détail tournée avec progress bar (style App chauffeur landing), liste ordonnée des livraisons, tracking SignalR, tri des arrêts.
- Backend (minimum) : champ `Sequence` sur `Delivery`, GET `/api/routes/{id}` (détail + livraisons ordonnées), PATCH reorder (`/api/routes/{routeId}/deliveries/order`).
- Frontend (minimum) : page `/deliveries/routes/[routeId]`, composant progress bar réutilisable, liste livraisons par Sequence, tracking pour la livraison en cours, boutons ou drag-and-drop pour réordonner.
- ETA : option simple = « Arrêt N/M » ; option avancée = champ ou calcul ETA (après MVP).

**Référence** : Lazy component App chauffeur (`frontend-landing-page/components/previews/AppDriverPreview.tsx`).

---

## 2026-02-04 | Landing page : aperçus d’apps, couleurs partagées, carte en image

**Tâche** : Améliorer la landing avec des bouts de chaque application (surtout business), partager les couleurs avec le reste du projet et exporter des composants lazy ; carte en image.

**Frontend-landing-page** :
- **Design tokens** : `lib/design-tokens.css` avec variables `--trackly-stone-*` et `--trackly-teal-*` alignées avec frontend-business (stone + teal). Import dans `app/globals.css`.
- **Composants preview (lazy)** : `components/previews/` — `AppBusinessPreview` (dashboard : onglets, tableau, badges), `AppDriverPreview` (PWA chauffeur), `AppTrackingPreview` (suivi client), `MapPreview` (image statique). Chargés via `next/dynamic` avec `ssr: false` et skeleton de chargement.
- **Carte** : image statique `public/map-preview.svg` (grille + pins teal/stone). Remplaçable par une capture d’écran réelle.
- **Section Features** : 4 cartes (Dashboard Business, Carte & tournées, Suivi temps réel, App chauffeur) utilisant ces previews lazy.

**Docs** : `frontend-landing-page/docs/DESIGN_SYSTEM.md` mis à jour (tokens partagés, aperçus lazy, carte en image).

---

## 2026-02-04 | Landing page Trackly (frontend-landing-page)

**Tâche** : Ajout d’une landing page optimisée SEO pour présenter Trackly et acquérir des leads.

**Dossier** : `frontend-landing-page/` (projet Next.js 14+ App Router, React/TypeScript).

**Contenu** :
- Sections : Hero, Problème/Solution, Fonctionnalités (Bento Grid), Tarification (Starter / Pro), Preuve/confiance, CTA final, Footer
- SEO : meta (title, description 150–160 car.), Open Graph, Twitter Card, JSON-LD (Organization, WebSite, SoftwareApplication), URL canonique `/`
- Design : Tailwind CSS + shadcn/ui, thème stone + teal, cohérent avec le reste du projet
- Documentation interne : `frontend-landing-page/docs/` (PROJECT_CONTEXT, SEO_STRATEGY, DESIGN_SYSTEM, ARCHITECTURE, CONTENT_LANDING, MVP_SCOPE)

**Référence** : Voir [docs/LANDING-PAGE-PROMPT.md](LANDING-PAGE-PROMPT.md) pour le prompt et les exigences SEO d’origine.

---

## 2026-02-04 | Entité Tournée (Route) en base

**Tâche** : Créer une vraie entité Tournée (Route) en base pour distinguer plusieurs tournées le même jour et gérer correctement les tournées de nuit.

**Backend** :
- Nouvelle entité `Route` : Id, TenantId, DriverId, Name (optionnel), CreatedAt, DeletedAt
- `Delivery.RouteId` (FK nullable) ; migration `AddRouteAndRouteIdToDelivery`
- `CreateDeliveriesBatch` crée une Route puis N Deliveries avec le même RouteId ; requête accepte `Name` optionnel
- Nouveau endpoint `GET /api/routes` (filtres dateFrom, dateTo, driverId) ; `GET /api/deliveries` accepte `routeId`
- DTOs : RouteResponse, RouteListResponse ; DeliveryResponse inclut RouteId

**Frontend** :
- API `getRoutes(filters)` et `DeliveriesListFilters.routeId` ; `createDeliveriesBatch` envoie `name`
- Page Tournées (`/deliveries/routes`) utilise GET /api/routes au lieu du regroupement client
- Lien « Voir les livraisons » vers `/deliveries?routeId=...` ; page Livraisons charge avec filtre routeId
- Formulaire Créer tournée : champ « Nom de la tournée (optionnel) » renvoyé à l’API
- Mode offline : mockRoutesApi, getMockRoutes, createMockDeliveries avec name et routeId

**Notes** : Chaque création de tournée = 1 Route + N Deliveries. Les tournées de nuit (une seule Route) ne sont plus coupées par minuit.

---

## 2026-02-04 | Livraisons vs Tournées – Navigation et liste des tournées

**Tâche** : Clarifier la distinction Livraisons (liste des livraisons) / Tournées (regroupement chauffeur + date). Renommer la page actuelle « Tournées » en « Livraisons » et ajouter une interface dédiée listant les tournées.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/AppSidebar.svelte` – Catégorie « Livraison » avec sous-éléments : Livraisons (/deliveries), Tournées (/deliveries/routes), Créer tournée
- `frontend-business/src/routes/deliveries/+page.svelte` – Titre et libellés « Livraisons », filtre optionnel `driverId` + `date` (URL) pour détail tournée
- `frontend-business/src/routes/dashboard/+page.svelte` – Onglet et cartes « Livraisons » (prévues / en cours)
- `frontend-business/src/lib/components/TopNav.svelte` – Lien « Livraisons »
- `frontend-business/src/lib/components/OrdersChartContent.svelte` – Libellé « Livraisons » pour variant delivery
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – Message d’erreur « livraisons »

**Fichiers créés** :
- `frontend-business/src/routes/deliveries/routes/+page.svelte` – Page « Tournées » : liste regroupée par chauffeur et date, lien « Voir les livraisons » vers /deliveries?driverId=…&date=…

**Notes** : Une tournée reste un regroupement logique (pas d’entité en base). La page /deliveries affiche une ligne par livraison ; /deliveries/routes affiche une ligne par groupe (driverId + date) avec nombre d’arrêts et statut agrégé.

---

## 2026-01-26 | Mise en place structure Agent-First

**Tâche** : Création de la structure de fichiers "Agent-First" pour maximiser l'autonomie des agents IA.

**Fichiers créés** :
- `.cursor/rules/dotnet-9.mdc` - Règles spécifiques .NET 9
- `.cursor/rules/svelte-5.mdc` - Règles Svelte 5 Runes
- `.cursor/rules/global-context.mdc` - Contexte business et multi-tenancy
- `.windsurfrules` - Règles pour Windsurf
- `docs/current-sprint.md` - Contexte de session
- `docs/decision-log.md` - Log des décisions techniques
- `docs/architecture-map.md` - Schéma des services et flux
- `project-roadmap.md` - Vision long terme et étapes MVP
- `todo.md` - Liste de tâches atomiques
- `docs/project-log.md` - Ce fichier

**Notes** : Structure complète mise en place selon les standards "Agent-First" pour 2026. Les agents IA peuvent maintenant travailler de manière autonome avec un contexte clair et des règles explicites.

---

## 2026-01-26 | Initialisation backend .NET 9

**Tâche** : Création du projet backend ASP.NET Core Minimal APIs.

**Fichiers créés** :
- `backend/Program.cs`
- `backend/Trackly.Backend.csproj`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`
- `backend/Properties/launchSettings.json`

**Dossiers créés** :
- `frontend-business/`
- `frontend-driver/`
- `frontend-tracking/`
- `shared/`

**Notes** : Projet backend initialisé avec .NET 9 pour servir de base au monolithe modulaire, avec structure monorepo en place.

---

## 2026-01-26 | Base EF Core et multi-tenant

**Tâche** : Configuration PostgreSQL + EF Core et fondations multi-tenant.

**Fichiers créés** :
- `backend/Infrastructure/MultiTenancy/ITenantIsolated.cs`
- `backend/Infrastructure/MultiTenancy/TenantContext.cs`
- `backend/Infrastructure/MultiTenancy/TenantMiddleware.cs`
- `backend/Infrastructure/Data/TracklyDbContext.cs`
- `backend/Features/Tenants/Tenant.cs`
- `backend/Features/Orders/Order.cs`
- `backend/Features/Deliveries/Delivery.cs`
- `backend/Features/Drivers/Driver.cs`

**Fichiers modifiés** :
- `backend/Program.cs`
- `backend/Trackly.Backend.csproj`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`

**Notes** : EF Core 9 + Npgsql configurés, avec filtre global automatique sur `TenantId`.

---

## 2026-01-26 | Endpoints API et quota Starter

**Tâche** : Exposition des endpoints orders/deliveries avec validation quota.

**Fichiers créés** :
- `backend/Features/Billing/IBillingService.cs`
- `backend/Features/Billing/BillingService.cs`
- `backend/Features/Orders/OrderDtos.cs`
- `backend/Features/Orders/OrderEndpoints.cs`
- `backend/Features/Deliveries/DeliveryDtos.cs`
- `backend/Features/Deliveries/DeliveryEndpoints.cs`

**Fichiers modifiés** :
- `backend/Program.cs`
- `backend/Features/Orders/Order.cs`
- `backend/Features/Deliveries/Delivery.cs`

**Notes** : Quota mensuel appliqué au plan Starter, enums JSON exposés en string.

---

## 2026-01-26 | Migration initiale et seed dev

**Tâche** : Génération de la migration EF Core et seed de données de base.

**Fichiers créés** :
- `.config/dotnet-tools.json`
- `backend/Infrastructure/Data/TracklyDbContextFactory.cs`
- `backend/Infrastructure/Data/SeedData.cs`
- `backend/Migrations/20260126152307_InitialCreate.cs`
- `backend/Migrations/20260126152307_InitialCreate.Designer.cs`
- `backend/Migrations/TracklyDbContextModelSnapshot.cs`

**Fichiers modifiés** :
- `backend/Program.cs`

**Notes** : Le seed s'exécute en développement au démarrage (après `MigrateAsync`).

---

## 2026-01-26 | Gitignore et test migration

**Tâche** : Ajout du `.gitignore` et tentative de démarrage + migration.

**Fichiers créés** :
- `.gitignore`

**Notes** : Le démarrage de l'API et `database update` échouent si PostgreSQL n'est pas démarré (connexion refusée sur `localhost:5432`).

---

## 2026-01-26 | Création DB et migration appliquée

**Tâche** : Création utilisateur/base PostgreSQL et application des migrations.

**Notes** : Rôle `trackly` créé, bases `trackly` et `trackly_dev` créées, migration initiale appliquée avec succès.

---

## 2026-01-26 | Frontend Business initialisé

**Tâche** : Initialisation du frontend Business (SvelteKit) et premier écran dashboard.

**Fichiers modifiés** :
- `frontend-business/README.md`
- `frontend-business/src/app.css`
- `frontend-business/src/app.html`
- `frontend-business/src/routes/+layout.svelte`
- `frontend-business/src/routes/+page.svelte`

**Notes** : Mise en place d'un layout simple et de cartes KPI mockees pour demarrer la suite.

---

## 2026-01-26 | Pages login + dashboard

**Tâche** : Ajout des pages `/login` et `/dashboard` avec redirection racine.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/+page.svelte`
- `frontend-business/src/routes/+page.server.ts`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/login/+page.svelte`

**Notes** : UI login minimal et dashboard disponible sous `/dashboard`.

---

## 2026-01-26 | Pages commandes + tournees

**Tâche** : Ajout des pages `/orders` et `/deliveries` avec navigation commune.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/lib/components/TopNav.svelte`
- `frontend-business/src/routes/dashboard/+page.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`

**Notes** : Pages liste avec tableaux et actions mockees pour continuer le flux.

---

## 2026-01-26 | Import commandes

**Tâche** : Ajout de la page `/orders/import` pour l import CSV et plugins.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/orders/import/+page.svelte`

**Notes** : Flux d import mocke, CTA et etapes visibles.

---

## 2026-01-26 | Detail tournee

**Tâche** : Ajout de la page `/deliveries/[id]` avec carte mockee et liste d arrets.

**Fichiers modifiés** :
- `frontend-business/src/app.css`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`

**Notes** : Carte simulée pour le suivi chauffeur et tableau des arrets.

---

## 2026-01-26 | Etat global (stores)

**Tâche** : Mise en place des stores Svelte 5 pour auth, commandes et tournees.

**Fichiers modifiés** :
- `frontend-business/src/lib/stores/auth.svelte.ts`
- `frontend-business/src/lib/stores/orders.svelte.ts`
- `frontend-business/src/lib/stores/deliveries.svelte.ts`
- `frontend-business/src/routes/login/+page.svelte`
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`

**Notes** : Donnees mockees stockees dans les stores, prêtes pour brancher l API.

---

## 2026-01-26 | Client HTTP API

**Tâche** : Configuration du client HTTP et endpoints de base pour orders/deliveries.

**Fichiers modifiés** :
- `frontend-business/src/lib/api/client.ts`
- `frontend-business/src/lib/api/orders.ts`
- `frontend-business/src/lib/api/deliveries.ts`
- `frontend-business/src/lib/stores/orders.svelte.ts`
- `frontend-business/src/lib/stores/deliveries.svelte.ts`
- `frontend-business/src/routes/orders/+page.svelte`

**Notes** : Appels API disponibles, avec fallback silencieux en mode demo.

---

## 2026-01-26 | Client SignalR

**Tâche** : Ajout du client SignalR pour le suivi temps reel chauffeur.

**Fichiers modifiés** :
- `frontend-business/src/lib/realtime/tracking.svelte.ts`
- `frontend-business/src/routes/deliveries/+page.svelte`
- `frontend-business/src/routes/deliveries/[id]/+page.svelte`
- `frontend-business/src/app.css`

**Notes** : Connexion auto sur detail tournee, affichage position si disponible.

---

## 2026-01-26 | Chargement auto API

**Tâche** : Lancement automatique des appels API sur listes commandes et tournees.

**Fichiers modifiés** :
- `frontend-business/src/routes/orders/+page.svelte`
- `frontend-business/src/routes/deliveries/+page.svelte`

**Notes** : Les listes se mettent a jour si le backend est accessible.

---

## 2026-02-01 | Mise à jour todo et instructions manuelles

**Tâche** : Alignement du todo sur l’état réel du projet et ajout des instructions manuelles prioritaires.

**Fichiers modifiés** :
- `todo.md`

**Notes** :
- SignalR backend et frontend driver marqués comme réalisés (TrackingHub, ITrackingClient, PWA, pages, GPS, client SignalR).
- Nouvelle section « Instructions manuelles importantes » avec tâches à développer : allègement en-têtes (commandes/tournées), bug tooltips relatifs, bug plage « aujourd’hui », module date tournées, graphique interactif par statut, import CSV nouveaux champs, dataset Montpellier.

---

## 2026-02-05 | Création de l'application cliente de suivi (frontend-tracking)

**Tâche** : Créer une application Next.js moderne pour le suivi des livraisons par les clients finaux.

**Dossier créé** : `frontend-tracking/` (projet Next.js 15 + App Router, React 18, TypeScript)

**Contenu** :
- **Stack** : Next.js 15 (App Router), React 18, Tailwind CSS, Framer Motion, React Leaflet
- **Pages** : 
  - `/` : Page d'accueil avec présentation des fonctionnalités
  - `/track/[id]` : Page de suivi dynamique avec carte, infos et actions
- **Fonctionnalités clés** :
  - Rafraîchissement automatique toutes les 30 secondes via `useAutoRefresh` hook
  - Carte interactive avec React Leaflet et OpenStreetMap
  - Informations détaillées de livraison (client, adresse, livreur, statut)
  - Boutons d'action rapide : "Appeler le livreur" (tel:) et "Contacter le commerçant" (mailto: / WhatsApp)
  - Animations fluides avec Framer Motion
  - Design moderne et responsive (mobile-first)
  - Logo Trackly intégré subtilement dans le header
- **Design System** : Design tokens partagés (stone + teal) avec frontend-business et frontend-landing-page
- **API Client** : Client HTTP avec gestion d'erreurs et types TypeScript
- **Composants** :
  - `TrackingHeader` : En-tête avec logo
  - `DeliveryMap` : Carte Leaflet (chargée dynamiquement, pas de SSR)
  - `DeliveryInfo` : Informations de livraison
  - `StatusBadge` : Badge de statut animé
  - `ActionButtons` : Boutons d'action (tel: / mailto: / wa.me/)
  - `LoadingSpinner` : Spinner animé
  - `ErrorMessage` : Gestion des erreurs
- **Documentation** : 
  - `README.md` : Vue d'ensemble
  - `QUICKSTART.md` : Installation et démarrage rapide
  - `docs/ARCHITECTURE.md` : Architecture détaillée
  - `docs/INTEGRATION.md` : Guide d'intégration complet

**Endpoints API utilisés** :
- `GET /api/deliveries/{id}` : Détails complets de la livraison
- `GET /api/deliveries/{id}/tracking` : Statut de tracking (optionnel, public)

**Configuration** :
- Port : 3004 (pour ne pas entrer en conflit avec les autres frontends)
- Variable d'env : `NEXT_PUBLIC_API_URL` (URL du backend)
- Build : Standalone output pour déploiement optimisé

**À faire** :
- Tester le build et le démarrage
- Intégrer une vraie API de géocodage (Nominatim ou Google Maps)
- Ajouter SignalR pour le tracking GPS en temps réel
- Rendre dynamiques les numéros de téléphone et emails
- Déployer sur Vercel ou Railway

**Notes** : Application ultra-légère et performante, optimisée pour mobile. Design cohérent avec le reste de l'écosystème Trackly grâce aux design tokens partagés.

---

## 2026-02-05 | Endpoint public de tracking et configuration CORS production

**Tâche** : Créer un endpoint public pour l'application cliente et documenter la configuration CORS pour Railway.

**Backend** :
- Nouvel endpoint PUBLIC `/api/public/deliveries/{id}/tracking` (mappé AVANT TenantMiddleware)
- Méthode `GetPublicTracking` dans `DeliveryEndpoints.cs` utilisant `IgnoreQueryFilters()`
- Retourne : status, customerName, address, driverName, driverPhone, sequence, completedAt
- Pas besoin d'authentification tenant (accessible aux clients finaux)

**Frontend-tracking** :
- Modification de `lib/api/deliveries.ts` pour utiliser l'endpoint public
- URL changée : `/api/deliveries/{id}` → `/api/public/deliveries/{id}/tracking`

**Documentation** :
- Nouveau fichier `docs/CORS-PRODUCTION.md` : guide complet de configuration CORS pour Railway
- Syntaxe variables d'environnement : `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc.
- Exemples de configuration pour tous les frontends
- Section troubleshooting et bonnes pratiques de sécurité
- Mise à jour de `RAILWAY-QUICK-START.md` avec les variables CORS

**Configuration CORS production** (Railway) :
```bash
Cors__AllowedOrigins__0=https://trackly.app           # Frontend Tracking
Cors__AllowedOrigins__1=https://app.trackly.app       # Frontend Business
Cors__AllowedOrigins__2=https://driver.trackly.app    # Frontend Driver
Cors__AllowedOrigins__3=https://www.trackly.app       # Landing Page
```

**Notes** : L'endpoint public permet aux clients finaux de suivre leur livraison sans authentification. Les informations sensibles (TenantId, détails internes) ne sont pas exposées.

---

## 2026-02-05 | Intégration Railway et GitHub Actions pour frontend-tracking

**Tâche** : Configurer le déploiement automatique du frontend-tracking sur Railway via GitHub Actions.

**Fichiers créés** :
- `frontend-tracking/Dockerfile` : Build Next.js standalone optimisé pour production
- `frontend-tracking/railway.json` : Configuration Railway (builder Dockerfile)
- `frontend-tracking/.dockerignore` : Exclusions Docker
- `frontend-tracking/DEPLOYMENT.md` : Guide complet de déploiement

**GitHub Actions** :
- `.github/workflows/ghcr.yml` : Ajout du service `frontend-tracking` dans la matrice de build
  - Build image : `ghcr.io/<owner>/trackly-frontend-tracking:latest`
  - Déclencheurs : push main, PR, workflow_dispatch
  - Cache : GitHub Actions cache pour accélérer les builds
- `.github/workflows/railway-redeploy.yml` : Ajout step redeploy frontend-tracking
  - Secret requis : `RAILWAY_SERVICE_ID_FRONTEND_TRACKING`
  - Redéploiement automatique après build GHCR réussi

**Configuration Tailwind** :
- `tailwind.config.ts` : Passage des variables CSS aux valeurs hexadécimales directes
- Ajout safelist pour classes générées dynamiquement (bg-teal-100, text-teal-700, etc.)
- Correction couleurs Stone, Teal, Green, Red pour badges de statut

**Composant carte** :
- `components/DeliveryMap.tsx` : Réécriture avec API Leaflet native (sans react-leaflet)
- Utilisation de useEffect + useRef pour contrôle total du cycle de vie
- Résolution erreur "Map container is already initialized" (React Strict Mode)
- Import dynamique de Leaflet pour SSR Next.js

**Documentation** :
- `RAILWAY-QUICK-START.md` : Section frontend-tracking ajoutée
- Variables d'environnement Railway documentées
- Configuration secrets GitHub pour auto-redeploy
- Ordre de déploiement des 4 services

**Variables d'environnement Railway** :
```bash
NEXT_PUBLIC_API_URL=https://api.trackly.app
NODE_ENV=production
PORT=3004
```

**Secrets GitHub requis** :
- `RAILWAY_API_TOKEN` : Token personnel Railway
- `RAILWAY_ENVIRONMENT_ID` : ID environnement
- `RAILWAY_SERVICE_ID_BACKEND`
- `RAILWAY_SERVICE_ID_FRONTEND_BUSINESS`
- `RAILWAY_SERVICE_ID_FRONTEND_DRIVER`
- `RAILWAY_SERVICE_ID_FRONTEND_TRACKING` ← Nouveau

**Workflow déploiement** :
1. Push sur `main` → Build images GHCR (4 services)
2. Build réussi → Redeploy Railway automatique (4 services)
3. Railway pull images et redémarre
4. Applications en ligne

**Notes** : Le frontend-tracking est maintenant complètement intégré au pipeline CI/CD. Chaque push sur main déclenche le build et le déploiement automatique sur Railway.

---

## 2026-02-19 | Correctif marker destination frontend-tracking

**Tâche** : Corriger l'absence et le mauvais positionnement du marker destination sur la page de suivi client.

**Causes identifiées** :
- La destination dans `frontend-tracking` utilisait des coordonnées statiques (`43.6101, 3.8764`) au lieu des coordonnées réelles de la commande.
- Le marker destination reposait sur des assets PNG Leaflet (`marker-icon.png`) pouvant être absents selon l'environnement.

**Backend** :
- `backend/Features/Deliveries/DeliveryEndpoints.cs` (`GetPublicTracking`) enrichi avec :
  - `lat = order?.Lat`
  - `lng = order?.Lng`

**Frontend-tracking** :
- `src/lib/api.ts` : ajout des champs optionnels `lat` et `lng` dans `DeliveryDetail`.
- `src/app/tracking/[deliveryId]/page.tsx` :
  - lecture de `lat/lng` renvoyés par l'API publique,
  - fallback de géocodage via Nominatim si la commande ne contient pas de coordonnées,
  - affichage d'un message explicite si la position destination reste indisponible.
- `src/components/TrackingMap.tsx` :
  - remplacement du marker destination basé sur PNG par un `divIcon` (fiable en Next.js),
  - conservation du marker livreur et du cadrage automatique.

**Résultat** :
- Le marker destination réapparaît.
- La position cible correspond à la vraie adresse/livraison (ou au géocodage fallback), au lieu d'une position fixe.

---

## 2026-02-19 | Stabilisation dev frontend-tracking (erreur module .next)

**Symptôme** :
- Erreurs intermittentes en développement :
  - `Cannot find module './778.js'`
  - `Could not find module ... segment-explorer-node.js#SegmentViewNode in the React Client Manifest`
  - `ENOENT ... .next/prerender-manifest.json`

**Cause probable** :
- Incohérence du cache `.next` + bug de bundler/HMR en mode dev.

**Correctif appliqué** :
- Nettoyage du cache `.next` et redémarrage du serveur de dev.
- `frontend-tracking/package.json` conservé en script standard :
  - `dev: next dev`

**Note** :
- Le flag `--webpack` n'est pas supporté dans la version Next utilisée dans ce projet (erreur `unknown option '--webpack'`), il ne doit pas être utilisé ici.

**Action locale nécessaire** :
- Stopper le serveur dev en cours, supprimer `.next`, puis relancer `npm run dev`.

---

## 2026-02-19 | Ouverture app livreur en fenêtre intégrée depuis Business

**Tâche** : Permettre une ouverture "intégrée" de l'app chauffeur depuis la liste des livreurs, similaire à une mini-fenêtre.

**Implémentation** :
- `frontend-business/src/routes/drivers/+page.svelte`
  - ajout de `openDriverAppPopup(driverId)` :
    - ouvre une popup centrée (format mobile 430x820),
    - réutilise l'URL de login direct (`?driverId=...`),
    - fallback automatique vers un onglet si la popup est bloquée.
  - nouvelle action dans le menu contextuel :
    - `Ouvrir en fenêtre intégrée`

**Résultat** :
- Depuis Business, on peut ouvrir rapidement l'app chauffeur dans une fenêtre dédiée sans quitter la page courante.

---

## 2026-02-19 | Suivi client en fenêtre intégrée depuis Business

**Tâche** : Proposer la même expérience "fenêtre intégrée" pour l'ouverture du suivi client.

**Implémentation** :
- `frontend-business/src/routes/deliveries/+page.svelte`
  - ajout de `openClientTrackingPopup(deliveryId)` :
    - popup centrée format mobile (430x820),
    - fallback vers un onglet si popup bloquée.
  - ajout d'une action de menu :
    - `Ouvrir suivi client (fenêtre)`

**Résultat** :
- Depuis la liste des livraisons, le suivi client peut s'ouvrir dans une fenêtre dédiée sans quitter l'interface Business.

---

## 2026-02-20 | Carte mobile : menu navigation au-dessus de la carte

**Tâche** : Corriger le problème de superposition sur mobile où les éléments de la carte passaient au-dessus du menu de navigation déplié.

**Fichiers modifiés** :
- `frontend-business/src/lib/components/ui/sheet/sheet-content.svelte` – augmentation du `z-index` du panneau mobile (`z-[2000]`)
- `frontend-business/src/lib/components/ui/sheet/sheet-overlay.svelte` – augmentation du `z-index` de l’overlay (`z-[2000]`)

**Résultat** :
- ✅ Le menu de navigation mobile reste au-dessus de la carte et de ses overlays
- ✅ Plus d’interférence visuelle quand un menu est ouvert sur la vue carte

---

## 2026-02-20 | Cache intelligent périodes (orders/deliveries)

**Tâche** : Implémenter un cache frontend efficace pour les changements de période fréquents (SWR + déduplication + anti-race).

**Fichiers modifiés** :
- `frontend-business/src/lib/stores/queryCache.svelte.ts` – nouvelle couche de cache partagée (clé stable, TTL, staleTime, déduplication des requêtes en vol, invalidation)
- `frontend-business/src/lib/stores/orders.svelte.ts` – lecture immédiate du cache, revalidation, annulation des requêtes obsolètes (`AbortController`), protection anti-race (`requestId`)
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – mêmes mécanismes appliqués aux livraisons
- `frontend-business/src/lib/api/orders.ts` – support d’un `RequestInit` optionnel pour propager le `signal` d’annulation
- `frontend-business/src/lib/api/deliveries.ts` – support d’un `RequestInit` optionnel pour propager le `signal` d’annulation

**Résultat** :
- ✅ Changement de période plus fluide (données instantanées si déjà en cache)
- ✅ Moins d’appels doublons lors de navigation rapide
- ✅ Pas d’écrasement par des réponses API retardées

---

## 2026-02-20 | Correctif faux message "Erreur de connexion" avec cache période

**Tâche** : Supprimer le message d’erreur affiché à tort lorsque les données sont bien chargées pendant les changements de période.

**Fichiers modifiés** :
- `frontend-business/src/lib/api/client.ts` – ne convertit plus un `AbortError` en `ApiError` réseau
- `frontend-business/src/lib/stores/orders.svelte.ts` – annulation uniquement si la nouvelle requête vise une clé différente
- `frontend-business/src/lib/stores/deliveries.svelte.ts` – même correctif côté livraisons

**Résultat** :
- ✅ Plus de faux "Erreur de connexion au serveur" lors des navigations rapides de période
- ✅ Les annulations techniques (`AbortController`) restent silencieuses côté UI

---

_Continuer à documenter les modifications importantes au fur et à mesure..._
