#!/usr/bin/env python3
"""
Script to synchronize todo.md with GitHub Issues and Projects
This script parses the todo.md file, extracts unchecked tasks,
and provides the information needed to create GitHub issues.
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Tuple


class TodoParser:
    """Parser for todo.md file"""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.tasks = []
        
    def parse(self) -> List[Dict]:
        """Parse the todo.md file and extract unchecked tasks with context"""
        with open(self.filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        current_category = None
        current_subcategory = None
        
        for i, line in enumerate(lines):
            # Skip header lines
            if line.startswith('#'):
                # Determine category level
                if line.startswith('## '):
                    current_category = line.replace('## ', '').strip()
                    current_subcategory = None
                elif line.startswith('### '):
                    current_subcategory = line.replace('### ', '').strip()
                continue
            
            # Check for unchecked tasks
            if line.strip().startswith('- [ ]'):
                task_text = line.strip()[6:].strip()  # Remove '- [ ] '
                
                # Determine labels based on category
                labels = self._determine_labels(current_category, current_subcategory)
                
                task = {
                    'text': task_text,
                    'category': current_category,
                    'subcategory': current_subcategory,
                    'labels': labels,
                    'line_number': i + 1
                }
                
                self.tasks.append(task)
        
        return self.tasks
    
    def _determine_labels(self, category: str, subcategory: str) -> List[str]:
        """Determine GitHub labels based on category and subcategory"""
        labels = []
        
        if not category:
            return ['todo']
        
        # Map categories to labels
        category_lower = category.lower()
        
        if 'backend' in category_lower:
            labels.append('backend')
        elif 'frontend business' in category_lower:
            labels.append('frontend')
            labels.append('business')
        elif 'frontend driver' in category_lower:
            labels.append('frontend')
            labels.append('driver')
        elif 'frontend tracking' in category_lower:
            labels.append('frontend')
            labels.append('tracking')
        elif 'shared types' in category_lower:
            labels.append('shared')
            labels.append('types')
        elif 'instructions manuelles' in category_lower:
            labels.append('manual')
            labels.append('priority')
        
        # Add subcategory as label if it exists
        if subcategory:
            subcategory_lower = subcategory.lower()
            if 'signalr' in subcategory_lower:
                labels.append('signalr')
            elif 'intégrations' in subcategory_lower or 'integrations' in subcategory_lower:
                labels.append('integrations')
            elif 'infrastructure' in subcategory_lower:
                labels.append('infrastructure')
            elif 'api' in subcategory_lower:
                labels.append('api')
            elif 'géolocalisation' in subcategory_lower or 'geolocation' in subcategory_lower:
                labels.append('geolocation')
            elif 'ui' in subcategory_lower:
                labels.append('ui')
            elif 'bug' in subcategory_lower:
                labels.append('bug')
        
        # Default label if none found
        if not labels:
            labels.append('todo')
        
        return labels
    
    def generate_issue_title(self, task: Dict) -> str:
        """Generate a concise issue title from task text"""
        # GitHub issue title max length is ~256, but we keep it shorter for readability
        MAX_TITLE_LENGTH = 80
        ELLIPSIS = '...'
        TRUNCATE_AT = MAX_TITLE_LENGTH - len(ELLIPSIS)  # 77 chars + 3 for '...'
        
        title = task['text']
        
        # Remove markdown formatting
        title = re.sub(r'\*\*([^*]+)\*\*', r'\1', title)  # Remove bold
        title = re.sub(r'`([^`]+)`', r'\1', title)  # Remove code markers
        
        # Truncate if too long
        if len(title) > MAX_TITLE_LENGTH:
            title = title[:TRUNCATE_AT] + ELLIPSIS
        
        return title
    
    def generate_issue_body(self, task: Dict) -> str:
        """Generate issue body with context"""
        body = f"**Task from todo.md (line {task['line_number']})**\n\n"
        body += f"{task['text']}\n\n"
        
        if task['category']:
            body += f"**Category:** {task['category']}\n"
        if task['subcategory']:
            body += f"**Subcategory:** {task['subcategory']}\n"
        
        body += f"\n---\n"
        body += f"This issue was automatically created from the todo.md file.\n"
        
        return body
    
    def export_to_json(self, output_file: str):
        """Export tasks to JSON for further processing"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.tasks, f, indent=2, ensure_ascii=False)
    
    def print_summary(self):
        """Print a summary of parsed tasks"""
        print(f"\n📋 Found {len(self.tasks)} unchecked tasks\n")
        
        # Group by category
        by_category = {}
        for task in self.tasks:
            cat = task['category'] or 'Uncategorized'
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(task)
        
        for category, tasks in by_category.items():
            print(f"\n{category}: {len(tasks)} tasks")
            for task in tasks[:3]:  # Show first 3 tasks
                print(f"  - {task['text'][:60]}...")
            if len(tasks) > 3:
                print(f"  ... and {len(tasks) - 3} more")


def main():
    """Main execution"""
    # Parse todo.md
    todo_file = Path(__file__).parent.parent / 'todo.md'
    
    print(f"🔍 Parsing {todo_file}...")
    parser = TodoParser(str(todo_file))
    tasks = parser.parse()
    
    # Print summary
    parser.print_summary()
    
    # Export to JSON
    output_file = Path(__file__).parent / 'todo-tasks.json'
    parser.export_to_json(str(output_file))
    print(f"\n✅ Exported tasks to {output_file}")
    
    # Generate GitHub issues data
    print("\n📝 GitHub Issues to create:\n")
    for i, task in enumerate(tasks, 1):
        print(f"\nIssue {i}:")
        print(f"  Title: {parser.generate_issue_title(task)}")
        print(f"  Labels: {', '.join(task['labels'])}")
        if i <= 3:  # Show details for first 3
            print(f"  Body (preview): {parser.generate_issue_body(task)[:100]}...")
    
    print(f"\n\n🎯 Total issues to create: {len(tasks)}")
    print(f"\nℹ️  To create these issues in GitHub, use the GitHub CLI or API")
    print(f"    Task data exported to: {output_file}")


if __name__ == '__main__':
    main()
