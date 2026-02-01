#!/bin/bash
# Script to add created issues to GitHub Project
# This script adds all open issues to the GitHub Project Kanban
#
# Prerequisites:
# - GitHub CLI (gh) must be installed and authenticated
# - Issues must already be created in the repository
# - You must have write access to the project
#
# Usage:
#   ./scripts/add-to-project.sh [PROJECT_NUMBER]
#
# The project number can be found in the project URL:
# https://github.com/users/sbourbousse/projects/1
#                                              ^ this is the project number

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="sbourbousse/Trackly"
OWNER="sbourbousse"

# Default project number from the problem statement
PROJECT_NUMBER="${1:-1}"

echo "🔍 Adding issues to Project #$PROJECT_NUMBER"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI"
    exit 1
fi

echo "📋 Fetching open issues from $REPO..."
# Get all open issues
ISSUES=$(gh issue list -R "$REPO" --state open --limit 1000 --json number,title,labels | jq -c '.[]')

if [ -z "$ISSUES" ]; then
    echo "⚠️  No open issues found in the repository"
    exit 0
fi

ISSUE_COUNT=$(echo "$ISSUES" | wc -l)
echo "Found $ISSUE_COUNT open issues"
echo ""

echo "🎯 Adding issues to project..."
added=0
skipped=0

# Add each issue to the project
while IFS= read -r issue; do
    issue_number=$(echo "$issue" | jq -r '.number')
    issue_title=$(echo "$issue" | jq -r '.title')
    
    echo "Issue #$issue_number: ${issue_title:0:60}..."
    
    # Add to project using gh CLI
    # Note: The project add command requires the project to be set up with proper permissions
    error_output=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "https://github.com/$REPO/issues/$issue_number" 2>&1)
    if [ $? -eq 0 ]; then
        echo "  ✓ Added to project"
        ((added++))
    else
        echo "  ⚠️  Could not add (may already be in project or permission issue)"
        # Show error details if verbose mode or debugging needed
        if [[ "$error_output" != *"already exists"* ]]; then
            echo "     Error: $error_output" | head -1
        fi
        ((skipped++))
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.3
done <<< "$ISSUES"

echo ""
echo "✅ Summary:"
echo "   Added: $added issues"
if [ $skipped -gt 0 ]; then
    echo "   Skipped: $skipped issues"
fi

echo ""
echo "ℹ️  Next steps:"
echo "   1. Visit https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
echo "   2. Organize issues into columns (To Do, In Progress, Done)"
echo "   3. Issues can be moved between columns as work progresses"
