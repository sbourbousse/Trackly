# Feature: Page Settings - Compte & Profil

## Description
Créer une page Settings avec la section Compte & Profil pour gérer les informations utilisateur.

## Fichiers concernés
- `frontend-business/src/routes/settings/+page.svelte` (nouveau)
- `frontend-business/src/routes/settings/+layout.svelte` (nouveau)
- `frontend-business/src/lib/components/settings/ProfileSection.svelte` (nouveau)
- `frontend-business/src/lib/components/settings/SecuritySection.svelte` (nouveau)
- `frontend-business/src/lib/api/users.ts` (nouveau)

## Implémentation
- [ ] Créer la route `/settings`
- [ ] Créer le layout avec sidebar/onglets
- [ ] Section Compte & Profil :
  - [ ] Nom complet (éditable)
  - [ ] Email (éditable avec validation)
  - [ ] Nom de l'entreprise (éditable)
  - [ ] Tenant ID (lecture seule avec copie)
  - [ ] Date de création du compte (lecture seule)
- [ ] Section Sécurité :
  - [ ] Formulaire changement de mot de passe
  - [ ] Validation force mot de passe

## Structure de la page
```
/settings
├── Compte & Profil (actif par défaut)
├── Sécurité
├── Abonnement & Facturation (futur)
├── Notifications (futur)
└── Préférences (futur)
```

## Source
Voir `docs/features-user-redacted/feature-settings.md`
