# Fichiers CSV d'exemple pour l'import

Ces fichiers CSV peuvent être utilisés pour tester la fonctionnalité d'import de commandes.

## Fichiers disponibles

### `sample-orders.csv`
Format simple avec colonnes `Client` et `Adresse`, séparateur virgule.

### `sample-orders-alt.csv`
Format alternatif avec colonnes `Customer Name` et `Address`, séparateur point-virgule.

### `sample-orders-fr.csv`
Format français avec colonnes `Nom du client` et `Adresse complète`, séparateur virgule.

## Format attendu

Le parser détecte automatiquement :
- **Séparateur** : virgule (`,`) ou point-virgule (`;`)
- **Colonnes client** : `client`, `customer`, `nom`, `name` (insensible à la casse, accents ignorés)
- **Colonnes adresse** : `adresse`, `address`, `adr` (insensible à la casse, accents ignorés)
- **Colonnes téléphone** (optionnel) : `telephone`, `phone`, `tel`, `mobile` (insensible à la casse, accents ignorés)
- **Colonnes commentaire** (optionnel) : `commentaire`, `comment`, `note`, `remarque` (insensible à la casse, accents ignorés)

## Utilisation

1. Allez sur la page `/orders/import`
2. Glissez-déposez un de ces fichiers CSV ou cliquez pour sélectionner
3. Vérifiez l'aperçu des données
4. Cliquez sur "Importer" pour créer les commandes

## Exemple de format minimal

```csv
Client,Adresse
Nom Client 1,Adresse 1
Nom Client 2,Adresse 2
```

## Exemple avec tous les champs

```csv
Client,Adresse,Téléphone,Commentaire
Nom Client 1,123 Rue Exemple,+33 6 12 34 56 78,Client VIP
Nom Client 2,456 Avenue Test,+33 6 98 76 54 32,Livraison fragile
```

Les autres colonnes sont ignorées mais conservées pour l'affichage.
