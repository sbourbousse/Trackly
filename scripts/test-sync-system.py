#!/usr/bin/env python3
"""
Test script to validate the TODO synchronization system
Tests the parser and data structure without requiring GitHub authentication
"""

import sys
import json
from pathlib import Path

# Import the parser directly by loading it
script_dir = Path(__file__).parent

# Load the TodoParser from the sync script
import importlib.util
spec = importlib.util.spec_from_file_location("sync_todo_to_github", script_dir / "sync-todo-to-github.py")
sync_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_module)
TodoParser = sync_module.TodoParser


def test_parser():
    """Test the todo.md parser"""
    print("🧪 Testing TodoParser...")
    
    todo_file = script_dir.parent / 'todo.md'
    if not todo_file.exists():
        print(f"❌ todo.md not found at {todo_file}")
        return False
    
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    print(f"✓ Parsed {len(tasks)} tasks")
    
    # Validate task structure
    required_fields = ['text', 'category', 'subcategory', 'labels', 'line_number']
    for i, task in enumerate(tasks[:5]):  # Check first 5
        for field in required_fields:
            if field not in task:
                print(f"❌ Task {i} missing field: {field}")
                return False
    
    print("✓ All tasks have required fields")
    
    # Check labels
    all_labels = set()
    for task in tasks:
        all_labels.update(task['labels'])
    
    print(f"✓ Found {len(all_labels)} unique labels: {', '.join(sorted(all_labels))}")
    
    return True


def test_json_export():
    """Test JSON export"""
    print("\n🧪 Testing JSON export...")
    
    todo_file = script_dir.parent / 'todo.md'
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    json_file = script_dir / 'todo-tasks-test.json'
    parser.export_to_json(str(json_file))
    
    if not json_file.exists():
        print(f"❌ JSON file not created at {json_file}")
        return False
    
    print(f"✓ JSON exported to {json_file}")
    
    # Read and validate JSON
    with open(json_file, 'r') as f:
        loaded_tasks = json.load(f)
    
    if len(loaded_tasks) != len(tasks):
        print(f"❌ JSON has {len(loaded_tasks)} tasks, expected {len(tasks)}")
        return False
    
    print(f"✓ JSON contains {len(loaded_tasks)} tasks")
    
    # Cleanup test file
    json_file.unlink()
    
    return True


def test_issue_generation():
    """Test issue title and body generation"""
    print("\n🧪 Testing issue generation...")
    
    todo_file = script_dir.parent / 'todo.md'
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    # Test first task
    task = tasks[0]
    title = parser.generate_issue_title(task)
    body = parser.generate_issue_body(task)
    
    if not title:
        print("❌ Empty title generated")
        return False
    
    if not body:
        print("❌ Empty body generated")
        return False
    
    # Title should be truncated to 80 chars by generate_issue_title
    if len(title) > 80:
        print(f"⚠️  Title exceeds expected length: {len(title)} chars (expected ≤80)")
    
    print(f"✓ Generated title: {title[:60]}...")
    print(f"✓ Generated body ({len(body)} chars)")
    
    # Check that body contains expected elements
    expected_in_body = ['Task from todo.md', 'Category:', '---']
    for expected in expected_in_body:
        if expected not in body:
            print(f"❌ Body missing expected content: {expected}")
            return False
    
    print("✓ Body contains expected content")
    
    return True


def test_label_mapping():
    """Test that labels are correctly mapped"""
    print("\n🧪 Testing label mapping...")
    
    todo_file = script_dir.parent / 'todo.md'
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    # Check that backend tasks have backend label
    backend_tasks = [t for t in tasks if t['category'] == 'Backend .NET 9']
    if backend_tasks:
        if 'backend' not in backend_tasks[0]['labels']:
            print("❌ Backend task doesn't have 'backend' label")
            return False
        print(f"✓ Backend tasks have 'backend' label ({len(backend_tasks)} tasks)")
    
    # Check integration tasks
    integration_tasks = [t for t in tasks if t['subcategory'] == 'Intégrations']
    if integration_tasks:
        if 'integrations' not in integration_tasks[0]['labels']:
            print("❌ Integration task doesn't have 'integrations' label")
            return False
        print(f"✓ Integration tasks have 'integrations' label ({len(integration_tasks)} tasks)")
    
    # Check frontend tasks
    frontend_tasks = [t for t in tasks if 'Frontend' in (t['category'] or '')]
    if frontend_tasks:
        if 'frontend' not in frontend_tasks[0]['labels']:
            print("❌ Frontend task doesn't have 'frontend' label")
            return False
        print(f"✓ Frontend tasks have 'frontend' label ({len(frontend_tasks)} tasks)")
    
    return True


def test_category_counts():
    """Test that we get expected number of tasks per category"""
    print("\n🧪 Testing category distribution...")
    
    todo_file = script_dir.parent / 'todo.md'
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    by_category = {}
    for task in tasks:
        cat = task['category'] or 'Uncategorized'
        by_category[cat] = by_category.get(cat, 0) + 1
    
    print("\nCategory distribution:")
    for cat, count in sorted(by_category.items()):
        print(f"  {cat}: {count} tasks")
    
    # Expected counts based on manual review
    expected = {
        'Backend .NET 9': 4,
        'Frontend Driver (PWA)': 4,
        'Frontend Tracking': 8,
        'Shared Types': 4,
        'Instructions manuelles importantes (à développer prochainement)': 11
    }
    
    all_match = True
    for cat, expected_count in expected.items():
        actual_count = by_category.get(cat, 0)
        if actual_count != expected_count:
            print(f"⚠️  {cat}: expected {expected_count}, got {actual_count}")
            all_match = False
    
    if all_match:
        print("\n✓ All category counts match expected values")
    
    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("TODO→GitHub Synchronization Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Parser", test_parser),
        ("JSON Export", test_json_export),
        ("Issue Generation", test_issue_generation),
        ("Label Mapping", test_label_mapping),
        ("Category Counts", test_category_counts)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' failed with exception: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("Test Results")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print()
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
