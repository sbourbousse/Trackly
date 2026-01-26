# États et Transitions - Trackly

## Machine à États : Commande (Order)

```mermaid
stateDiagram-v2
    [*] --> Pending: Création
    Pending --> Planned: Planification tournée
    Planned --> InTransit: Livraison démarrée
    InTransit --> Delivered: Toutes livraisons complétées
    InTransit --> Cancelled: Annulation
    Pending --> Cancelled: Annulation
    Planned --> Cancelled: Annulation
    Delivered --> [*]
    Cancelled --> [*]
    
    note right of Pending
        Commande créée,
        en attente de planification
    end note
    
    note right of Planned
        Commande assignée à une tournée,
        livraisons créées
    end note
    
    note right of InTransit
        Au moins une livraison
        en cours
    end note
    
    note right of Delivered
        Toutes les livraisons
        complétées
    end note
```

### États de Commande

| État | Code | Description | Actions possibles |
|------|------|-------------|------------------|
| **Pending** | 0 | En attente | Créer livraison, Annuler |
| **Planned** | 1 | Planifiée | Démarrer livraison, Annuler |
| **InTransit** | 2 | En transit | Compléter livraison |
| **Delivered** | 3 | Livrée | Aucune (état final) |
| **Cancelled** | 4 | Annulée | Aucune (état final) |

## Machine à États : Livraison (Delivery)

```mermaid
stateDiagram-v2
    [*] --> Pending: Création
    Pending --> InProgress: Driver démarre tracking
    InProgress --> Completed: Livraison validée
    InProgress --> Failed: Échec livraison
    Pending --> Failed: Échec avant démarrage
    Completed --> [*]
    Failed --> [*]
    
    note right of Pending
        Livraison créée,
        en attente d'assignation
    end note
    
    note right of InProgress
        Driver actif,
        tracking GPS en cours
    end note
    
    note right of Completed
        Livraison effectuée
        avec succès
    end note
    
    note right of Failed
        Livraison échouée
        (retour, problème, etc.)
    end note
```

### États de Livraison

| État | Code | Description | Actions possibles |
|------|------|-------------|------------------|
| **Pending** | 0 | Prévue | Démarrer tracking, Supprimer |
| **InProgress** | 1 | En cours | Compléter, Arrêter tracking |
| **Completed** | 2 | Livrée | Aucune (état final) |
| **Failed** | 3 | Échouée | Aucune (état final) |

## Diagramme de Transitions Complet

```mermaid
graph TB
    subgraph "Cycle de Vie Commande"
        OC[Order Created] --> OP[Pending]
        OP --> OPL[Planned]
        OPL --> OIT[InTransit]
        OIT --> OD[Delivered]
        OP --> OCANC[Cancelled]
        OPL --> OCANC
    end
    
    subgraph "Cycle de Vie Livraison"
        DC[Delivery Created] --> DP[Pending]
        DP --> DIP[InProgress]
        DIP --> DCOM[Completed]
        DIP --> DFAIL[Failed]
        DP --> DFAIL
    end
    
    OPL -.->|Crée| DC
    DIP -.->|Démarre| OIT
    DCOM -.->|Complète| OD
    
    style OC fill:#E3F2FD
    style OP fill:#FFF3E0
    style OPL fill:#FFF3E0
    style OIT fill:#FFF9C4
    style OD fill:#C8E6C9
    style OCANC fill:#FFCDD2
    
    style DC fill:#E3F2FD
    style DP fill:#FFF3E0
    style DIP fill:#FFF9C4
    style DCOM fill:#C8E6C9
    style DFAIL fill:#FFCDD2
```

## Règles de Transition

### Commandes

1. **Pending → Planned** : Quand une livraison est créée pour cette commande
2. **Planned → InTransit** : Quand au moins une livraison passe à `InProgress`
3. **InTransit → Delivered** : Quand toutes les livraisons sont `Completed`
4. **Any → Cancelled** : Annulation manuelle (sauf si déjà `Delivered`)

### Livraisons

1. **Pending → InProgress** : Quand le driver démarre le tracking GPS
2. **InProgress → Completed** : Quand le driver valide la livraison
3. **Any → Failed** : En cas d'échec (retour, problème, etc.)

## Diagramme de Flux : Création Tournée

```mermaid
flowchart TD
    Start([Démarrer création tournée]) --> SelectOrders[Sélectionner commandes]
    SelectOrders --> SelectDriver[Sélectionner chauffeur]
    SelectDriver --> CheckQuota{Vérifier quota}
    CheckQuota -->|Quota OK| CreateDeliveries[Créer livraisons]
    CheckQuota -->|Quota dépassé| ErrorQuota[Erreur: Quota dépassé]
    CreateDeliveries --> UpdateOrderStatus[Mettre à jour statut commandes: Planned]
    UpdateOrderStatus --> Success([Tournée créée ✅])
    ErrorQuota --> End([Fin])
    Success --> End
    
    style Start fill:#E3F2FD
    style Success fill:#C8E6C9
    style ErrorQuota fill:#FFCDD2
    style End fill:#F5F5F5
```

## Diagramme de Flux : Suppression avec Dépendances

```mermaid
flowchart TD
    Start([Démarrer suppression]) --> CheckType{Type d'entité?}
    
    CheckType -->|Livraison| DeleteDelivery[Soft delete livraison]
    DeleteDelivery --> SuccessDelivery([Supprimé ✅])
    
    CheckType -->|Commande| CheckDeliveries{Commande a livraisons actives?}
    CheckDeliveries -->|Non| DeleteOrder[Soft delete commande]
    CheckDeliveries -->|Oui| CheckCascade{Cascade activée?}
    CheckCascade -->|Non| ErrorBlocked[Erreur: Bloqué]
    CheckCascade -->|Oui| DeleteOrderCascade[Soft delete commande + livraisons]
    DeleteOrder --> SuccessOrder([Supprimé ✅])
    DeleteOrderCascade --> SuccessCascade([Supprimé avec cascade ✅])
    ErrorBlocked --> End([Fin])
    SuccessDelivery --> End
    SuccessOrder --> End
    SuccessCascade --> End
    
    style Start fill:#E3F2FD
    style SuccessDelivery fill:#C8E6C9
    style SuccessOrder fill:#C8E6C9
    style SuccessCascade fill:#C8E6C9
    style ErrorBlocked fill:#FFCDD2
    style End fill:#F5F5F5
```
