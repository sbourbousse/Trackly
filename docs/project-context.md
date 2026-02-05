Vision du Projet : SaaS Logistique Ultra-Simplifié (TPE/Artisans)
Objectif
Fournir une solution de gestion de tournées et de suivi de colis pour les très petites entreprises (TPE) gérant leurs propres livraisons. La simplicité radicale et le coût de run minimal sont les priorités absolues.

Cible et Marché
Clients : Commerçants locaux, artisans, micro-entrepreneurs.

Volume moyen : ~73 colis/mois.

Concurrence : Onfleet ou Stuart sont trop complexes et chers pour ce segment.

Modèle Freemium
L'IA doit respecter les limites de quotas suivantes dans la logique de code :

Plan Starter (Gratuit) : Max 20-25 livraisons/mois.

Plan Pro (Payant) : ~20€/mois pour volumes supérieurs et notifications SMS.

Taux de conversion cible : 4-5%.

Interfaces principales
Business Dashboard (SvelteKit) : Import de commandes et gestion de tournées.

Driver App (Svelte 5 PWA) : Interface mobile simple pour valider les livraisons.

Client Tracking (Page Web ultra-légère) : Suivi en temps réel sans téléchargement.

Landing Page (Next.js) : Site vitrine optimisé SEO pour présenter Trackly et acquérir des leads (dossier `frontend-landing-page`).

2. docs/architecture-global.md (Structure Technique)
Ce fichier définit le cadre de développement et l'organisation des fichiers.

Architecture Globale et Workflow
Choix de l'Architecture : Monolithe Modulaire
Pourquoi : Simplicité de déploiement et performance (appels en mémoire) pour un développeur solo.

Structure Backend : Séparation par domaines (Features/Orders, Features/Tracking) au sein du même projet.NET.

Base de données : PostgreSQL unique avec isolation par TenantId (Shared Database, Shared Schema).

Structure du Monorepo
/ (root) ├── backend/ # API .NET 9 (C#) ├── frontend-business/ # SvelteKit (Dashboard) ├── frontend-driver/ # Svelte 5 PWA (Chauffeur) ├── frontend-tracking/ # Svelte (Tracking client) ├── frontend-landing-page/ # Next.js (Landing SEO, site vitrine) ├── shared/ # Types TypeScript générés automatiquement └── docs/ # Documentation projet

Partage de Types
Utilisation de NSwag ou TypeGen pour synchroniser les DTO C# avec les interfaces TypeScript dans shared/.

3. docs/backend-instructions.md (dotnet.NET 9)
Consignes spécifiques pour le développement de l'API.

Instructions Backend :.NET 9 ASP.NET Core API
Principes Core
Framework :.NET 9 (Dernière version stable).

Temps Réel : Utiliser SignalR pour le push des coordonnées GPS du livreur vers les clients/commerçants.

ORM : Entity Framework Core avec Global Query Filters sur TenantId pour garantir l'isolation des données.

Communication Inter-Modules
Pas de micro-services. Utiliser MediatR ou les System.Threading.Channels pour la communication asynchrone interne (ex: notifier le module SMS quand une commande est livrée).

Intégrations Tierces
Paiements : Stripe Billing pour la gestion des abonnements freemium.

Notifications : Twilio ou Vonage pour les SMS de suivi client.

Cartographie : API Google Maps pour le géocodage et le calcul d'itinéraires.

4. docs/frontend-instructions.md (Svelte 5 Runes)
Consignes pour le développement des interfaces utilisateurs.

Instructions Frontend : Svelte 5 & Runes
Standard de Développement
Version : Svelte 5 obligatoire (Runes API).

Gestion d'état : Utiliser $state pour la réactivité, $derived pour les calculs de tournées et $effect pour les interactions avec la carte.

UI Library : shadcn-svelte (thème stone + teal, Inter, radius small) et Tailwind CSS v4 pour le frontend-business.

Spécificités Drivers (Interface Livreur)
Mode : PWA (Progressive Web App) pour accès à la géolocalisation native sans frais de store.

Ergonomie : Interface "une main", boutons larges, contrastes élevés pour usage en extérieur.

Spécificités Client Tracking
Poids : La page de tracking doit être ultra-légère (< 50kb compressé) pour s'ouvrir instantanément sur mobile via un lien SMS.

Reactivité : Utiliser le client SignalR en Svelte pour animer la position du livreur sur la carte en temps réel sans rafraîchir la page.
