# Application de la migration AddDeletedAtToDelivery

## Base de données cible
Les migrations s'appliquent à la base de données spécifiée dans `appsettings.Development.json` :
- **Base de données** : `trackly_dev`
- **Host** : `localhost:5432`
- **Utilisateur** : `trackly`

## Étapes pour appliquer la migration

1. **Arrêter le backend** (processus en cours d'exécution)

2. **Créer la migration** (si elle n'existe pas) :
   ```powershell
   cd backend
   dotnet ef migrations add AddDeletedAtToDelivery
   ```

3. **Appliquer la migration** :
   ```powershell
   dotnet ef database update
   ```

4. **Redémarrer le backend**

## Alternative : Application manuelle en SQL

Si vous ne pouvez pas arrêter le backend, exécutez directement en SQL :

```sql
ALTER TABLE "Deliveries" 
ADD COLUMN "DeletedAt" timestamp with time zone NULL;
```
