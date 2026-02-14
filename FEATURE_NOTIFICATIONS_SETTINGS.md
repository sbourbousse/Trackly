# Feature: Paramètres de Notifications

## Description
Ajouter une section Notifications dans la page Settings pour gérer les préférences de notification.

## Fichiers concernés
- `frontend-business/src/routes/settings/+page.svelte`
- `frontend-business/src/lib/components/settings/NotificationsSection.svelte` (nouveau)
- `frontend-business/src/lib/stores/notifications.svelte.ts` (nouveau)

## Implémentation
- [ ] Section Notifications Email :
  - [ ] Toggle général activer/désactiver
  - [ ] Checkbox : Nouvelle commande créée
  - [ ] Checkbox : Livraison complétée
  - [ ] Checkbox : Livraison échouée
  - [ ] Checkbox : Quota presque atteint (80%)
  - [ ] Checkbox : Quota atteint
- [ ] Section Notifications aux Clients (Tracking) :
  - [ ] Toggle envoyer SMS de suivi
  - [ ] Modèle de message personnalisable
  - [ ] Toggle envoyer emails de suivi
- [ ] Persistance dans localStorage
- [ ] Sauvegarde des préférences utilisateur

## Structure
```
/settings/notifications
├── Notifications Email
│   ├── Toggle général
│   └── Checkboxes par type
├── Notifications SMS (Pro uniquement)
│   └── ...
└── Notifications aux Clients
    └── ...
```

## Source
Voir `docs/features-user-redacted/feature-settings.md`
