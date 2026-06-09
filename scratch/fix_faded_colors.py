import os

def fix_faded_colors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('bg-primary/5', 'bg-slate-50')
    new_content = new_content.replace('bg-primary/10', 'bg-slate-100')
    new_content = new_content.replace('border-primary/10', 'border-slate-200')
    new_content = new_content.replace('border-primary/50', 'border-slate-200')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            fix_faded_colors(os.path.join(root, file))
