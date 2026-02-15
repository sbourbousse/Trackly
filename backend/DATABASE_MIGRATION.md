# Migration de la base de données

## Date : 27 janvier 2026

## Ancienne configuration (archivée)

### Local (appsettings.Development.json.archive)
- **Host**: localhost
- **Port**: 5432
- **Database**: trackly_dev
- **Username**: trackly
- **Password**: admin

### Production (appsettings.json.archive)
- **Host**: localhost
- **Port**: 5432
- **Database**: trackly
- **Username**: trackly
- **Password**: admin

## Nouvelle configuration (Railway)

### Connexion actuelle
- **Host**: nozomi.proxy.rlwy.net
- **Port**: 39656
- **Database**: railway
- **Username**: postgres
- **Password**: mSPrvRKxVqxPpUmjtTCbkEzJctWuQXCG
- **SSL**: Requis (SslMode=Require)

### Fichiers modifiés
- `appsettings.json` - Configuration par défaut
- `appsettings.Development.json` - Configuration de développement

### Fichiers archivés
- `appsettings.json.archive` - Ancienne configuration par défaut
- `appsettings.Development.json.archive` - Ancienne configuration de développement

## Connexion manuelle

Pour vous connecter manuellement à la base de données :

```bash
PGPASSWORD=mSPrvRKxVqxPpUmjtTCbkEzJctWuQXCG psql -h nozomi.proxy.rlwy.net -U postgres -p 39656 -d railway
```

## Si les colonnes siège (Headquarters*) manquent sur crossover

Si `dotnet ef database update` affiche « déjà à jour » mais au run l’app plante avec `column t.HeadquartersAddress does not exist`, la migration a été enregistrée dans l’historique sans que le schéma ait été appliqué sur cette base.

**Option A – Rejouer la migration (recommandé)**  
1. Sur la base **crossover** (Railway ou client SQL), exécuter :  
   `Scripts/remove_headquarters_migration_entry.sql`  
   (supprime l’entrée de la migration dans `__EFMigrationsHistory`).  
2. Dans le terminal (sans `DATABASE_URL` pour utiliser appsettings) :  
   `$env:DATABASE_URL = $null; dotnet ef database update`  
   La migration sera réappliquée et les colonnes créées.

**Option B – Ajouter les colonnes à la main**  
Exécuter sur la base crossover :  
`Scripts/add_headquarters_columns.sql`

## Index des migrations

La liste des migrations (ordre d’application, MigrationId) est dans **`Migrations/MIGRATIONS_INDEX.md`**.  
À comparer avec `SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";` sur chaque base pour voir ce qui manque.

- Il n’y a **pas de fichier “version” à mettre à jour** : la table `__EFMigrationsHistory` dans chaque base est la seule source de vérité pour “quelles migrations sont appliquées”.
- La colonne `ProductVersion` dans cette table = version du runtime EF Core (ex. 9.0.2) au moment de l’application ; elle peut différer d’une ligne à l’autre, ce n’est pas un numéro de schéma.

## Notes

- La configuration utilise `SslMode=Require` car Railway nécessite SSL
- En production sur Railway, la variable d'environnement `DATABASE_URL` est utilisée en priorité (voir `Program.cs`)
- Les fichiers archivés peuvent être supprimés une fois que vous êtes sûr que tout fonctionne correctement
- Diagnostic des variables de connexion : `.\Scripts\check-db-config.ps1`
