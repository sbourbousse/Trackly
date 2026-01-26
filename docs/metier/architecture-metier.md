# Architecture Métier - Trackly

## Vue d'ensemble du Domaine

Trackly est organisé autour de quatre domaines métier principaux, chacun géré dans un module séparé.

## Diagramme d'Architecture Métier

```mermaid
graph TB
    subgraph "Couche Présentation"
        FB[Frontend Business<br/>SvelteKit]
        FD[Frontend Driver<br/>Svelte 5 PWA]
        FT[Frontend Tracking<br/>Page légère]
    end
    
    subgraph "Couche API"
        API[Backend API<br/>.NET 9 Minimal APIs]
    end
    
    subgraph "Domaines Métier"
        DOM[Domain Orders<br/>Gestion Commandes]
        DDM[Domain Deliveries<br/>Gestion Livraisons]
        DDM2[Domain Drivers<br/>Gestion Chauffeurs]
        DTM[Domain Tracking<br/>Suivi Temps Réel]
    end
    
    subgraph "Infrastructure"
        DB[(PostgreSQL<br/>Base de Données)]
        SR[SignalR Hub<br/>Temps Réel]
        BILL[Billing Service<br/>Gestion Quotas]
    end
    
    FB --> API
    FD --> API
    FT --> API
    FD --> SR
    FT --> SR
    
    API --> DOM
    API --> DDM
    API --> DDM2
    API --> DTM
    
    DOM --> DB
    DDM --> DB
    DDM2 --> DB
    DTM --> SR
    
    DOM --> BILL
    DDM --> BILL
    
    style FB fill:#E3F2FD
    style FD fill:#E8F5E9
    style FT fill:#FFF3E0
    style API fill:#F3E5F5
    style DB fill:#FFE0B2
    style SR fill:#E1BEE7
```

## Organisation par Domaines

### 1. Domain Orders (Commandes)

**Responsabilité** : Gestion du cycle de vie des commandes.

**Entités** :
- `Order` : Commande client

**Endpoints** :
- `POST /api/orders` : Créer une commande
- `POST /api/orders/import` : Importer des commandes (CSV)
- `GET /api/orders` : Lister les commandes
- `GET /api/orders/{id}` : Détail d'une commande
- `DELETE /api/orders/{id}` : Supprimer une commande
- `POST /api/orders/batch/delete` : Supprimer plusieurs commandes

**Règles métier** :
- Vérification quota avant création
- Soft delete avec vérification dépendances
- Statut automatique selon livraisons

### 2. Domain Deliveries (Livraisons)

**Responsabilité** : Gestion des livraisons et tournées.

**Entités** :
- `Delivery` : Livraison individuelle

**Endpoints** :
- `GET /api/deliveries` : Lister les livraisons
- `POST /api/deliveries` : Créer une livraison
- `POST /api/deliveries/batch` : Créer plusieurs livraisons (tournée)
- `PATCH /api/deliveries/{id}/complete` : Compléter une livraison
- `DELETE /api/deliveries/{id}` : Supprimer une livraison
- `POST /api/deliveries/batch/delete` : Supprimer plusieurs livraisons
- `GET /api/deliveries/{id}/tracking` : Suivi d'une livraison

**Règles métier** :
- Vérification quota avant création
- Suppression indépendante de la commande
- Tracking GPS temps réel

### 3. Domain Drivers (Chauffeurs)

**Responsabilité** : Gestion des chauffeurs.

**Entités** :
- `Driver` : Chauffeur

**Endpoints** :
- `GET /api/drivers` : Lister les chauffeurs

**Règles métier** :
- Isolation par tenant
- Pas de soft delete (à implémenter si nécessaire)

### 4. Domain Tracking (Suivi Temps Réel)

**Responsabilité** : Communication temps réel pour le suivi GPS.

**Composants** :
- `TrackingHub` : Hub SignalR
- `ITrackingClient` : Interface typée pour les clients

**Méthodes SignalR** :
- `JoinDeliveryGroup(deliveryId)` : Rejoindre un groupe de suivi
- `UpdateLocation(deliveryId, lat, lng)` : Mettre à jour la position

**Règles métier** :
- Isolation par tenant dans le Hub
- Broadcast à tous les clients du groupe
- Reconnexion automatique

## Flux de Données Principal

```mermaid
flowchart LR
    A[Commande créée] --> B[Création tournée]
    B --> C[Livraisons créées]
    C --> D[Driver assigné]
    D --> E[Tracking GPS]
    E --> F[Livraison complétée]
    F --> G[Commande livrée]
    
    style A fill:#E3F2FD
    style C fill:#E8F5E9
    style E fill:#FFF9C4
    style G fill:#C8E6C9
```

## Diagramme de Séquence : Création Tournée Complète

