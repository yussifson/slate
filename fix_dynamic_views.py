import os

directory = 'src/components/ui/'
for filename in os.listdir(directory):
    if filename.startswith('Dynamic') and filename.endswith('.jsx'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        content = content.replace('bg-white dark:bg-slate-900/40 dark:bg-slate-900/40', 'bg-card')
        content = content.replace('bg-white', 'bg-card')
        content = content.replace('hover:bg-slate-100/50', 'hover:bg-muted/50')
        content = content.replace('bg-slate-100 text-primary/90', 'bg-primary/10 text-primary')
        content = content.replace('bg-slate-100 text-slate-700', 'bg-muted text-muted-foreground')
        content = content.replace('bg-slate-100 text-slate-600', 'bg-muted text-muted-foreground')
        content = content.replace('border-slate-100', 'border-border')
        content = content.replace('border-slate-200', 'border-border')
        content = content.replace('border-slate-300', 'border-border')
        content = content.replace('text-slate-700', 'text-foreground')
        content = content.replace('text-slate-600', 'text-muted-foreground')
        content = content.replace('text-slate-500', 'text-muted-foreground')
        content = content.replace('text-slate-400', 'text-muted-foreground')
        content = content.replace('text-slate-900', 'text-foreground')
        content = content.replace('bg-slate-50', 'bg-muted/50')
        content = content.replace('bg-slate-100', 'bg-muted')
        content = content.replace('bg-slate-200', 'bg-muted')
        content = content.replace('bg-slate-50/50', 'bg-muted/50')
        content = content.replace('divide-slate-100', 'divide-border')
        content = content.replace('divide-slate-200', 'divide-border')
        content = content.replace('hover:bg-slate-50', 'hover:bg-muted/30')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("All Dynamic views patched")
