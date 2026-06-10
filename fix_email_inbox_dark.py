import os

filepath = 'src/pages/EmailInbox.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix sidebar background
content = content.replace('bg-slate-50/50', 'bg-slate-50/50 dark:bg-slate-900/30')

# Fix middle pane background
content = content.replace('bg-white', 'bg-white dark:bg-transparent')

# Fix empty state backgrounds
content = content.replace('bg-slate-100', 'bg-slate-100 dark:bg-slate-800')
content = content.replace('bg-slate-50 ', 'bg-slate-50 dark:bg-slate-800/50 ')
content = content.replace('bg-slate-50/30', 'bg-slate-50/30 dark:bg-transparent')

# Fix text colors in empty states
content = content.replace('text-slate-700', 'text-slate-700 dark:text-slate-200')
content = content.replace('text-slate-600', 'text-slate-600 dark:text-slate-300')
content = content.replace('text-slate-400', 'text-slate-400 dark:text-slate-500')
content = content.replace('text-slate-300', 'text-slate-300 dark:text-slate-600')
content = content.replace('text-slate-200', 'text-slate-200 dark:text-slate-700')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("EmailInbox.jsx dark mode colors patched")
