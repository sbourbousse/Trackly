#!/bin/bash
# Validation script for TODO→GitHub synchronization setup
# Checks all prerequisites and provides helpful feedback

set -e

echo "🔍 Checking prerequisites for TODO→GitHub synchronization..."
echo ""

# Track overall status
all_good=true

# Check Python
echo -n "Checking Python 3... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo "✓ Found: $PYTHON_VERSION"
else
    echo "✗ Not found"
    echo "  Install Python 3 from: https://www.python.org/"
    all_good=false
fi

# Check jq
echo -n "Checking jq... "
if command -v jq &> /dev/null; then
    JQ_VERSION=$(jq --version 2>&1)
    echo "✓ Found: $JQ_VERSION"
else
    echo "✗ Not found"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    all_good=false
fi

# Check GitHub CLI
echo -n "Checking GitHub CLI (gh)... "
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version 2>&1 | head -1)
    echo "✓ Found: $GH_VERSION"
    
    # Check authentication
    echo -n "Checking GitHub CLI authentication... "
    if gh auth status &> /dev/null; then
        echo "✓ Authenticated"
        
        # Check repository access
        echo -n "Checking repository access... "
        if gh repo view sbourbousse/Trackly &> /dev/null; then
            echo "✓ Can access sbourbousse/Trackly"
        else
            echo "✗ Cannot access repository"
            echo "  Make sure you have access to sbourbousse/Trackly"
            all_good=false
        fi
    else
        echo "✗ Not authenticated"
        echo "  Run: gh auth login"
        all_good=false
    fi
else
    echo "✗ Not found"
    echo "  Install from: https://cli.github.com/"
    all_good=false
fi

echo ""
echo "📁 Checking required files..."

# Check todo.md
echo -n "Checking todo.md... "
if [ -f "todo.md" ]; then
    UNCHECKED_COUNT=$(grep -c "^\- \[ \]" todo.md || true)
    echo "✓ Found ($UNCHECKED_COUNT unchecked tasks)"
else
    echo "✗ Not found"
    all_good=false
fi

# Check scripts
echo -n "Checking sync-todo-to-github.py... "
if [ -f "scripts/sync-todo-to-github.py" ] && [ -x "scripts/sync-todo-to-github.py" ]; then
    echo "✓ Found (executable)"
else
    echo "✗ Missing or not executable"
    all_good=false
fi

echo -n "Checking create-github-issues.sh... "
if [ -f "scripts/create-github-issues.sh" ] && [ -x "scripts/create-github-issues.sh" ]; then
    echo "✓ Found (executable)"
else
    echo "✗ Missing or not executable"
    all_good=false
fi

echo -n "Checking add-to-project.sh... "
if [ -f "scripts/add-to-project.sh" ] && [ -x "scripts/add-to-project.sh" ]; then
    echo "✓ Found (executable)"
else
    echo "✗ Missing or not executable"
    all_good=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$all_good" = true ]; then
    echo "✅ All prerequisites met! You're ready to synchronize."
    echo ""
    echo "📝 Next steps:"
    echo ""
    echo "1. Parse todo.md:"
    echo "   python3 scripts/sync-todo-to-github.py"
    echo ""
    echo "2. Preview issues (optional):"
    echo "   ./scripts/create-github-issues.sh --dry-run"
    echo ""
    echo "3. Create issues:"
    echo "   ./scripts/create-github-issues.sh"
    echo ""
    echo "4. Add to project:"
    echo "   ./scripts/add-to-project.sh 1"
    echo ""
    echo "For detailed instructions, see: SYNC-TODO-GITHUB.md"
    exit 0
else
    echo "❌ Some prerequisites are missing. Please install them first."
    echo ""
    echo "For detailed setup instructions, see: SYNC-TODO-GITHUB.md"
    exit 1
fi
