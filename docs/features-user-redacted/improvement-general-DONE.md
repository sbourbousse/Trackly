# 💡 Améliorations Générales - Trackly

## 🎯 Amélioration : Ajout d'icônes aux titres d'onglets et de navigation

**Description :** Améliorer la navigation visuelle en ajoutant des icônes aux titres d'onglets et aux sections principales de l'application pour faciliter l'identification rapide des différentes sections.

---

### 📋 Contexte

Actuellement, les titres d'onglets et les sections principales utilisent uniquement du texte. L'ajout d'icônes permettra :
- **Meilleure reconnaissance visuelle** : Les utilisateurs identifient plus rapidement les sections
- **Navigation plus intuitive** : Les icônes servent de repères visuels
- **Interface plus moderne** : Alignement avec les meilleures pratiques UX
- **Accessibilité améliorée** : Les icônes complètent le texte pour une meilleure compréhension

---

### 🎨 Zones concernées

#### 1. **Titres de pages principales** (PageHeader)

Les titres des pages principales doivent être préfixés d'une icône :

- **📦 Liste des commandes** (`/orders`)
  - Icône : `PackageIcon` ou `ShoppingCartIcon`
  - Titre actuel : "Commandes"
  - Nouveau titre : Icône + "Commandes"

- **🚚 Liste des livraisons** (`/deliveries`)
  - Icône : `TruckIcon` ou `PackageCheckIcon`
  - Titre actuel : "Livraisons"
  - Nouveau titre : Icône + "Livraisons"

- **👥 Liste des chauffeurs** (`/drivers`)
  - Icône : `UsersIcon` ou `UserCheckIcon`
  - Titre actuel : "Livreurs"
  - Nouveau titre : Icône + "Livreurs"

- **🗺️ Carte** (`/map`)
  - Icône : `MapPinIcon` ou `MapIcon`
  - Titre actuel : "Carte"
  - Nouveau titre : Icône + "Carte"

- **📊 Dashboard** (`/dashboard`)
  - Icône : `LayoutDashboardIcon` ou `BarChartIcon`
  - Titre actuel : "Dashboard"
  - Nouveau titre : Icône + "Dashboard"

#### 2. **Onglets dans les pages** (Tabs)

Les onglets doivent également inclure des icônes :

**Exemple dans `/dashboard` :**
- **📋 Commandes en attente** (`TabsTrigger value="commandes-attente"`)
  - Icône : `ClockIcon` ou `HourglassIcon`
  
- **🚚 Livraisons** (`TabsTrigger value="tournees"`)
  - Icône : `TruckIcon` ou `PackageCheckIcon`

**Exemple dans `/orders` :**
- Si des onglets existent pour filtrer par statut, ajouter des icônes :
  - **⏳ En attente** : `ClockIcon`
  - **📅 Prévues** : `CalendarIcon`
  - **🚀 En cours** : `PlayIcon` ou `ArrowRightIcon`
  - **✅ Livrées** : `CheckCircleIcon`
  - **❌ Annulées** : `XCircleIcon`

#### 3. **CardTitle dans les sections**

Les titres de cartes (`CardTitle`) peuvent également bénéficier d'icônes :

- **📋 Liste des commandes** (`CardTitle` dans `/orders`)
- **👥 Liste des livreurs** (`CardTitle` dans `/drivers`)
- **🚚 Liste des livraisons** (`CardTitle` dans `/deliveries`)

---

### 🔧 Implémentation suggérée

#### Bibliothèque d'icônes

Le projet utilise déjà **Lucide Svelte** (`@lucide/svelte`), qui est parfait pour cette fonctionnalité.

#### Composant PageHeader modifié

```svelte
<!-- PageHeader.svelte -->
<script lang="ts">
  import type { Component } from 'svelte';
  
  interface Props {
    title: string;
    subtitle?: string;
    icon?: Component; // Composant d'icône Lucide
  }
  
  let { title, subtitle, icon: Icon }: Props = $props();
</script>

<div class="space-y-1.5">
  <h1 class="text-xl font-semibold tracking-tight flex items-center gap-2">
    {#if Icon}
      <Icon class="size-5 shrink-0" aria-hidden="true" />
    {/if}
    <span>{title}</span>
  </h1>
  {#if subtitle}
    <p class="text-sm text-muted-foreground">{subtitle}</p>
  {/if}
</div>
```

#### Utilisation dans les pages

```svelte
<!-- orders/+page.svelte -->
<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import PackageIcon from '@lucide/svelte/icons/package';
</script>

<PageHeader 
  title="Commandes" 
  subtitle="Centralise les commandes avant création des tournées."
  icon={PackageIcon}
/>
```

#### Composant TabsTrigger avec icône

