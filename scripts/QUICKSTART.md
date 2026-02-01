# Quick Start: Synchronize TODO with GitHub

**Goal**: Create GitHub Issues from `todo.md` and add them to the Project Kanban.

## TL;DR - Quick Commands

```bash
# 1. Authenticate with GitHub (one-time setup)
gh auth login

# 2. Parse todo.md
python3 scripts/sync-todo-to-github.py

# 3. Create issues
./scripts/create-github-issues.sh

# 4. Add to project board
./scripts/add-to-project.sh 1
```

## What This Does

- Reads all unchecked tasks (`- [ ]`) from `todo.md`
- Creates one GitHub issue per task
- Applies labels based on category (backend, frontend, etc.)
- Adds all issues to the GitHub Project board at https://github.com/users/sbourbousse/projects/1

## Current Status

- **31 unchecked tasks** ready to sync
- Tasks organized by category: Backend (4), Driver (4), Tracking (8), Shared (4), Manual (11)

## Prerequisites Check

Run this to verify you have everything needed:

```bash
./scripts/check-sync-prerequisites.sh
```

## Files

| File | Purpose |
|------|---------|
| `sync-todo-to-github.py` | Parse todo.md and extract tasks |
| `create-github-issues.sh` | Create GitHub issues with labels |
| `add-to-project.sh` | Add issues to project board |
| `check-sync-prerequisites.sh` | Verify setup is ready |
| `test-sync-system.py` | Test the synchronization system |
| `todo-tasks.json` | Generated task data (intermediate) |

## Detailed Documentation

For complete instructions and troubleshooting, see: **[SYNC-TODO-GITHUB.md](../SYNC-TODO-GITHUB.md)**

## Testing

The synchronization system includes automated tests:

```bash
# Run tests (no GitHub auth required)
python3 scripts/test-sync-system.py
```

All 5 tests should pass:
- ✓ Parser
- ✓ JSON Export  
- ✓ Issue Generation
- ✓ Label Mapping
- ✓ Category Counts

## Notes

- ✅ Checked tasks (`- [x]`) are automatically excluded
- ✅ Labels are auto-assigned based on todo.md sections
- ✅ Each issue links back to the line number in todo.md
- ✅ Safe to run multiple times (won't create duplicates if titles match)
- ⚠️ Requires GitHub CLI authentication and write access to repo/project

## Support

Questions? See the full guide: [SYNC-TODO-GITHUB.md](../SYNC-TODO-GITHUB.md)
