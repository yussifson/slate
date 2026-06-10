import os
import glob

ui_files = glob.glob('src/components/ui/Dynamic*.jsx')

for filepath in ui_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # Fix hard white backgrounds -> use card token (dark-aware)
        content = content.replace('bg-white rounded-md border border-slate-200', 'bg-card rounded-md border border-border')
        content = content.replace('bg-white rounded-xl border border-slate-200', 'bg-card rounded-xl border border-border')
        content = content.replace('bg-white rounded-xl border border-slate-200/80', 'bg-card rounded-xl border border-border')
        content = content.replace('bg-white rounded-2xl border border-slate-200/80', 'bg-card rounded-2xl border border-border')
        content = content.replace('rounded-xl border border-slate-200/80 bg-white', 'rounded-xl border border-border bg-card')
        
        # Fix white table wrapper
        content = content.replace('border border-slate-200 bg-white', 'border border-border bg-card')
        
        # Fix hard slate text inside tables
        content = content.replace('text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary', 'text-foreground focus:outline-none focus:ring-2 focus:ring-primary')
        
        # Fix kanban cards
        content = content.replace('bg-white p-3 rounded-lg shadow-sm border border-slate-200', 'bg-card p-3 rounded-lg shadow-sm border border-border')
        
        # Fix pipeline cards
        content = content.replace('bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm cursor-grab', 'bg-card rounded-xl border border-border p-4 shadow-sm cursor-grab')
        
        # Fix calendar cells
        content = content.replace("", "")
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

# Also fix OnboardingWizard
filepath = 'src/pages/OnboardingWizard.jsx'
try:
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    original = content

    # The wizard card has a hardcoded gray bg - replace with card/background tokens
    content = content.replace('bg-white dark:bg-slate-900/40 dark:bg-transparent rounded-xl', 'bg-card rounded-xl')
    content = content.replace('bg-white dark:bg-slate-900/40 dark:bg-slate-900/40', 'bg-card')
    content = content.replace('bg-slate-50/50 dark:bg-transparent dark:bg-transparent', 'bg-background')
    content = content.replace("className=\"bg-white dark:bg-slate-900/40", "className=\"bg-card")
    content = content.replace("className=\"bg-slate-50", "className=\"bg-muted/30")
    content = content.replace("'bg-white dark:bg-slate-900/40", "'bg-card")
    content = content.replace('border-slate-200 dark:border-slate-800', 'border-border')
    content = content.replace('text-slate-900 dark:text-slate-100', 'text-foreground')
    content = content.replace('text-slate-600 dark:text-slate-300', 'text-muted-foreground')
    content = content.replace('text-slate-500 dark:text-slate-400', 'text-muted-foreground')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")
except Exception as e:
    print(f"Failed {filepath}: {e}")

# Fix CreateModulePage preview panel
filepath = 'src/pages/CreateModulePage.jsx'
try:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    content = content.replace("bg-slate-100 text-primary flex items-center justify-center", "bg-primary/10 text-primary flex items-center justify-center")
    content = content.replace("border-primary bg-slate-100 text-primary", "border-primary bg-primary/10 text-primary")
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")
except Exception as e:
    print(f"Failed {filepath}: {e}")

print("Done!")
