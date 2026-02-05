# Configuration CORS pour la Production

## Vue d'ensemble

En production, le backend doit autoriser explicitement les domaines des applications frontend via la configuration CORS.

## Configuration Railway

### Variables d'environnement

Dans le dashboard Railway de votre service backend, ajoutez ces variables :

```bash
# Domaine principal de l'app cliente (tracking)
Cors__AllowedOrigins__0=https://trackly.app

# Domaine de l'app business
Cors__AllowedOrigins__1=https://app.trackly.app

# Domaine de l'app driver
Cors__AllowedOrigins__2=https://driver.trackly.app

# Domaine de la landing page
Cors__AllowedOrigins__3=https://www.trackly.app
```

### Syntaxe

La syntaxe `Cors__AllowedOrigins__0` est la convention .NET pour les variables d'environnement :

- `Cors` → Section de configuration
- `AllowedOrigins` → Propriété (tableau)
- `__0`, `__1`, etc. → Index du tableau

### Exemple complet

Pour Railway, dans le dashboard du service backend :

| Variable | Valeur |
|----------|--------|
| `Cors__AllowedOrigins__0` | `https://trackly.app` |
| `Cors__AllowedOrigins__1` | `https://app.trackly.app` |
| `Cors__AllowedOrigins__2` | `https://driver.trackly.app` |
| `Cors__AllowedOrigins__3` | `https://www.trackly.app` |

## Configuration appsettings.json (alternative)

Si vous déployez avec un fichier de configuration, vous pouvez aussi utiliser `appsettings.Production.json` :

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://trackly.app",
      "https://app.trackly.app",
      "https://driver.trackly.app",
      "https://www.trackly.app"
    ]
  }
}
```

## Code backend (Program.cs)

Le code backend est déjà configuré pour lire ces variables :

```csharp
if (builder.Environment.IsDevelopment())
{
    // En développement : origines localhost
    policy.WithOrigins(
        "http://localhost:5173",
        "http://localhost:3004",
        // ...
    )
}
else
{
    // En production : origines depuis la configuration
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? Array.Empty<string>();
    
    policy.WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
}
```

## Vérification

### Test CORS en production

```bash
# Remplacer par votre domaine
curl -X OPTIONS https://api.trackly.app/api/public/deliveries/test \
  -H "Origin: https://trackly.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Vous devriez voir dans la réponse :
```
Access-Control-Allow-Origin: https://trackly.app
Access-Control-Allow-Methods: GET, POST, ...
```

### Debug en cas de problème

1. **Vérifier les variables dans Railway** :
   - Allez dans le service backend
   - Onglet "Variables"
   - Vérifiez que `Cors__AllowedOrigins__0` etc. sont présentes

2. **Vérifier les logs du backend** :
   ```bash
   railway logs
   ```
   
   Recherchez les erreurs CORS.

3. **Tester depuis le navigateur** :
   - Ouvrir la console (F12)
   - Aller sur votre app (ex: https://trackly.app)
   - Regarder les erreurs CORS dans la console

## Domaines recommandés

### Production complète

| Application | Domaine suggéré |
|-------------|----------------|
| Backend API | `api.trackly.app` |
| Frontend Tracking (client) | `trackly.app` ou `track.trackly.app` |
| Frontend Business | `app.trackly.app` |
| Frontend Driver | `driver.trackly.app` |
| Landing Page | `www.trackly.app` |

### Configuration CORS correspondante

```bash
Cors__AllowedOrigins__0=https://trackly.app
Cors__AllowedOrigins__1=https://track.trackly.app
Cors__AllowedOrigins__2=https://app.trackly.app
Cors__AllowedOrigins__3=https://driver.trackly.app
Cors__AllowedOrigins__4=https://www.trackly.app
```

## Sécurité

### ⚠️ Ne JAMAIS faire en production

```csharp
// ❌ DANGEREUX : N'autorisez JAMAIS toutes les origines
policy.AllowAnyOrigin()
```

### ✅ Bonnes pratiques

1. **Lister explicitement** les domaines autorisés
2. **Utiliser HTTPS** uniquement en production
3. **Éviter les wildcards** (ex: `*.trackly.app`)
4. **Tester** après chaque déploiement

## Déploiement

### Railway - Order of operations

1. **Déployer le backend** avec les variables CORS configurées
2. **Attendre** que le backend soit en ligne
3. **Déployer les frontends** avec les bonnes URLs d'API
4. **Tester** les CORS depuis chaque frontend

### Variables d'environnement frontend

N'oubliez pas de configurer l'URL de l'API dans chaque frontend :

**Frontend Tracking** :
```bash
NEXT_PUBLIC_API_URL=https://api.trackly.app
```

**Frontend Business** :
```bash
VITE_API_URL=https://api.trackly.app
```

**Frontend Driver** :
```bash
VITE_API_URL=https://api.trackly.app
```

## Troubleshooting

### Erreur : "No 'Access-Control-Allow-Origin' header"

**Cause** : Le domaine du frontend n'est pas dans la liste CORS.

**Solution** : Ajouter le domaine dans Railway :
```bash
Cors__AllowedOrigins__X=https://votre-domaine.com
```

### Erreur : "Preflight request doesn't pass"

**Cause** : OPTIONS request échoue.

**Solution** : Vérifier que `.AllowAnyMethod()` est bien présent dans la config CORS.

### Erreur : Credentials mode error

**Cause** : Le frontend envoie des credentials mais CORS n'autorise pas.

**Solution** : Vérifier que `.AllowCredentials()` est présent côté backend.

## Références

- [Documentation ASP.NET CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors)
- [Railway Environment Variables](https://docs.railway.app/deploy/variables)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
