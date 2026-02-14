# Paramètres / Settings

La page "Settings" est destinée à permettre à l'utilisateur de gérer les paramètres relatifs à son compte, à son entreprise et à certaines options personnalisables de l'application **Trackly**. Voici les sections et options potentielles à inclure, à adapter selon la cible (business/driver).

---

## 🎯 Structure de la Page

La page sera organisée en sections à onglets ou accordéons pour une navigation claire :

### 1. **Compte & Profil** 👤

#### Informations du Compte
- **Nom complet** (éditable)
- **Email** (éditable avec validation)
- **Nom de l'entreprise** (éditable)
- **Tenant ID** (lecture seule, avec bouton copier)
  - Affichage formaté : `abc123...xyz` avec tooltip complet
  - Utile pour l'app chauffeur
- **Date de création du compte** (lecture seule)
- **Dernière connexion** (lecture seule)

#### Sécurité
- **Changer le mot de passe**
  - Ancien mot de passe requis
  - Nouveau mot de passe avec validation de force
  - Confirmation du nouveau mot de passe
- **Authentification à deux facteurs (2FA)** *(Futur - Plan Pro uniquement)*
  - Activation/désactivation
  - QR Code ou SMS
- **Sessions actives**
  - Liste des sessions ouvertes (navigateur, date)
  - Bouton "Déconnecter toutes les sessions"

---

### 2. **Abonnement & Facturation** 💳

#### Plan Actuel
- **Badge du plan** : `Starter (Gratuit)` ou `Pro (20€/mois)`
- **Quota de livraisons**
  - Barre de progression : `15/20 livraisons ce mois`
  - Date de réinitialisation : `Réinitialise le 1er mars 2026`
- **Fonctionnalités du plan**
  - Liste des fonctionnalités disponibles
  - Comparaison avec l'autre plan (si Starter, montrer ce que Pro offre)
- **Bouton d'action**
  - Si Starter : `Passer à Pro` → Redirection Stripe
  - Si Pro : `Gérer mon abonnement` → Portail Stripe

#### Historique de Facturation *(Plan Pro uniquement)*
- Liste des factures (date, montant, statut)
- Télécharger les factures PDF
- Méthode de paiement actuelle
- Ajouter/Modifier la carte bancaire

#### Limites & Quotas
- **Livraisons ce mois** : 15/20 (Starter) ou Illimité (Pro)
- **Notifications SMS envoyées** : 0 (non disponible Starter) ou 45 (Pro)
- **Chauffeurs actifs** : 2/3 (Starter) ou Illimité (Pro)
- **Commandes en attente** : 8 (pas de limite mais info utile)

---

### 3. **Notifications** 🔔

#### Notifications Email
- **Recevoir des notifications par email**
  - Toggle général activé/désactivé
- **Types de notifications** (checkboxes) :
  - ✅ Nouvelle commande créée
  - ✅ Livraison complétée
  - ✅ Livraison échouée
  - ✅ Quota de livraisons presque atteint (80%)
  - ✅ Quota de livraisons atteint
  - ⬜ Rapport journalier des tournées
  - ⬜ Rapport hebdomadaire d'activité

#### Notifications SMS *(Plan Pro uniquement)*
- **Activer les notifications SMS** (toggle)
- **Numéro de téléphone** (éditable, validation format international)
- **Types de notifications SMS** :
  - ⬜ Livraison complétée (alerte immédiate)
  - ⬜ Livraison échouée (alerte immédiate)
  - ⬜ Résumé quotidien

#### Notifications aux Clients *(Tracking)*
- **Envoyer des SMS de suivi aux clients** *(Pro uniquement)*
  - Toggle activé/désactivé
  - Modèle de message personnalisable
  - Exemple : `Bonjour {customerName}, votre colis est en cours de livraison. Suivez-le ici: {trackingLink}`
- **Envoyer des emails de suivi** *(Si email client disponible)*
  - Toggle activé/désactivé
  - Template personnalisable

---

### 4. **Préférences de l'Application** ⚙️

#### Apparence
- **Thème** 
  - Clair / Sombre / Auto (selon système)
  - Prévisualisation en temps réel
- **Langue de l'interface** 
  - Français (par défaut)
  - Anglais *(Futur)*
  - Espagnol *(Futur)*

#### Régionalisation
- **Fuseau horaire**
  - Détection automatique ou sélection manuelle
  - Europe/Paris par défaut
- **Format de date**
  - DD/MM/YYYY (Français)
  - MM/DD/YYYY (US)
  - YYYY-MM-DD (ISO)
- **Format d'heure**
  - 24h (défaut)
  - 12h (AM/PM)
- **Devise**
  - € (Euro) - défaut
  - $ (Dollar)
  - £ (Livre)

#### Affichage
- **Nombre d'éléments par page** (tableaux)
  - 10 / 25 / 50 / 100
- **Afficher les commandes supprimées** (soft delete)
  - Toggle activé/désactivé
