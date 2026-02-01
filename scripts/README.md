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

---

## Scripts de Synchronisation TODO → GitHub

### `sync-todo-to-github.py`
**Usage:** `python3 scripts/sync-todo-to-github.py`

Parse le fichier `todo.md` et extrait toutes les tâches non cochées.

**Sortie:**
- Résumé des tâches trouvées dans la console
- `scripts/todo-tasks.json` - Fichier JSON avec tous les détails des tâches

**Fonctionnalités:**
- Extrait les tâches avec cases à cocher `- [ ]`
- Préserve le contexte de catégorie et sous-catégorie
- Assigne automatiquement les labels appropriés basés sur les sections
- Génère les titres et corps des issues

### `create-github-issues.sh`
**Usage:** 
```bash
# Aperçu (sans créer les issues)
./scripts/create-github-issues.sh --dry-run

# Créer les issues
./scripts/create-github-issues.sh
```

Crée des issues GitHub à partir des tâches analysées.

**Prérequis:**
- GitHub CLI (`gh`) installé et authentifié
- Accès en écriture au dépôt

**Fonctionnalités:**
- Crée tous les labels nécessaires avec des couleurs appropriées
- Crée une issue par tâche non cochée
- Applique les labels basés sur la catégorie de la tâche
- Inclut le contexte de la tâche dans le corps de l'issue

### `add-to-project.sh`
**Usage:** 
```bash
# Ajouter au projet #1 (par défaut)
./scripts/add-to-project.sh

# Ajouter à un projet spécifique
./scripts/add-to-project.sh 2
```

Ajoute toutes les issues ouvertes au tableau Kanban du projet GitHub.

**Prérequis:**
- GitHub CLI (`gh`) installé et authentifié
- Accès en écriture au projet

### Workflow Complet de Synchronisation

```bash
# Étape 1: Parser todo.md et extraire les tâches
python3 scripts/sync-todo-to-github.py

# Étape 2: Prévisualiser les issues à créer
./scripts/create-github-issues.sh --dry-run

# Étape 3: Créer les issues (si l'aperçu est correct)
./scripts/create-github-issues.sh

# Étape 4: Ajouter les issues au projet
./scripts/add-to-project.sh 1
```

### Labels Créés

| Label | Description |
|-------|-------------|
| `backend` | Tâches Backend .NET |
| `frontend` | Tâches Frontend |
| `driver` | Tâches app chauffeur |
| `business` | Tâches app business |
| `tracking` | Tâches app tracking |
| `integrations` | Intégrations tierces |
| `signalr` | Tâches liées à SignalR |
| `geolocation` | Fonctionnalités de géolocalisation |
| `shared` | Code/types partagés |
| `types` | Types TypeScript |
| `ui` | Interface utilisateur |
| `bug` | Corrections de bugs |
| `manual` | Tâches manuelles |
| `priority` | Haute priorité |

### Configuration du Projet GitHub

Le projet Kanban GitHub doit avoir les colonnes suivantes:
- **To Do**: Nouvelles issues
- **In Progress**: Issues en cours
- **Done**: Issues terminées

Après avoir exécuté les scripts, visitez https://github.com/users/sbourbousse/projects/1 pour organiser les issues.
