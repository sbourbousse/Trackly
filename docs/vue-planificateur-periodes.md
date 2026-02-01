# Vue planificateur et périodes

## Contexte

Le graphique « Commandes par jour/heure/mois » et le filtre de dates sont une partie essentielle du site pour le **planificateur de commandes** : ils permettent au gérant de petite entreprise de voir la répartition des commandes par statut et par période, afin de planifier les tournées.

## Implémentation actuelle

- **DateFilterCard** : sélecteur de plage (calendrier, raccourcis : 7 derniers jours, etc.), filtre « Date commande » / « Date création », plage horaire pour un jour unique.
- **OrdersChartContent** : bar chart empilé par statut ; barres en **flex-grow** avec **min-width** et **scroll horizontal** ; **tooltips évolutifs** avec date relative (Aujourd’hui, Hier, Il y a 2 jours) et date absolue en secondaire.
- **Utilitaires** : `frontend-business/src/lib/utils/relativeDate.ts` pour les libellés relatifs et le format absolu (prévu pour un éventuel switch absolu/relatif dans les préférences).

## Évolution prévue : périodes intelligentes personnalisées

À mettre en place plus tard :

- **Configurations de période personnalisées** : ex. « Semaine type », « Période de forte activité », plages nommées réutilisables.
- **Présets métier** : ex. « Lundi–Vendredi », « Jours ouvrés du mois », alignés sur le contexte du gérant.
- **Préférence d’affichage des tooltips** : switch « Date relative » / « Date absolue » (les données et la structure sont déjà prêtes dans `relativeDate.ts` et le tooltip).

En attendant, l’UI reste simple pour un gérant de TPE : titre du graphique, description courte optionnelle (`chartDescription`), tooltips avec relatif + absolu.
