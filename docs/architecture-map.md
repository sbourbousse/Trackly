# Architecture Map - Schéma des Services et Flux SignalR

## Vue d'Ensemble
```
┌─────────────────────────────────────────────────────────────┐
│                    Trackly - Monolithe Modulaire            │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Frontend    │      │  Frontend    │      │  Frontend    │
│  Business    │      │  Driver      │      │  Tracking    │
│  (SvelteKit) │      │  (PWA)       │      │  (Svelte)    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend .NET 9 │
                    │  (Minimal APIs) │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌───────▼──────┐   ┌──────▼──────┐
    │ PostgreSQL │    │  SignalR Hub │   │  Intégrations│
    │ (Multi-    │    │  (Typé)      │   │  (Stripe,    │
    │  Tenant)   │    │              │   │   SMS, Maps) │
    └────────────┘    └──────────────┘   └──────────────┘
```

## Flux SignalR - Temps Réel

### Flux GPS Driver → Clients
```
Driver App (PWA)
    │
    │ Géolocalisation native
    │
    ▼
SignalR Hub (TrackingHub)
    │
    ├──► Business Dashboard (Position livreur)
    │
    └──► Client Tracking Page (Position livreur animée)
```

### Flux Événements Livraison
```
Driver App
    │
    │ Validation livraison
    │
    ▼
Backend (Features/Orders)
    │
    ├──► SignalR Hub (Notification)
    │    │
    │    ├──► Business Dashboard (Mise à jour statut)
    │    │
    │    └──► Client Tracking (Statut livré)
    │
    └──► MediatR/Channels
         │
         └──► Features/SMS (Notification SMS)
```

## Structure Backend par Domaines

### Features/Orders
- Gestion des commandes
- Création de tournées
- Validation des livraisons
- Quotas freemium (20-25 livraisons/mois)

### Features/Tracking
- Hub SignalR pour position GPS
- Broadcast des coordonnées
- Gestion des connexions clients

### Features/SMS
- Intégration Twilio/Vonage
- Envoi de notifications
- Liens de tracking

### Features/Billing
- Intégration Stripe
- Gestion des abonnements
- Vérification des quotas

## Isolation Multi-Tenant

### Middleware TenantId
```
Requête HTTP
    │
    ▼
Middleware (Extraction TenantId depuis JWT/Header)
    │
    ▼
Injection dans HttpContext
    │
    ▼
EF Core Global Query Filter (Filtre automatique par TenantId)
    │
    ▼
Base de données PostgreSQL
```

## Communication Inter-Modules

### Pattern MediatR
```
OrderService.CreateDelivery()
    │
    ▼
MediatR.Publish(new DeliveryCreatedEvent())
    │
    ├──► SMSHandler (Envoi SMS client)
    │
    └──► BillingHandler (Vérification quota)
```

### Pattern Channels (Alternative)
```
OrderService.CreateDelivery()
    │
    ▼
ChannelWriter.WriteAsync(new DeliveryEvent())
    │
    ▼
Background Service (Consommation asynchrone)
    │
    ├──► SMS Service
    └──► Analytics Service
```
