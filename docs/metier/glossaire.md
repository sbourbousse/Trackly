# Glossaire Métier - Trackly

## Termes Métier

### Commande (Order)

**Définition** : Demande de livraison d'un client. Représente une intention de livraison avant planification.

**Caractéristiques** :
- Créée manuellement ou importée via CSV
- Peut exister sans livraison (en attente)
- Statut : Pending, Planned, InTransit, Delivered, Cancelled

**Exemple** : "Commande de 10 colis pour Client XYZ à l'adresse 123 Rue ABC"

### Livraison (Delivery)

**Définition** : Action concrète de livraison assignée à un chauffeur. Représente une livraison physique.

**Caractéristiques** :
- Toujours liée à une commande
- Toujours assignée à un chauffeur
- Statut : Pending, InProgress, Completed, Failed
- Peut être trackée en temps réel via GPS

**Exemple** : "Livraison de la commande XYZ par le chauffeur Alex Dupont"

### Tournée

**Définition** : Regroupement logique de plusieurs livraisons partageant le même chauffeur et créées le même jour.

**Caractéristiques** :
- **Pas d'entité en base** : Concept logique uniquement
- Regroupement par `DriverId` et date
- Affichée comme une unité dans l'interface

**Exemple** : "Tournée Est - Matin" = Toutes les livraisons d'Alex Dupont créées aujourd'hui

**Note** : Dans le code, une "tournée" est souvent représentée par une liste de `Delivery` partageant le même `DriverId`.

### Chauffeur (Driver)

**Définition** : Personne physique responsable de la livraison des colis.

**Caractéristiques** :
- Appartient à un tenant
- Peut avoir plusieurs livraisons assignées
- Utilise l'application Driver PWA pour valider les livraisons

**Exemple** : "Alex Dupont, téléphone +33 6 00 00 00 00"

### Tenant

**Définition** : Organisation cliente utilisant Trackly. Chaque tenant est isolé des autres.

**Caractéristiques** :
- Possède ses propres commandes, livraisons et chauffeurs
- A un plan d'abonnement (Starter/Pro)
- Isolation complète des données

**Exemple** : "Atelier Moreau", "Boulangerie Romy"

## États et Statuts

### Statuts de Commande

| Statut | Code | Description |
|--------|------|-------------|
| **Pending** | 0 | Commande créée, en attente de planification |
| **Planned** | 1 | Commande planifiée, livraisons créées |
| **InTransit** | 2 | Au moins une livraison en cours |
| **Delivered** | 3 | Toutes les livraisons complétées |
| **Cancelled** | 4 | Commande annulée |

### Statuts de Livraison

| Statut | Code | Description |
|--------|------|-------------|
| **Pending** | 0 | Livraison créée, en attente |
| **InProgress** | 1 | Livraison en cours, tracking GPS actif |
| **Completed** | 2 | Livraison effectuée avec succès |
| **Failed** | 3 | Livraison échouée (retour, problème) |

## Concepts Techniques

### Soft Delete

**Définition** : Suppression logique où l'enregistrement n'est pas physiquement supprimé mais marqué comme supprimé.

**Implémentation** : Champ `DeletedAt` nullable qui contient la date de suppression.

**Avantages** :
- Historique complet
- Possibilité de restauration
- Traçabilité

### Multi-Tenancy

**Définition** : Architecture où une seule instance de l'application sert plusieurs clients (tenants) de manière isolée.

**Modèle Trackly** : Shared Database, Shared Schema avec isolation par `TenantId`.

**Isolation** :
- Toutes les requêtes filtrées par `TenantId`
- Global Query Filters dans Entity Framework
- Vérification dans tous les endpoints

### Quota

**Définition** : Limite mensuelle de livraisons selon le plan d'abonnement.

**Plans** :
- **Starter** : 20-25 livraisons/mois (gratuit)
- **Pro** : Illimité (payant)

**Vérification** : Avant chaque création de commande ou livraison.

## Relations Clés

### Commande → Livraison

**Type** : 1:N (une commande peut générer plusieurs livraisons)

**Cas d'usage** :
- **Normal** : 1 commande = 1 livraison
- **Exceptionnel** : 1 commande = N livraisons (relivraison, problème)

### Chauffeur → Livraison

**Type** : 1:N (un chauffeur peut effectuer plusieurs livraisons)

**Regroupement** : Les livraisons d'un même chauffeur = "Tournée"

### Tenant → Toutes les entités

**Type** : 1:N (un tenant possède toutes ses entités)

**Isolation** : Garantie par `TenantId` sur toutes les entités

## Workflows Métier

### Workflow Standard

```
1. Création Commande (Pending)
   ↓
2. Création Tournée (sélection commandes + chauffeur)
   ↓
3. Création Livraisons (Pending)
   ↓
4. Driver démarre tracking (InProgress)
   ↓
5. Driver complète livraison (Completed)
   ↓
6. Commande → Delivered (si toutes livraisons complétées)
```

### Workflow de Suppression

```
Livraison :
  Sélection → Confirmation → Soft Delete ✅

Commande :
  Sélection → Vérification livraisons → {
    Aucune : Soft Delete ✅
    Présentes : {
      Sans cascade : Bloqué ❌
      Avec cascade : Soft Delete commande + livraisons ✅
    }
  }
```