```mermaid
sequenceDiagram
    participant U as Utilisateur Business
    participant FB as Frontend Business
    participant API as Backend API
    participant Orders as Domain Orders
    participant Deliveries as Domain Deliveries
    participant Drivers as Domain Drivers
    participant Billing as Billing Service
    participant DB as PostgreSQL
    
    U->>FB: Créer tournée (sélection commandes + driver)
    FB->>API: POST /api/deliveries/batch
    API->>Orders: Vérifier commandes existantes
    Orders->>DB: SELECT Orders WHERE Id IN (...)
    DB-->>Orders: Commandes trouvées
    Orders-->>API: Validation OK
    
    API->>Drivers: Vérifier driver existe
    Drivers->>DB: SELECT Driver WHERE Id = ...
    DB-->>Drivers: Driver trouvé
    Drivers-->>API: Validation OK
    
    API->>Billing: Vérifier quota (pour chaque livraison)
    Billing->>DB: COUNT Deliveries ce mois
    DB-->>Billing: Nombre livraisons
    Billing-->>API: Quota OK
    
    API->>Deliveries: Créer livraisons
    Deliveries->>DB: INSERT Deliveries (batch)
    DB-->>Deliveries: Livraisons créées
    Deliveries-->>API: Succès
    
    API-->>FB: 200 OK (liste livraisons)
    FB-->>U: Tournée créée ✅
```

## Diagramme de Composants

```mermaid
graph TB
    subgraph "Frontend"
        FB[Frontend Business<br/>Dashboard]
        FD[Frontend Driver<br/>PWA Mobile]
        FT[Frontend Tracking<br/>Page Client]
    end
    
    subgraph "Backend API"
        EP[Endpoints<br/>Minimal APIs]
        MW[Middleware<br/>Tenant, CORS]
    end
    
    subgraph "Domaines"
        DO[Orders Domain]
        DD[Deliveries Domain]
        DRI[Drivers Domain]
        DT[Tracking Domain]
    end
    
    subgraph "Services"
        BS[Billing Service]
        TC[Tenant Context]
    end
    
    subgraph "Infrastructure"
        EF[Entity Framework]
        SR[SignalR]
        PG[(PostgreSQL)]
    end
    
    FB --> EP
    FD --> EP
    FD --> SR
    FT --> SR
    
    EP --> MW
    MW --> DO
    MW --> DD
    MW --> DRI
    MW --> DT
    
    DO --> BS
    DD --> BS
    DO --> TC
    DD --> TC
    DRI --> TC
    
    DO --> EF
    DD --> EF
    DRI --> EF
    
    EF --> PG
    DT --> SR
    
    style FB fill:#E3F2FD
    style FD fill:#E8F5E9
    style FT fill:#FFF3E0
    style EP fill:#F3E5F5
    style PG fill:#FFE0B2
    style SR fill:#E1BEE7
```

## Isolation et Sécurité

### Multi-Tenancy

```mermaid
graph TB
    subgraph "Tenant A"
        TA[Tenant A]
        OA[Orders A]
        DA[Deliveries A]
        DRA[Drivers A]
    end
    
    subgraph "Tenant B"
        TB[Tenant B]
        OB[Orders B]
        DB[Deliveries B]
        DRB[Drivers B]
    end
    
    subgraph "Base de Données"
        PG[(PostgreSQL<br/>Shared Schema)]
    end
    
    TA --> OA
    TA --> DA
    TA --> DRA
    
    TB --> OB
    TB --> DB
    TB --> DRB
    
    OA --> PG
    DA --> PG
    DRA --> PG
    OB --> PG
    DB --> PG
    DRB --> PG
    
    style TA fill:#E3F2FD
    style TB fill:#FFF3E0
    style PG fill:#FFE0B2
```

**Principe** : Shared Database, Shared Schema avec isolation par `TenantId`.

## Patterns Utilisés

### 1. Feature-Based Organization

**Structure** :
```
Features/
  ├── Orders/
  ├── Deliveries/
  ├── Drivers/
  └── Tracking/
```

**Avantages** :
- Séparation claire des responsabilités
- Facilite la maintenance
- Scalabilité

### 2. Minimal APIs

**Approche** : Endpoints définis dans des classes statiques.

**Exemple** :
```csharp
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(...)
    {
        group.MapGet("/", GetOrders);
        group.MapPost("/", CreateOrder);
        // ...
    }
}
```

### 3. Global Query Filters

**Implémentation** : Filtrage automatique par `TenantId` dans Entity Framework.

**Avantage** : Isolation garantie au niveau ORM.

### 4. Soft Delete

**Implémentation** : Champ `DeletedAt` nullable sur toutes les entités.

**Avantage** : Historique complet et possibilité de restauration.
