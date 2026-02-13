## 💡 Suggestion d'amélioration : Filtrer la carte par état de livraison/commande

**Fonctionnalité proposée :**

---

## 🎯 Fonctionnalité : Cacher/Afficher les marqueurs par statut

**Description :** Permettre à l'utilisateur de masquer ou afficher les marqueurs sur la carte en cliquant sur les badges de statut.

### 📋 Statuts concernés

#### Pour les Commandes (Orders)
- **En attente** / Pending
- **Prévue** / Planned
- **En cours** / En transit / InTransit
- **Livrée** / Delivered
- **Annulée** / Cancelled

#### Pour les Livraisons (Deliveries)
- **En attente** / Prévue / Pending
- **En cours** / En transit / InProgress
- **Livrée** / Completed
- **Annulée** / Échouée / Failed / Cancelled

### 🎨 Comportement attendu

1. **Interface de filtrage**
   - Ajouter une barre de filtres au-dessus ou à côté de la carte
   - Afficher des badges/cliquables pour chaque statut
   - Chaque badge peut être activé/désactivé (toggle)

2. **États visuels**
   - **Actif** : Badge avec fond coloré + marqueurs visibles sur la carte
   - **Inactif** : Badge grisé/transparent + marqueurs masqués sur la carte
   - **Indicateur** : Icône ✓ ou ✗ pour montrer l'état du filtre

3. **Interaction**
   - Clic sur un badge → Toggle l'affichage des marqueurs de ce statut
   - Clic sur "Tout afficher" → Affiche tous les statuts
   - Clic sur "Tout masquer" → Masque tous les statuts
   - Sauvegarde de la préférence dans localStorage (optionnel)

4. **Filtrage combiné**
   - Possibilité de combiner plusieurs filtres (ex: afficher seulement "En cours" + "Livrée")
   - Les marqueurs filtrés disparaissent/apparaissent en temps réel

### 🔧 Implémentation suggérée

#### Frontend (Svelte 5)
```typescript
// Store pour gérer les filtres de statut
let statusFilters = $state({
  orders: {
    pending: true,
    planned: true,
    inTransit: true,
    delivered: true,
    cancelled: true
  },
  deliveries: {
    pending: true,
    inProgress: true,
    completed: true,
    failed: true
  }
});

// Filtrer les marqueurs selon les filtres actifs
const filteredMarkers = $derived(
  markersList.filter(marker => {
    if (marker.type === 'order') {
      const status = marker.status?.toLowerCase();
      if (status === 'pending' || status === 'en attente') return statusFilters.orders.pending;
      if (status === 'planned' || status === 'prévue') return statusFilters.orders.planned;
      if (status === 'intransit' || status === 'en cours') return statusFilters.orders.inTransit;
      if (status === 'delivered' || status === 'livrée') return statusFilters.orders.delivered;
      if (status === 'cancelled' || status === 'annulée') return statusFilters.orders.cancelled;
    }
    if (marker.type === 'delivery') {
      const status = marker.status?.toLowerCase();
      if (status === 'pending' || status === 'prévue') return statusFilters.deliveries.pending;
      if (status === 'inprogress' || status === 'en cours') return statusFilters.deliveries.inProgress;
      if (status === 'completed' || status === 'livrée') return statusFilters.deliveries.completed;
      if (status === 'failed' || status === 'échouée' || status === 'annulée') return statusFilters.deliveries.failed;
    }
    return true; // Par défaut, afficher les autres types (driver, etc.)
  })
);
```

#### Composant UI
- Utiliser des `Badge` ou `Button` avec variant selon le statut
- Ajouter un `Switch` ou un indicateur visuel pour montrer l'état actif/inactif
- Grouper les filtres par type (Commandes / Livraisons) avec `Separator`

### 📍 Emplacement dans l'interface

**Option 1 : Barre de filtres horizontale**
- Au-dessus de la carte
- Badges alignés horizontalement
- Responsive : wrap sur mobile

**Option 2 : Panneau latéral**
- À gauche ou à droite de la carte
- Liste verticale des filtres
- Collapsible pour économiser l'espace

**Option 3 : Menu déroulant**
- Bouton "Filtrer par statut" qui ouvre un popover
- Checkboxes pour chaque statut
- Bouton "Appliquer" ou application en temps réel

### ✅ Avantages

- **Meilleure lisibilité** : Réduit le nombre de marqueurs visibles simultanément
- **Focus sur l'essentiel** : Permet de se concentrer sur certains statuts
- **Performance** : Moins de marqueurs à rendre = meilleures performances
- **UX améliorée** : Contrôle granulaire sur l'affichage de la carte

### 🎯 Priorité

**Moyenne** - Améliore l'expérience utilisateur mais n'est pas critique pour le MVP.

### 📝 Notes techniques

- Les filtres doivent fonctionner avec les marqueurs existants (`TypedMapMarker`)
- Prendre en compte les statuts en français ET en anglais (normalisation)
- Tester avec de nombreuses commandes/livraisons pour vérifier les performances
- Optionnel : Persister les préférences de filtrage dans localStorage

---