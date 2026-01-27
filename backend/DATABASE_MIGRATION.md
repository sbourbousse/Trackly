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

## Notes

- La configuration utilise `SslMode=Require` car Railway nécessite SSL
- En production sur Railway, la variable d'environnement `DATABASE_URL` est utilisée en priorité (voir `Program.cs`)
- Les fichiers archivés peuvent être supprimés une fois que vous êtes sûr que tout fonctionne correctement
