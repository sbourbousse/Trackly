# Génération de la Documentation

Cette documentation est générée avec **MkDocs Material** et supporte les diagrammes **Mermaid**.

## Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

## Installation

### 1. Installer les dépendances

```powershell
# Créer l'environnement virtuel (première fois)
python -m venv venv

# Activer l'environnement virtuel
.\venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r requirements-docs.txt
```

### 2. Utiliser le script PowerShell (recommandé)

```powershell
# Démarrer le serveur de développement (avec rechargement automatique)
.\scripts\build-docs.ps1 serve

# Construire la documentation statique
.\scripts\build-docs.ps1 build

# Déployer sur GitHub Pages
.\scripts\build-docs.ps1 deploy
```

## Commandes Manuelles

### Démarrer le serveur de développement

```powershell
mkdocs serve
```

Ouvre la documentation sur `http://127.0.0.1:8000` avec rechargement automatique lors des modifications.

### Construire la documentation statique

```powershell
mkdocs build
```

Génère les fichiers HTML dans le dossier `site/`.

### Déployer sur GitHub Pages

```powershell
mkdocs gh-deploy
```

Déploie automatiquement la documentation sur GitHub Pages (nécessite la configuration du repo dans `mkdocs.yml`).

## Structure

- `mkdocs.yml` : Configuration MkDocs
- `docs/` : Fichiers sources Markdown
- `site/` : Documentation générée (ignoré par Git)
- `requirements-docs.txt` : Dépendances Python

## Fonctionnalités

- ✅ **Thème Material** : Interface moderne et responsive
- ✅ **Support Mermaid** : Diagrammes rendus automatiquement
- ✅ **Recherche** : Recherche full-text intégrée
- ✅ **Navigation** : Menu latéral avec onglets
- ✅ **Mode sombre** : Basculement automatique
- ✅ **Code highlighting** : Coloration syntaxique

## Personnalisation

Modifiez `mkdocs.yml` pour :
- Changer le thème
- Ajouter des plugins
- Modifier la navigation
- Configurer les couleurs

## Troubleshooting

### Erreur "mkdocs: command not found"

Assurez-vous d'avoir activé l'environnement virtuel :
```powershell
.\venv\Scripts\Activate.ps1
```

### Les diagrammes Mermaid ne s'affichent pas

Vérifiez que le plugin `mermaid2` est installé :
```powershell
pip install mkdocs-mermaid2-plugin
```

### Erreur de permissions PowerShell

Si vous obtenez une erreur d'exécution de script, exécutez :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
