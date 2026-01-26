# Scripts PowerShell pour Trackly

Scripts utilitaires pour gérer les ports et processus du projet Trackly.

## Scripts disponibles

### `kill-ports-all.ps1`
**Usage:** `.\scripts\kill-ports-all.ps1`

Libère automatiquement tous les ports utilisés par Trackly sans confirmation :
- Port 5257 (Backend HTTP)
- Port 7114 (Backend HTTPS)
- Port 5173 (Frontend Vite)

### `kill-ports.ps1`
**Usage:** `.\scripts\kill-ports.ps1`

Version interactive qui demande confirmation avant de tuer chaque processus.

### `kill-backend.ps1`
**Usage:** `.\scripts\kill-backend.ps1`

Libère uniquement les ports du backend .NET (5257, 7114).

### `kill-frontend.ps1`
**Usage:** `.\scripts\kill-frontend.ps1`

Libère uniquement le port du frontend Vite (5173).

### `check-ports.ps1`
**Usage:** `.\scripts\check-ports.ps1`

Affiche l'état de tous les ports utilisés par Trackly sans rien modifier.

## Utilisation depuis VSCode

### Option 1 : Terminal intégré
Ouvrez un terminal PowerShell dans VSCode et exécutez :
```powershell
.\scripts\kill-ports-all.ps1
```

### Option 2 : Tâches VSCode
Ajoutez dans `.vscode/tasks.json` :
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Kill Trackly Ports",
      "type": "shell",
      "command": "powershell",
      "args": ["-ExecutionPolicy", "Bypass", "-File", "${workspaceFolder}/scripts/kill-ports-all.ps1"],
      "problemMatcher": []
    }
  ]
}
```

Puis utilisez `Ctrl+Shift+P` > "Tasks: Run Task" > "Kill Trackly Ports"

### Option 3 : Raccourci clavier
Ajoutez dans `.vscode/keybindings.json` :
```json
[
  {
    "key": "ctrl+shift+k",
    "command": "workbench.action.tasks.runTask",
    "args": "Kill Trackly Ports"
  }
]
```

## Scripts de Documentation

### `build-docs.ps1`
**Usage:** `.\scripts\build-docs.ps1 [serve|build|deploy]`

Génère la documentation MkDocs :
- `serve` : Démarre le serveur de développement (port 8000)
- `build` : Construit la documentation statique dans `site/`
- `deploy` : Déploie sur GitHub Pages

**Prérequis** : Python 3.8+ et dépendances installées (`pip install -r requirements-docs.txt`)

## Ports utilisés

| Port | Service | Description |
|------|---------|-------------|
| 5257 | Backend HTTP | API .NET en mode développement |
| 7114 | Backend HTTPS | API .NET en mode HTTPS |
| 5173 | Frontend Vite | Serveur de développement SvelteKit |
| 8000 | MkDocs | Serveur de documentation |
| 5432 | PostgreSQL | Base de données (non tué par les scripts) |

## Notes

- Les scripts nécessitent des droits administrateur si les processus sont lancés en tant qu'admin
- Le port PostgreSQL (5432) n'est pas tué automatiquement pour éviter d'arrêter la base de données
- Utilisez `check-ports.ps1` pour diagnostiquer les problèmes de ports
