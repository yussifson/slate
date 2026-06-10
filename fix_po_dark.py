filepath = 'src/pages/retail/PurchaseOrders.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Table wrapper
content = content.replace(
    'bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 border border-slate-200 rounded-xl shadow-sm overflow-hidden',
    'bg-card border border-border rounded-xl shadow-sm overflow-hidden'
)

# Thead
content = content.replace(
    'bg-slate-50/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200',
    'bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border'
)

# Tbody divider
content = content.replace('divide-y divide-slate-100', 'divide-y divide-border')

# Row hover
content = content.replace("hover:bg-slate-50/80 transition-colors", "hover:bg-muted/30 transition-colors dark:hover:bg-muted/10")

# Search input
content = content.replace(
    'pl-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 border-slate-200 shadow-sm',
    'pl-9 bg-background border-border shadow-sm'
)

# Page bg
content = content.replace(
    'flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-transparent dark:bg-transparent',
    'flex-1 p-6 overflow-y-auto bg-background'
)

# Text colors
content = content.replace(
    'text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100 tracking-tight',
    'text-2xl font-bold text-foreground tracking-tight'
)
content = content.replace(
    'text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1',
    'text-sm text-muted-foreground mt-1'
)
content = content.replace(
    'text-slate-400 dark:text-slate-500 dark:text-slate-400',
    'text-muted-foreground'
)

# Empty state
content = content.replace(
    'py-16 text-center text-muted-foreground',
    'py-16 text-center text-muted-foreground bg-card'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("PurchaseOrders.jsx patched" if content != original else "No changes needed")
