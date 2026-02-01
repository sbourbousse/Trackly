# Todo.md → GitHub Issues Synchronization Guide

## Overview

This guide explains how to synchronize the `todo.md` file with GitHub Issues and add them to the GitHub Project Kanban board at https://github.com/users/sbourbousse/projects/1.

## What Gets Synchronized

- ✅ **Included**: All tasks marked with unchecked boxes `- [ ]`
- ❌ **Excluded**: All tasks marked as complete `- [x]`

## Current Status

As of the last sync, there are **31 unchecked tasks** in `todo.md`:

- Backend .NET 9 → Intégrations: 4 tasks
- Frontend Driver (PWA): 4 tasks  
- Frontend Tracking: 8 tasks
- Shared Types: 4 tasks
- Instructions manuelles importantes: 11 tasks

## Prerequisites

Before running the synchronization, ensure you have:

1. **GitHub CLI (gh)** installed:
   ```bash
   # Check installation
   gh --version
   
   # Install if needed
   # Ubuntu/Debian: sudo apt install gh
   # macOS: brew install gh
   # Windows: winget install --id GitHub.cli
   ```

2. **Python 3** installed:
   ```bash
   python3 --version
   ```

3. **jq** installed (for JSON processing):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install jq
   
   # macOS
   brew install jq
   ```

4. **GitHub CLI authenticated**:
   ```bash
   gh auth login
   ```
   Follow the prompts to authenticate with your GitHub account.

5. **Repository access**: You must have write access to the `sbourbousse/Trackly` repository.

6. **Project access**: You must have write access to the GitHub Project #1.

## Step-by-Step Synchronization

### Step 1: Parse the todo.md File

Run the Python parser to extract all unchecked tasks:

```bash
python3 scripts/sync-todo-to-github.py
```

**What it does:**
- Reads `todo.md`
- Extracts all lines with `- [ ]` 
- Preserves category/subcategory context
- Assigns appropriate labels based on sections
- Exports data to `scripts/todo-tasks.json`

**Expected output:**
```
🔍 Parsing /path/to/todo.md...
📋 Found 31 unchecked tasks
...
✅ Exported tasks to scripts/todo-tasks.json
```

### Step 2: Preview Issues (Optional but Recommended)

Before creating issues, preview what will be created:

```bash
./scripts/create-github-issues.sh --dry-run
```

**What it does:**
- Shows what labels would be created
- Lists all issues that would be created with their titles and labels
- Does NOT actually create anything

**Review the output** to ensure everything looks correct.

### Step 3: Create GitHub Issues

Once you're satisfied with the preview, create the actual issues:

```bash
./scripts/create-github-issues.sh
```

**What it does:**
- Creates labels if they don't exist
- Creates one GitHub issue per unchecked task
- Applies appropriate labels to each issue
- Includes context (category, subcategory, line number) in issue body

**Expected output:**
```
🏷️  Ensuring labels exist...
  ✓ Label already exists: backend
  + Creating label: frontend
...
🚀 Creating issues...

Issue 1/31: Configurer Stripe Billing (clés API, webhooks)
  Labels: backend,integrations
  ✓ Created
...
✅ Summary:
   Created: 31 issues
```

**Time estimate**: About 15-30 seconds (includes rate limit delays)

### Step 4: Add Issues to Project

Add all created issues to the GitHub Project Kanban:

```bash
./scripts/add-to-project.sh 1
```

The `1` is the project number from the URL: `https://github.com/users/sbourbousse/projects/1`

**What it does:**
- Fetches all open issues from the repository
- Adds each issue to the specified project
- Issues will appear in the "To Do" column by default

**Expected output:**
```
📋 Fetching open issues from sbourbousse/Trackly...
Found 31 open issues

🎯 Adding issues to project...
Issue #1: Configurer Stripe Billing...
  ✓ Added to project
...
✅ Summary:
   Added: 31 issues
```

### Step 5: Organize in Project Board

1. Visit https://github.com/users/sbourbousse/projects/1
2. All issues will be in the "To Do" column
3. You can manually organize them by:
   - Moving issues to "In Progress" when work starts
   - Moving issues to "Done" when complete
   - Prioritizing by dragging them up/down within columns

## Understanding Labels

The synchronization automatically assigns labels based on the section structure in `todo.md`:

| Section in todo.md | Assigned Labels |
|-------------------|-----------------|
| Backend .NET 9 → Intégrations | `backend`, `integrations` |
| Backend .NET 9 → SignalR | `backend`, `signalr` |
| Frontend Business | `frontend`, `business` |
| Frontend Driver | `frontend`, `driver` |
| Frontend Tracking | `frontend`, `tracking` |
| Shared Types | `shared`, `types` |
| Instructions manuelles → UI | `manual`, `priority`, `ui` |
| Instructions manuelles → Bug | `manual`, `priority`, `bug` |

### All Available Labels

