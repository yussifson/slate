import os
import glob

for filename in glob.glob('src/pages/**/*.jsx', recursive=True):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        content = content.replace('>Workspace Setup<', '>WorkSlate Setup<')
        content = content.replace('"Workspace Setup"', '"WorkSlate Setup"')
        content = content.replace('>Workspace Name<', '>WorkSlate Name<')
        content = content.replace('"Workspace Name"', '"WorkSlate Name"')
        content = content.replace('bg-slate-50/50', 'bg-slate-50/50 dark:bg-transparent')
        content = content.replace('bg-white', 'bg-white dark:bg-slate-900/40')
        content = content.replace('text-slate-900', 'text-slate-900 dark:text-slate-100')
        content = content.replace('text-slate-500', 'text-slate-500 dark:text-slate-400')
        content = content.replace('text-slate-700', 'text-slate-700 dark:text-slate-300')
        content = content.replace('border-slate-100', 'border-slate-100 dark:border-slate-800')
        content = content.replace('bg-slate-50 ', 'bg-slate-50 dark:bg-slate-800/50 ')
        
        if content != original:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched {filename}")
    except Exception as e:
        print(f"Failed {filename}: {e}")

