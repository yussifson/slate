import os

filepath = 'src/pages/retail/PurchaseOrders.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-slate-50/50', 'bg-slate-50/50 dark:bg-transparent')
content = content.replace('text-slate-900', 'text-slate-900 dark:text-slate-100')
content = content.replace('text-slate-500', 'text-slate-500 dark:text-slate-400')
content = content.replace('bg-white', 'bg-white dark:bg-slate-900/40')
content = content.replace('border-slate-100', 'border-slate-100 dark:border-slate-800')
content = content.replace('text-slate-400', 'text-slate-400 dark:text-slate-500')
content = content.replace('text-slate-700', 'text-slate-700 dark:text-slate-300')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("PurchaseOrders.jsx colors patched")