| Label | Color | Description |
|-------|-------|-------------|
| `backend` | Green | Backend .NET tasks |
| `frontend` | Blue | Frontend tasks |
| `driver` | Purple | Driver app specific |
| `business` | Light Purple | Business app specific |
| `tracking` | Light Purple | Tracking app specific |
| `integrations` | Yellow | Third-party integrations |
| `signalr` | Light Blue | SignalR functionality |
| `geolocation` | Blue | GPS/location features |
| `shared` | Pink | Shared code |
| `types` | Light Pink | TypeScript types |
| `infrastructure` | Orange | DevOps/Infrastructure |
| `api` | Green | API endpoints |
| `ui` | Purple | User interface |
| `bug` | Red | Bug fixes |
| `manual` | Light Yellow | Manual tasks |
| `priority` | Dark Red | High priority |

## Project Board Structure

The GitHub Project should have these columns:

### To Do
- New issues start here
- Backlog of work to be done
- Can be prioritized by order

### In Progress  
- Issues actively being worked on
- Limit work in progress for better focus

### Done
- Completed issues
- Should be closed in GitHub as well

## Workflow for Managing Issues

### When Starting Work on a Task

1. Move the issue from "To Do" to "In Progress" in the project
2. Assign yourself to the issue
3. Create a branch for the work (if needed)

### When Completing a Task

1. Mark the task as complete in `todo.md`: Change `- [ ]` to `- [x]`
2. Close the GitHub issue with a commit message: `"fixes #123"` or close manually
3. Move the issue to "Done" in the project board

### Adding New Tasks

When you add new unchecked tasks to `todo.md`:

1. Run the synchronization again (Steps 1-4)
2. Only new tasks will be created (existing issues won't be duplicated)

## Troubleshooting

### "gh: command not found"
**Solution**: Install the GitHub CLI from https://cli.github.com/

### "Not authenticated with GitHub CLI"
**Solution**: Run `gh auth login` and follow the prompts

### "Failed to create issue"
**Possible causes**:
- No write access to repository
- Issue with same title might already exist
- GitHub API rate limit reached

**Solution**: Check repository permissions and retry after a few minutes

### "Could not add to project"
**Possible causes**:
- Incorrect project number
- No write access to project
- Issue already in project

**Solution**: 
- Verify project URL: `https://github.com/users/sbourbousse/projects/1` (the `1` is the project number)
- Check project permissions
- If issue is already in project, this is expected and can be ignored

### "jq: command not found"
**Solution**: Install jq
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS  
brew install jq
```

### Duplicate Issues Created

If you accidentally run the script multiple times:

1. Manually close duplicate issues in GitHub
2. Remove them from the project board
3. The system doesn't automatically detect duplicates, so be careful not to run the creation script multiple times

## Example Complete Workflow

Here's a complete example of the synchronization process:

```bash
# Navigate to repository
cd /path/to/Trackly

# Step 1: Parse todo.md
python3 scripts/sync-todo-to-github.py

# Output:
# 📋 Found 31 unchecked tasks
# ✅ Exported tasks to scripts/todo-tasks.json

# Step 2: Preview (optional)
./scripts/create-github-issues.sh --dry-run

# Review output, then...

# Step 3: Create issues
./scripts/create-github-issues.sh

# Output:
# 🏷️  Ensuring labels exist...
# 🚀 Creating issues...
# ✅ Summary: Created: 31 issues

# Step 4: Add to project
./scripts/add-to-project.sh 1

# Output:
# 📋 Fetching open issues...
# 🎯 Adding issues to project...
# ✅ Summary: Added: 31 issues

# Step 5: Visit project to organize
# https://github.com/users/sbourbousse/projects/1
```

## Files Created During Sync

- `scripts/todo-tasks.json` - Parsed task data (safe to delete after sync)

## Tips and Best Practices

1. **Run a dry-run first**: Always use `--dry-run` to preview before creating issues
2. **Review todo.md**: Make sure all unchecked tasks are actually tasks you want as issues
3. **Clean up completed tasks**: Mark completed tasks with `[x]` before syncing to avoid creating issues for done work
4. **Sync regularly**: Run the sync after adding significant new tasks to todo.md
5. **Use commit messages**: Close issues with commit messages like "fixes #123" to automatically update the project board
6. **Label filtering**: Use labels in GitHub to filter and find related issues easily
7. **Project views**: Create custom views in the project board to filter by label, assignee, etc.

## Future Enhancements

Potential improvements for the synchronization system:

- Bidirectional sync (update todo.md when issues are closed in GitHub)
- Automatic assignment to project columns based on priority or category
- GitHub Actions integration for automatic sync on push
- Update existing issues instead of creating duplicates
- Dependency tracking between issues
- Milestone creation and assignment

## Support

If you encounter issues or have questions:

1. Check the troubleshooting section above
2. Review the script output for error messages
3. Verify all prerequisites are met
4. Check GitHub's status page: https://www.githubstatus.com/

## Reference

- GitHub CLI documentation: https://cli.github.com/manual/
- GitHub Projects documentation: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- Repository: https://github.com/sbourbousse/Trackly
- Project board: https://github.com/users/sbourbousse/projects/1
