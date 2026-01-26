# Utilisation de MkDocs depuis VS Code

## 🚀 Lancement Rapide

### Option 1 : Depuis le menu Debug (F5)

1. Appuyez sur **F5** ou allez dans **Run > Start Debugging**
2. Sélectionnez **"Launch MkDocs Server"**
3. La documentation s'ouvrira automatiquement dans Chrome sur `http://127.0.0.1:8000`

### Option 2 : Depuis les Tâches (Ctrl+Shift+P)

1. Appuyez sur **Ctrl+Shift+P**
2. Tapez **"Tasks: Run Task"**
3. Sélectionnez **"Serve MkDocs"**

## 📋 Tâches Disponibles

| Tâche | Description | Commande |
|-------|-------------|----------|
| **Setup MkDocs** | Installe les dépendances Python (première fois) | `Ctrl+Shift+P` > "Tasks: Run Task" > "Setup MkDocs" |
| **Serve MkDocs** | Lance le serveur de documentation | `Ctrl+Shift+P` > "Tasks: Run Task" > "Serve MkDocs" |
| **Build MkDocs** | Génère la documentation statique | `Ctrl+Shift+P` > "Tasks: Run Task" > "Build MkDocs" |

## 🔧 Configuration

Les configurations sont dans :
- **Tâches** : `.vscode/tasks.json`
- **Debug** : `.vscode/launch.json`

### Configuration Launch

```json
{
  "name": "Launch MkDocs Server",
  "type": "chrome",
  "request": "launch",
  "preLaunchTask": "Serve MkDocs",
  "url": "http://127.0.0.1:8000"
}
```

### Tâches Disponibles

- **Setup MkDocs** : Crée l'environnement virtuel et installe les dépendances
- **Serve MkDocs** : Lance le serveur avec rechargement automatique
- **Build MkDocs** : Génère les fichiers HTML statiques dans `site/`

## 🎯 Workflow Recommandé

### Première Utilisation

1. Lancez **"Setup MkDocs"** une seule fois pour installer les dépendances
2. Utilisez **"Launch MkDocs Server"** (F5) pour démarrer la documentation

### Utilisation Quotidienne

1. Appuyez sur **F5** et sélectionnez **"Launch MkDocs Server"**
2. La documentation se rechargera automatiquement lors des modifications

## 🐛 Dépannage

### "Python n'est pas trouvé"

Assurez-vous que Python est dans votre PATH :
```powershell
python --version
```

### "mkdocs: command not found"

Lancez d'abord la tâche **"Setup MkDocs"** pour installer les dépendances.

### Le serveur ne démarre pas

Vérifiez que le port 8000 n'est pas déjà utilisé :
```powershell
netstat -ano | findstr :8000
```

### Erreur d'exécution de script PowerShell

Exécutez dans PowerShell (en tant qu'administrateur) :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Notes

- Le serveur MkDocs tourne en arrière-plan et se recharge automatiquement
- Les modifications dans `docs/` sont détectées automatiquement
- Pour arrêter le serveur, utilisez le bouton "Stop" dans le panneau Terminal
