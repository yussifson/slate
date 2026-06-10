import sys
import os

replacements = [
    ('Create Module', 'Create Slate'),
    ('Create module', 'Create slate'),
    ('Edit Module', 'Edit Slate'),
    ('Delete Module', 'Delete Slate'),
    ('Rename Module', 'Rename Slate'),
    ('Dynamic Module', 'Dynamic Slate'),
    ('Custom Module', 'Custom Slate'),
    ('Save Module', 'Save Slate'),
    ('Publish Module', 'Publish Slate'),
    ('module name', 'slate name'),
    ('Module Name', 'Slate Name'),
    ('Module Description', 'Slate Description'),
    ('Module Icon', 'Slate Icon'),
    ('Module Configuration', 'Slate Configuration'),
    ('module_id', 'slate_id'), # Wait, if it's database field module_id, I shouldn't touch it unless asked.
    # Actually, it's safer to just replace UI-facing strings:
    ('No modules', 'No slates'),
    ('My Modules', 'My Slates'),
    ('Modules', 'Slates'),
    ('modules', 'slates')
]

# Better safe replacement approach for UI text only
ui_replacements = [
    ('"Create Module"', '"Create Slate"'),
    ("'Create Module'", "'Create Slate'"),
    ('"Edit Module"', '"Edit Slate"'),
    ("'Edit Module'", "'Edit Slate'"),
    ('>Create Module<', '>Create Slate<'),
    ('>Edit Module<', '>Edit Slate<'),
    ('>Delete Module<', '>Delete Slate<'),
    ('>Rename Module<', '>Rename Slate<'),
    ('"Dynamic Module"', '"Dynamic Slate"'),
    ("'Dynamic Module'", "'Dynamic Slate'"),
    ('"Save Module"', '"Save Slate"'),
    ('"Publish Module"', '"Publish Slate"'),
    ('>Save Module<', '>Save Slate<'),
    ('>Publish Module<', '>Publish Slate<'),
    ('"Module Name"', '"Slate Name"'),
    ('"Module Description"', '"Slate Description"'),
    ('"Module Icon"', '"Slate Icon"'),
    ('"No modules', '"No slates'),
    ('>No modules', '>No slates'),
    ('Manage Modules', 'Manage Slates'),
    ('Manage modules', 'Manage slates'),
    ('"Modules"', '"Slates"'),
    ("'Modules'", "'Slates'"),
    ('>Modules<', '>Slates<')
]

for filename in ['src/pages/CreateModulePage.jsx', 'src/pages/GenericModulePage.jsx', 'src/components/layout/Sidebar.jsx']:
    if not os.path.exists(filename): continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in ui_replacements:
        content = content.replace(old, new)
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print('Replaced UI Module references.')
