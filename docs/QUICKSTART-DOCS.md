# Guide Rapide - Documentation MkDocs

## 🚀 Démarrage en 3 étapes

### 1. Installer les dépendances (une seule fois)

```powershell
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
.\venv\Scripts\Activate.ps1

# Installer MkDocs et plugins
pip install -r requirements-docs.txt
```

### 2. Lancer le serveur de documentation

```powershell
# Option 1 : Utiliser le script (recommandé)
.\scripts\build-docs.ps1 serve

# Option 2 : Commande directe
mkdocs serve
```

### 3. Ouvrir dans le navigateur

La documentation sera accessible sur : **http://127.0.0.1:8000**

## 📝 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `.\scripts\build-docs.ps1 serve` | Serveur de développement avec rechargement auto |
| `.\scripts\build-docs.ps1 build` | Générer la documentation statique |
| `.\scripts\build-docs.ps1 deploy` | Déployer sur GitHub Pages |

## ✨ Fonctionnalités

- ✅ **Thème Material** : Interface moderne et responsive
- ✅ **Diagrammes Mermaid** : Rendu automatique des diagrammes
- ✅ **Recherche** : Recherche full-text intégrée
- ✅ **Mode sombre** : Basculement automatique
- ✅ **Navigation** : Menu latéral avec onglets

## 🔧 Personnalisation

Modifiez `mkdocs.yml` pour :
- Changer les couleurs du thème
- Ajouter des plugins
- Modifier la structure de navigation
- Configurer le déploiement

## 📚 Structure

```
docs/
  ├── index.md              # Page d'accueil
  ├── metier/               # Documentation métier
  │   ├── README.md
  │   ├── modele-donnees.md
  │   ├── relations-entites.md
  │   └── ...
  ├── architecture-map.md   # Documentation technique
  └── ...
```

## 🐛 Problèmes Courants

### "mkdocs: command not found"
→ Activez l'environnement virtuel : `.\venv\Scripts\Activate.ps1`

### "Cannot activate virtual environment"
→ Exécutez : `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Les diagrammes Mermaid ne s'affichent pas
→ Vérifiez que `mkdocs-mermaid2-plugin` est installé : `pip install mkdocs-mermaid2-plugin`
