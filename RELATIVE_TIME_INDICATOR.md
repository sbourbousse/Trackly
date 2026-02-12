# Ajout de l'Affichage de Temps Relatif avec Code Couleur

## Vue d'ensemble

Implémentation d'un système unifié d'affichage des dates avec temps relatif et code couleur cohérent dans toute l'application. L'affichage principal montre le temps relatif (ex: "Dans 2h", "Il y a 3j"), tandis qu'un tooltip révèle la date et heure complètes.

## Composant Créé

### `RelativeTimeIndicator.svelte`

Composant réutilisable qui affiche :
- **Temps relatif** : Format court et lisible (affichage principal)
- **Date complète** : Format français complet (dans tooltip au survol)
- **Code couleur** : Indication visuelle selon l'urgence

#### Props

```typescript
{
  date: string | null;           // Date ISO 8601
  class?: string;                // Classes CSS additionnelles
  showTime?: boolean;            // Affiche l'heure pour dates < 24h
}
```

#### Niveaux d'Urgence et Couleurs

| Niveau | Condition | Couleur | Exemple |
|--------|-----------|---------|---------|
| **Overdue** | Date passée | Rouge (`text-red-600`) | "Il y a 2h" |
| **Urgent** | < 30 minutes | Jaune (`text-yellow-600`) | "Dans 15m" |
| **Soon** | 30min - 2h | Orange (`text-orange-600`) | "Dans 1h" |
| **Normal** | > 2h | Gris (`text-muted-foreground`) | "Dans 5h" |

#### Format de Temps Relatif

**Passé** :
- Moins d'1h : "Il y a Xm" (minutes)
- < 24h : "Il y a Xh" (heures)
- 1 jour : "Hier"
- < 7 jours : "Il y a Xj" (jours)
- ≥ 7 jours : "Il y a Xsem" (semaines)

**Futur** :
- < 1 minute : "Maintenant"
- < 30 minutes : "Dans Xm"
- < 2 heures : "Dans Xh"
- < 24 heures : "Dans Xh"
- 1 jour : "Demain"
- < 7 jours : "Dans Xj"
- ≥ 7 jours : "Dans Xsem"

#### Option `showTime`

Quand `showTime={true}` et la date est à moins de 24h :
```
"Dans 2h (14:30)"  // Au lieu de "Dans 2h"
"Il y a 3h (11:15)" // Au lieu de "Il y a 3h"
```

## Interfaces Mises à Jour

### 1. **Nouvelle Tournée - Commandes à Livrer**

**Fichier** : `frontend-business/src/routes/deliveries/new/+page.svelte`

**Modification** :
- Ajout de la colonne "Date" dans le tableau des commandes
- Affichage du temps relatif avec `showTime={true}` pour voir l'heure
- Tooltip avec date complète au survol

**Avant** :
```svelte
<TableHead>Statut</TableHead>
<TableHead>Client</TableHead>
```

**Après** :
```svelte
<TableHead>Statut</TableHead>
<TableHead>Date</TableHead>
<TableHead>Client</TableHead>
```

**Utilisation** :
```svelte
<TableCell>
  <RelativeTimeIndicator date={order.orderDate} showTime={true} />
</TableCell>
```

### 2. **Liste des Livraisons**

**Fichier** : `frontend-business/src/routes/deliveries/+page.svelte`

**Modification** :
- Ajout de la colonne "Date" dans le tableau des livraisons
- Affichage du temps relatif depuis la création

**Colonne ajoutée** :
```svelte
<TableHead>Date</TableHead>
```

**Utilisation** :
```svelte
<TableCell>
  <RelativeTimeIndicator date={delivery.createdAt} />
</TableCell>
```

### 3. **Dashboard - Commandes Récentes**

**Fichier** : `frontend-business/src/routes/dashboard/+page.svelte`

**Modification** :
- Remplacement de `OrderDateIndicator` par `RelativeTimeIndicator`
- Temps relatif avec code couleur au lieu de date complète
- Date complète dans tooltip

**Avant** :
```svelte
<OrderDateIndicator orderDate={order.orderDate} />
```

**Après** :
```svelte
<RelativeTimeIndicator date={order.orderDate} showTime={true} />
```

### 4. **Liste des Commandes**

**Fichier** : `frontend-business/src/routes/orders/+page.svelte`

**Modification** :
- Remplacement de `OrderDateIndicator` par `RelativeTimeIndicator`
- Uniformisation de l'affichage

**Utilisation** :
```svelte
<RelativeTimeIndicator date={order.orderDate} showTime={true} />
```

### 5. **Détail d'une Commande**

**Fichier** : `frontend-business/src/routes/orders/[id]/+page.svelte`