```svelte
<!-- Modification de tabs-trigger.svelte ou utilisation dans les pages -->
<script lang="ts">
  import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TruckIcon from '@lucide/svelte/icons/truck';
</script>

<TabsList>
  <TabsTrigger value="commandes-attente">
    <ClockIcon class="mr-2 size-4" aria-hidden="true" />
    Commandes en attente
  </TabsTrigger>
  <TabsTrigger value="tournees">
    <TruckIcon class="mr-2 size-4" aria-hidden="true" />
    Livraisons
  </TabsTrigger>
</TabsList>
```

#### CardTitle avec icône

```svelte
<!-- Exemple dans drivers/+page.svelte -->
<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
</script>

<CardHeader>
  <CardTitle class="flex items-center gap-2">
    <UsersIcon class="size-5 shrink-0" aria-hidden="true" />
    Liste des livreurs
  </CardTitle>
</CardHeader>
```

---

### 📐 Spécifications de design

#### Taille des icônes
- **PageHeader** : `size-5` (20px) - Taille légèrement plus grande pour les titres principaux
- **TabsTrigger** : `size-4` (16px) - Taille standard pour les onglets
- **CardTitle** : `size-5` (20px) - Cohérent avec PageHeader

#### Espacement
- **Gap entre icône et texte** : `gap-2` (8px) pour PageHeader et CardTitle
- **Margin-right pour TabsTrigger** : `mr-2` (8px)

#### Couleur
- Les icônes héritent de la couleur du texte parent
- Utiliser `text-muted-foreground` si besoin de distinction visuelle
- Conserver la couleur du texte pour la cohérence

#### Accessibilité
- Ajouter `aria-hidden="true"` sur toutes les icônes décoratives
- Le texte reste lisible et accessible pour les lecteurs d'écran
- Les icônes complètent le texte, ne le remplacent pas

---

### 📋 Mapping des icônes suggérées

| Section | Titre actuel | Icône suggérée | Code Lucide |
|---------|--------------|----------------|-------------|
| Dashboard | Dashboard | `LayoutDashboardIcon` | `layout-dashboard` |
| Commandes | Commandes | `PackageIcon` | `package` |
| Livraisons | Livraisons | `TruckIcon` | `truck` |
| Livreurs | Livreurs | `UsersIcon` | `users` |
| Carte | Carte | `MapPinIcon` | `map-pin` |
| En attente | En attente | `ClockIcon` | `clock` |
| Prévue | Prévue | `CalendarIcon` | `calendar` |
| En cours | En cours | `PlayIcon` | `play` |
| Livrée | Livrée | `CheckCircleIcon` | `check-circle-2` |
| Annulée | Annulée | `XCircleIcon` | `x-circle` |

---

### ✅ Checklist d'implémentation

#### Phase 1 : Composants de base
- [ ] Modifier `PageHeader.svelte` pour accepter une prop `icon`
- [ ] Tester l'affichage avec une icône dans une page
- [ ] Vérifier la responsivité (mobile/desktop)

#### Phase 2 : Pages principales
- [ ] Ajouter icône à `/dashboard` (Dashboard)
- [ ] Ajouter icône à `/orders` (Commandes)
- [ ] Ajouter icône à `/deliveries` (Livraisons)
- [ ] Ajouter icône à `/drivers` (Livreurs)
- [ ] Ajouter icône à `/map` (Carte)

#### Phase 3 : Onglets
- [ ] Ajouter icônes aux onglets du Dashboard
- [ ] Ajouter icônes aux onglets des autres pages si applicable
- [ ] Vérifier l'alignement et l'espacement

#### Phase 4 : CardTitle
- [ ] Ajouter icônes aux CardTitle dans `/orders`
- [ ] Ajouter icônes aux CardTitle dans `/drivers`
- [ ] Ajouter icônes aux CardTitle dans `/deliveries`

#### Phase 5 : Tests et polish
- [ ] Vérifier la cohérence visuelle globale
- [ ] Tester l'accessibilité (lecteurs d'écran)
- [ ] Vérifier le mode sombre/clair
- [ ] Ajuster les espacements si nécessaire

---

### 🎯 Priorité

**Moyenne** - Améliore significativement l'UX mais n'est pas critique pour le fonctionnement de l'application.

---

### 📝 Notes techniques

- **Bibliothèque** : Utiliser `@lucide/svelte` déjà présente dans le projet
- **Performance** : Les icônes SVG sont légères et ne devraient pas impacter les performances
- **Cohérence** : S'assurer que les mêmes icônes sont utilisées dans la sidebar (`AppSidebar.svelte`) pour maintenir la cohérence
- **Rétrocompatibilité** : La prop `icon` doit être optionnelle pour ne pas casser les pages existantes

---

### 🔗 Références

- **Lucide Icons** : https://lucide.dev/icons/
- **Sidebar existante** : `frontend-business/src/lib/components/AppSidebar.svelte` (utilise déjà des icônes Lucide)
- **Composant PageHeader** : À modifier pour accepter les icônes
- **Composant TabsTrigger** : À adapter pour supporter les icônes