- **Vue par défaut au démarrage**
  - Dashboard
  - Commandes
  - Livraisons

---

### 5. **Paramètres de Livraison** 🚚

#### Valeurs par Défaut
- **Délai de livraison estimé (minutes)**
  - Input : 30 minutes (par défaut)
  - Utilisé pour les calculs d'ETA
- **Distance maximale pour une livraison (km)**
  - Input : 50 km (par défaut)
  - Alerte si dépassement lors de la création
- **Temps moyen entre deux livraisons (minutes)**
  - Input : 15 minutes
  - Pour l'optimisation des tournées

#### Géolocalisation
- **Fréquence de mise à jour GPS (secondes)**
  - 5 / 10 / 30 / 60 secondes
  - Plus fréquent = plus de données mais plus de batterie
- **Précision minimale requise (mètres)**
  - 10 / 50 / 100 mètres
- **Continuer à envoyer la position en arrière-plan** (PWA Driver)
  - Toggle activé/désactivé

#### Optimisation des Tournées
- **Optimisation automatique des itinéraires**
  - Toggle activé/désactivé
  - Utilise Google Maps Directions API
- **Algorithme d'optimisation**
  - Plus rapide (temps de trajet minimal)
  - Plus économique (distance minimale)
  - Équilibré

---

### 6. **Intégrations Tierces** 🔌

#### Google Maps API
- **Clé API Google Maps** *(Admin/Propriétaire uniquement)*
  - Input masqué avec bouton "Révéler"
  - Validation de la clé
  - Statut : ✅ Connecté / ❌ Non connecté