**Modification** :
- Remplacement de `OrderDateIndicator` par `RelativeTimeIndicator`
- Affichage cohérent dans la page de détail

**Utilisation** :
```svelte
<RelativeTimeIndicator date={order.orderDate} showTime={true} />
```

## Comparaison des Composants

### `OrderDateIndicator` (existant)
- **Affichage principal** : Date complète (ex: "12/02/2026 14:30")
- **Tooltip** : Temps relatif (ex: "Dans 2 heures")
- **Usage** : Quand la date exacte est importante

### `RelativeTimeIndicator` (nouveau)
- **Affichage principal** : Temps relatif (ex: "Dans 2h")
- **Tooltip** : Date complète (ex: "12/02/2026 14:30")
- **Usage** : Pour les listes et vues d'ensemble

**Les deux composants utilisent le même système de code couleur.**

## Code Couleur Unifié

Les deux composants partagent exactement la même logique de couleur :

```typescript
switch (urgency) {
  case 'overdue':
    return 'text-red-600 dark:text-red-400 font-medium';
  case 'urgent':
    return 'text-yellow-600 dark:text-yellow-400 font-medium';
  case 'soon':
    return 'text-orange-600 dark:text-orange-400';
  case 'normal':
    return 'text-muted-foreground';
}
```

Cela garantit une cohérence visuelle à travers toute l'application.

## Exemples d'Affichage

### Exemple 1 : Commande Urgente (< 30 minutes)

**Affichage** : <span style="color: #ca8a04">Dans 15m</span>
**Tooltip** : "12/02/2026 14:45"
**Couleur** : Jaune (urgent)

### Exemple 2 : Commande Bientôt (30min - 2h)

**Affichage** : <span style="color: #ea580c">Dans 1h (15:30)</span>
**Tooltip** : "12/02/2026 15:30"
**Couleur** : Orange (soon)
**Note** : L'heure s'affiche car `showTime={true}`

### Exemple 3 : Commande Normale (> 2h)

**Affichage** : <span style="color: #71717a">Dans 5h</span>
**Tooltip** : "12/02/2026 19:00"
**Couleur** : Gris (normal)

### Exemple 4 : Commande en Retard

**Affichage** : <span style="color: #dc2626">Il y a 3h</span>
**Tooltip** : "12/02/2026 11:00"
**Couleur** : Rouge (overdue)

### Exemple 5 : Commande Demain

**Affichage** : <span style="color: #71717a">Demain</span>
**Tooltip** : "13/02/2026 10:00"
**Couleur** : Gris (normal)

## Avantages

1. **Lisibilité Améliorée** : Le temps relatif est plus intuitif que les dates absolues
2. **Compacité** : Prend moins de place dans les tableaux ("Dans 2h" vs "12/02/2026 14:30")
3. **Urgence Visuelle** : Le code couleur permet de repérer immédiatement les urgences
4. **Information Complète** : La date exacte reste accessible via tooltip
5. **Cohérence** : Même code couleur dans toute l'application
6. **Accessibilité** : Tooltip avec délai court (200ms) pour affichage rapide

## Mode Sombre

Le composant supporte le mode sombre avec des variantes adaptées :
- Rouge clair pour overdue
- Jaune clair pour urgent
- Orange clair pour soon
- Gris adapté pour normal

## Internationalisation

Tous les textes sont en français :
- "Il y a Xm/h/j/sem" pour le passé
- "Dans Xm/h/j/sem" pour le futur
- "Maintenant", "Hier", "Demain" pour les cas spéciaux
- Format de date : "JJ/MM/AAAA HH:MM"

## Tests Recommandés

1. **Affichage du temps relatif** :
   - Vérifier les différents formats (minutes, heures, jours, semaines)
   - Tester avec dates passées et futures

2. **Code couleur** :
   - Commande en retard → Rouge
   - Moins de 30 minutes → Jaune
   - 30min à 2h → Orange
   - Plus de 2h → Gris

3. **Tooltip** :
   - Vérifier l'affichage de la date complète
   - Tester le délai de 200ms

4. **Option showTime** :
   - Vérifier que l'heure s'affiche pour les dates < 24h
   - Confirmer le format "(HH:MM)"

5. **Mode sombre** :
   - Vérifier les couleurs adaptées
   - Contraste suffisant

6. **Cohérence** :
   - Même affichage sur toutes les pages
   - Même code couleur partout

## Notes Techniques

- Format de date attendu : ISO 8601 (`YYYY-MM-DDTHH:MM:SS.sssZ`)
- Calcul dynamique du temps relatif (pas de mise à jour automatique)
- Tooltip avec `TooltipProvider` de shadcn/ui
- Classes Tailwind pour le code couleur
- Support des valeurs `null` (affiche "Aucune date")
