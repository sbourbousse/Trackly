# Correction migration OrderDate

La migration `AddOrderDateToOrder` a été enregistrée comme appliquée alors qu’elle était vide, donc la colonne `OrderDate` n’existe pas en base et l’app renvoie : **column o.OrderDate does not exist**.

## Solution : réappliquer la migration

1. **Exécuter le SQL sur ta base** (psql, DBeaver, Railway SQL, etc.) :

   Fichier : `Migrations/fix-orderdate-migration.sql`

   ```sql
   DELETE FROM "__EFMigrationsHistory"
   WHERE "MigrationId" = '20260131000531_AddOrderDateToOrder';
   ```

   Avec psql (depuis le dossier backend, en utilisant ta connexion) :

   ```powershell
   $env:PGPASSWORD="mSPrvRKxVqxPpUmjtTCbkEzJctWuQXCG"; psql -h nozomi.proxy.rlwy.net -U postgres -p 39656 -d railway -f Migrations/fix-orderdate-migration.sql
   ```

2. **Réappliquer les migrations** :

   ```powershell
   cd backend
   dotnet ef database update
   ```

   Cela exécutera le `Up()` de `AddOrderDateToOrder` et créera la colonne `OrderDate`.

## Alternative : ajouter la colonne à la main

Si tu préfères ne pas toucher à l’historique des migrations, exécute directement :

```sql
ALTER TABLE "Orders" ADD COLUMN "OrderDate" timestamp with time zone NULL;
```

Ensuite, redémarre l’application (aucun `dotnet ef database update` nécessaire).