- **Services activés**
  - Géocodage (adresses → coordonnées)
  - Directions (calcul d'itinéraires)
  - Places (suggestions d'adresses)

#### Notifications SMS (Twilio/Vonage) *(Pro uniquement)*
- **Fournisseur SMS**
  - Twilio / Vonage (sélection)
- **Clé API** (input masqué)
- **Numéro d'expéditeur** (validation)
- **Statut** : ✅ Connecté / ❌ Non connecté
- **Tester l'intégration** (bouton)

#### Stripe (Facturation)
- **Compte Stripe**
  - Statut : ✅ Connecté
  - Email du compte Stripe
- **Portail client Stripe**
  - Bouton : `Gérer mon abonnement sur Stripe`

---

### 7. **Données & Export** 📊

#### Export de Données
- **Exporter toutes mes commandes**
  - Format : CSV / JSON / Excel
  - Filtres : Période, Statut
  - Bouton : `Télécharger`
- **Exporter toutes mes livraisons**
  - Format : CSV / JSON / Excel
  - Inclure les positions GPS (optionnel)
- **Exporter l'historique complet**
  - Toutes les données du tenant
  - Format ZIP avec plusieurs fichiers

#### Sauvegarde & Restauration
- **Sauvegarder mes données** *(Pro uniquement)*
  - Sauvegarde automatique quotidienne
  - Télécharger la dernière sauvegarde
- **Restaurer depuis une sauvegarde** *(Admin uniquement)*
  - Upload d'un fichier de sauvegarde
  - Prévisualisation des données avant import

#### Suppression des Données
- **Nettoyer les anciennes données**
  - Supprimer les commandes de plus de X mois
  - Supprimer les livraisons complétées de plus de X mois
  - Confirmation requise
- **Supprimer mon compte** ⚠️
  - Suppression définitive de toutes les données
  - Confirmation triple (email + mot de passe + texte)
  - Délai de 30 jours avant suppression effective

---

### 8. **Mode Hors Ligne & Démo** 🔌

#### Mode Hors Ligne (Offline)
- **Activer le mode hors ligne**
  - Toggle activé/désactivé
  - Affiche un banner en haut de l'app
  - Utilise les données mockées en local
- **Données en cache**
  - Taille du cache : 2.5 MB
  - Dernière synchronisation : Il y a 3 heures
  - Bouton : `Vider le cache`

#### Mode Démo
- **Mode démo actif**
  - Indicateur : 🎭 Mode Démo
  - Affiche le tenant ID de démo
  - Bouton : `Quitter le mode démo`
- **Réinitialiser les données de démo**
  - Recharge les données mockées par défaut
  - Bouton : `Réinitialiser`

---

### 9. **Équipe & Collaborateurs** 👥 *(Futur - Pro uniquement)*

#### Gestion des Utilisateurs
- **Propriétaire du compte**
  - Nom, Email (lecture seule)
- **Membres de l'équipe**
  - Liste des utilisateurs avec rôles
  - Ajouter un nouveau membre (email + rôle)
  - Rôles : Admin / Gestionnaire / Chauffeur / Lecture seule

#### Permissions
- **Gérer les permissions par rôle**
  - Admin : Tous droits
  - Gestionnaire : Créer/Modifier commandes et tournées
  - Chauffeur : Voir et compléter ses livraisons uniquement
  - Lecture seule : Consulter les données

---

### 10. **Avancé & Développement** 🛠️

#### Mode Développement *(Dev uniquement)*
- **Activer les logs détaillés**
  - Toggle pour afficher les logs API dans la console
- **Afficher les données de debug**
  - Bouton : `Copier le state actuel` (JSON)
  - Utile pour le support
- **Vider tous les caches**
  - localStorage, sessionStorage, IndexedDB
  - Bouton : `Tout vider`

#### Webhook & API *(Pro uniquement - Futur)*
- **Clé API**
  - Générer une clé API pour intégrations externes
  - Masquée avec bouton "Révéler"
  - Bouton : `Régénérer`
- **Webhooks**
  - Liste des webhooks configurés (URL, événements)
  - Ajouter un webhook
  - Tester un webhook

#### Réinitialisation
- **Réinitialiser tous les paramètres**
  - Retour aux valeurs par défaut
  - Confirmation requise

---

## 🎨 Design & UX

### Composants Recommandés (shadcn-svelte)
- `Card` avec `CardHeader`, `CardContent` pour chaque section
- `Tabs` pour la navigation entre sections
- `Switch` pour les toggles
- `Input` pour les champs de texte
- `Select` pour les listes déroulantes
- `Button` pour les actions
- `Alert` pour les avertissements (quotas, suppressions)
- `Badge` pour le statut du plan
- `Progress` pour les barres de quota
- `Separator` entre les sous-sections
- `Dialog` pour les confirmations critiques

### Layout
- Sidebar gauche avec la liste des sections (navigation rapide)
- Contenu principal à droite avec scroll indépendant
- Sticky header avec titre "Paramètres"
- Boutons d'action en bas de chaque section (Enregistrer, Annuler)

### Indicateurs Visuels
- 🟢 Connecté / Actif
- 🔴 Déconnecté / Inactif
- 🟡 En attente / Configuration requise
- Badge `PRO` à côté des fonctionnalités payantes
- Badge `BIENTÔT` pour les fonctionnalités futures

---

## 📋 Checklist d'Implémentation

### Phase 1 : Essentiels (MVP)
- [ ] Section Compte & Profil (lecture seule + édition nom/email)
- [ ] Section Abonnement (affichage plan + quota)
- [ ] Section Apparence (thème clair/sombre)
- [ ] Section Notifications (toggles email)
- [ ] Layout de base avec Tabs

### Phase 2 : Fonctionnalités Pro
- [ ] Section Facturation (intégration Stripe)
- [ ] Notifications SMS (toggle + configuration)
- [ ] Changement de mot de passe
- [ ] Export CSV des commandes et livraisons

### Phase 3 : Avancé
- [ ] Gestion des sessions actives
- [ ] Intégrations tierces (Google Maps, Twilio)
- [ ] Webhooks et API
- [ ] Gestion d'équipe et permissions
- [ ] 2FA

---

## 🔐 Sécurité

- **Validation côté serveur** pour tous les changements sensibles (email, mot de passe, API keys)
- **Confirmation par email** pour changement d'email
- **Re-authentification** pour actions critiques (changement mot de passe, suppression compte)
- **Rate limiting** sur les endpoints de modification
- **Masquage des données sensibles** (API keys, tokens)

---

## 🧪 Tests Recommandés

- Test E2E : Édition du profil
- Test E2E : Changement de thème (persistance)
- Test E2E : Affichage correct du quota selon le plan
- Test unitaire : Validation des formats (email, téléphone)
- Test d'intégration : Appel API Stripe pour changement de plan

---

## 📝 Notes Techniques

### Store Svelte 5
Créer un nouveau store `settings.svelte.ts` :
```typescript
export type UserSettings = {
  notifications: {
    email: boolean;
    sms: boolean;
    types: string[];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
  };
  delivery: {
    defaultEta: number;
    maxDistance: number;
    gpsFrequency: number;
  };
};
```

### API Backend (.NET 9)
Endpoints à créer :
- `GET /api/settings` : Récupère les settings du tenant
- `PUT /api/settings` : Met à jour les settings
- `PUT /api/settings/profile` : Met à jour le profil utilisateur
- `POST /api/settings/password` : Change le mot de passe
- `GET /api/settings/quotas` : Récupère les quotas actuels

### Persistance
- Settings généraux : Base de données (table `TenantSettings`)
- Préférences UI (thème) : localStorage (comme actuellement)
- Settings sensibles (API keys) : Chiffrés en base

---

## 🚀 Proposition de Priorités

**Je te suggère de commencer par :**

1. **Section Compte & Profil** (affichage + édition basique)
2. **Section Abonnement** (affichage plan + quota avec barre de progression)
3. **Section Apparence** (intégration du thème existant)
4. **Section Notifications** (toggles email simples)

Ça te donne une base fonctionnelle et utile rapidement, et tu peux itérer ensuite sur les sections plus avancées selon tes besoins.

---

**Dis-moi quelles sections/options tu veux garder, retirer ou modifier ! 🎯**