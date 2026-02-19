# 🗄️ Résolution Problème Migrations Testing

## Problème
Les migrations ne s'appliquent pas automatiquement sur l'environnement testing, même avec une base copiée de prod.

## Cause
La table `__EFMigrationsHistory` n'est pas à jour ou manquante dans la copie.

## ✅ Solutions

### Solution 1 : Reset complet de la base (RECOMMANDÉ)

Dans Railway Console (environnement testing) :

```sql
-- 1. Supprimer tout
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO railway;

-- 2. Redéployer le backend
-- Railway Dashboard → Deploy → Redeploy
```

Le backend recréera automatiquement toutes les tables avec les migrations.

---

### Solution 2 : Forcer les migrations via CLI

Si tu as accès à la CLI Railway :

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Sélectionner le projet testing
railway link

# Exécuter les migrations
railway run -- dotnet ef database update
```

---

### Solution 3 : Endpoint temporaire de migration

Ajouter temporairement dans `Program.cs` :

```csharp
// Endpoint temporaire pour forcer les migrations (TESTING UNIQUEMENT)
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapPost("/admin/migrate", async (TracklyDbContext db) => {
        await db.Database.MigrateAsync();
        return Results.Ok("Migrations applied");
    });
}
```

Puis appeler :
```bash
curl -X POST https://backend-testing-xxx.up.railway.app/admin/migrate
```

---

### Solution 4 : Modifier le Dockerfile pour forcer les migrations

Dans `backend/Dockerfile`, ajouter une étape :

```dockerfile
# Au lieu de juste RUN dotnet publish...
# Ajouter une commande de migration au startup

ENTRYPOINT ["sh", "-c", "dotnet ef database update --no-build || true && dotnet Trackly.API.dll"]
```

⚠️ Nécessite EF Core CLI dans l'image.

---

## 🔧 Recommandation immédiate

**Solution 1 (Reset)** est la plus rapide :

1. Va sur Railway Dashboard → Testing → PostgreSQL
2. Onglet "Query" 
3. Exécuter :
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
4. Redéployer le service backend
5. ✅ Les migrations s'exécuteront automatiquement

---

## 📝 Pour éviter ça à l'avenir

Dans le workflow GitHub Actions, ajouter une étape :

```yaml
- name: Verify Database Migrations
  run: |
    # Attendre que le déploiement soit prêt
    sleep 30
    # Vérifier que /health répond
    curl -f https://${{ secrets.RAILWAY_TESTING_URL }}/health || exit 1
```

---

*Problème rencontré le 14 février 2026*
