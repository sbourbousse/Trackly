# Application des migrations

## Base de données
- **Locale** : `appsettings.Development.json` ou variable `ConnectionStrings__TracklyDb`
- **Railway** : variable d'environnement `DATABASE_URL`

## Appliquer toutes les migrations

1. Arrêter le backend.
2. À la racine du projet backend :
   ```powershell
   dotnet ef database update
   ```
3. Redémarrer le backend.

## Si la colonne "InternalComment" (ou "PhoneNumber") manque sur "Orders"

Si `dotnet ef database update` indique « déjà à jour » mais que l’app échoue avec *column "InternalComment" of relation "Orders" does not exist*, la migration a été enregistrée sans que les colonnes aient été créées (ex. base Railway). Exécuter le script SQL suivant sur la base :

**Fichier** : `Migrations/Manual_AddPhoneAndCommentToOrder.sql`

```sql
ALTER TABLE "Orders"
ADD COLUMN IF NOT EXISTS "PhoneNumber" text NULL;

ALTER TABLE "Orders"
ADD COLUMN IF NOT EXISTS "InternalComment" text NULL;
```

- **Railway** : Dashboard → votre base → onglet Query → coller le SQL → Run.
- **psql** : `psql "<DATABASE_URL>" -f Migrations/Manual_AddPhoneAndCommentToOrder.sql`
- **pgAdmin / autre client** : ouvrir le fichier et exécuter.

## Référence : migration AddDeletedAtToDelivery (manuel)

Si besoin d’appliquer manuellement la colonne `DeletedAt` sur `Deliveries` :

```sql
ALTER TABLE "Deliveries" 
ADD COLUMN "DeletedAt" timestamp with time zone NULL;
```
