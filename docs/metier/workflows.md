# Workflows Métier - Trackly

## Vue d'ensemble des Processus

Ce document décrit les principaux workflows métier de l'application Trackly.

## 1. Workflow de Création de Commande

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant API as Backend API
    participant DB as Base de Données
    participant Billing as Service Billing
    
    U->>F: Créer/Importer commande
    F->>API: POST /api/orders
    API->>Billing: Vérifier quota
    Billing-->>API: Quota OK/NOK
    alt Quota OK
        API->>DB: Créer Order
        DB-->>API: Order créée
        API-->>F: 201 Created
        F-->>U: Commande créée ✅
    else Quota dépassé
        API-->>F: 403 Forbidden
        F-->>U: Erreur quota ❌
    end
```

## 2. Workflow de Création de Tournée (Livraisons)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant API as Backend API
    participant DB as Base de Données
    participant Billing as Service Billing
    
    U->>F: Créer tournée (sélection commandes + driver)
    F->>API: POST /api/deliveries/batch
    API->>DB: Vérifier commandes et driver
    DB-->>API: Validés
    API->>Billing: Vérifier quota (pour chaque livraison)
    Billing-->>API: Quota OK
    API->>DB: Créer Deliveries
    DB-->>API: Deliveries créées
    API-->>F: 200 OK (liste des livraisons)
    F-->>U: Tournée créée ✅
```

## 3. Workflow de Suppression de Commande

```mermaid
flowchart TD
    A[Utilisateur sélectionne commande] --> B{Commande a des livraisons actives?}
    B -->|Non| C[Soft delete immédiat]
    B -->|Oui| D[Erreur: Livraisons actives détectées]
    D --> E{Utilisateur choisit cascade?}
    E -->|Oui| F[Soft delete commande + livraisons]
    E -->|Non| G[Suppression bloquée]
    C --> H[Commande supprimée ✅]
    F --> H
    G --> I[Action annulée]
```

## 4. Workflow de Suppression de Livraison

```mermaid
flowchart TD
    A[Utilisateur sélectionne livraison] --> B[Confirmation]
    B --> C[Soft delete immédiat]
    C --> D[Livraison supprimée ✅]
    D --> E[Commande reste intacte]
    
    style C fill:#90EE90
    style D fill:#90EE90
    style E fill:#FFE4B5
```

## 5. Workflow de Livraison (Driver PWA)

```mermaid
sequenceDiagram
    participant D as Driver
    participant PWA as Driver PWA
    participant GPS as Service GPS
    participant API as Backend API
    participant SignalR as SignalR Hub
    participant Dashboard as Dashboard
    
    D->>PWA: Se connecter
    PWA->>API: GET /api/deliveries
    API-->>PWA: Liste des livraisons
    D->>PWA: Sélectionner livraison
    D->>PWA: Démarrer tracking
    PWA->>GPS: start()
    GPS-->>PWA: Position GPS
    PWA->>SignalR: UpdateLocation(deliveryId, lat, lng)
    SignalR->>Dashboard: Broadcast position
    SignalR->>API: Mettre à jour position
    D->>PWA: Marquer comme livrée
    PWA->>API: PATCH /api/deliveries/{id}/complete
    API-->>PWA: 200 OK
    PWA-->>D: Livraison complétée ✅
```

## 6. Workflow de Tracking Temps Réel

```mermaid
sequenceDiagram
    participant Driver as Driver PWA
    participant SignalR as SignalR Hub
    participant Dashboard as Dashboard Business
    participant Client as Client Tracking
    
    Driver->>SignalR: Connect + JoinDeliveryGroup
    SignalR-->>Driver: Connected
    Driver->>SignalR: UpdateLocation(lat, lng)
    SignalR->>Dashboard: LocationUpdated(deliveryId, lat, lng)
    SignalR->>Client: LocationUpdated(deliveryId, lat, lng)
    Dashboard->>Dashboard: Mettre à jour carte
    Client->>Client: Mettre à jour carte
```

## 7. Workflow Complet : De la Commande à la Livraison

```mermaid
flowchart LR
    A[Commande créée] --> B[Statut: Pending]
    B --> C[Création tournée]
    C --> D[Livraisons créées]
    D --> E[Statut: Pending]
    E --> F[Driver démarre]
    F --> G[Statut: InProgress]
    G --> H[Tracking GPS actif]
    H --> I[Livraison complétée]
    I --> J[Statut: Completed]
    J --> K[Commande: Delivered]
    
    style A fill:#E3F2FD
    style B fill:#FFF3E0
    style E fill:#FFF3E0
    style G fill:#FFF9C4
    style J fill:#C8E6C9
    style K fill:#C8E6C9
```

## 8. Workflow de Suppression Multiple avec Cascade

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant API as Backend API
    participant DB as Base de Données
    
    U->>F: Sélectionne plusieurs commandes
    U->>F: Coche "Supprimer aussi livraisons"
    F->>API: POST /api/orders/batch/delete<br/>{ids, forceDeleteDeliveries: true}
    API->>DB: Récupérer commandes
    API->>DB: Vérifier livraisons actives
    API->>DB: Soft delete commandes
    API->>DB: Soft delete livraisons (cascade)
    DB-->>API: Suppressions effectuées
    API-->>F: {deleted: X, deletedDeliveries: Y}
    F-->>U: X commandes + Y livraisons supprimées ✅
```
