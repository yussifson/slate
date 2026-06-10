import os
import re

directories = ['src/components', 'src/pages', 'src/lib', 'src/api']

replacements = [
    # Translation strings & quoted text
    (r'"Welcome to your workspace"', '"Welcome to your workslate"'),
    (r'"workspace"', '"workslate"'), 
    (r'"Go to Workspace"', '"Go to WorkSlate"'),
    (r'>Workspace<', '>WorkSlate<'),
    (r'> Workspace<', '> WorkSlate<'),
    (r'"Workspace"', '"WorkSlate"'),
    (r'>Workspaces<', '>WorkSlates<'),
    (r'> Workspaces<', '> WorkSlates<'),
    (r'"Workspaces"', '"WorkSlates"'),
    
    # Module replacements
    (r'>Module<', '>Slate<'),
    (r'> Module<', '> Slate<'),
    (r'"Module"', '"Slate"'),
    (r'>Modules<', '>Slates<'),
    (r'> Modules<', '> Slates<'),
    (r'"Modules"', '"Slates"'),
    (r'"Custom Module"', '"Custom Slate"'),
    (r'"Dynamic Module"', '"Dynamic Slate"'),
    (r'"Custom Modules"', '"Custom Slates"'),
    (r'"Dynamic Modules"', '"Dynamic Slates"'),
    (r'"Generate a module"', '"Generate a slate"'),
    (r'"create an ENTIRE NEW MODULE"', '"create an ENTIRE NEW SLATE"'),
    
    # Text nodes
    (r' Workspace ', ' WorkSlate '),
    (r' Workspaces ', ' WorkSlates '),
    (r' Module ', ' Slate '),
    (r' Modules ', ' Slates '),
]

for d in directories:
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith('.jsx') or f.endswith('.js') or f.endswith('.tsx') or f.endswith('.ts'):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                        content = file.read()
                    
                    original_content = content
                    
                    for pattern, replacement in replacements:
                        content = content.replace(pattern, replacement)
                    
                    if content != original_content:
                        with open(path, 'w', encoding='utf-8') as file:
                            file.write(content)
                        print(f"Updated {path}")
                except Exception as e:
                    pass
print("Replacement script finished.")
