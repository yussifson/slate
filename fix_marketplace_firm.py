import os
import glob

# 1. Patch Marketplace.jsx
filepath = 'src/pages/Marketplace.jsx'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Text replacements
    content = content.replace('Module Marketplace', 'Slate Marketplace')
    content = content.replace('Search modules...', 'Search slates...')
    content = content.replace('community-built modules for your workslate.', 'community-built slates for your workslate.')
    content = content.replace('"Failed to load marketplace modules."', '"Failed to load marketplace slates."')
    
    # Dark mode backgrounds for the marketplace
    # In Marketplace, the cards probably have bg-white
    content = content.replace('bg-white', 'bg-white dark:bg-slate-900/40')
    content = content.replace('bg-slate-50 ', 'bg-slate-50 dark:bg-slate-800/50 ')
    content = content.replace('border-slate-100', 'border-slate-100 dark:border-slate-800')
    content = content.replace('text-slate-900', 'text-slate-900 dark:text-slate-100')
    content = content.replace('text-slate-700', 'text-slate-700 dark:text-slate-300')
    content = content.replace('text-slate-500', 'text-slate-500 dark:text-slate-400')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Marketplace.jsx patched")


# 2. Patch FirmSetup / CompanySetup / OnboardingWizard
for filename in glob.glob('src/pages/**/*.jsx', recursive=True):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Replace Workspace with WorkSlate in UI strings if any
    content = content.replace('>Workspace Setup<', '>WorkSlate Setup<')
    content = content.replace('"Workspace Setup"', '"WorkSlate Setup"')
    content = content.replace('>Workspace Name<', '>WorkSlate Name<')
    content = content.replace('"Workspace Name"', '"WorkSlate Name"')
    
    # Also patch the hardcoded bg-white and bg-slate-50/50
    if ('Workspace' in original or 'WorkSlate' in original) and 'bg-white' in content:
        content = content.replace('bg-white', 'bg-white dark:bg-slate-900/40')
        content = content.replace('bg-slate-50/50', 'bg-slate-50/50 dark:bg-transparent')
        content = content.replace('text-slate-900', 'text-slate-900 dark:text-slate-100')
        
    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filename}")

