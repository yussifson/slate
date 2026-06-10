import os

filepath = 'src/pages/CreateModulePage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('>Module Details<', '>Slate Details<'),
    ('>Module Name<', '>Slate Name<'),
    ('>Module Type<', '>Slate Type<'),
    ('"Untitled Module"', '"Untitled Slate"'),
    ('>Untitled Module<', '>Untitled Slate<'),
    ('what this module tracks...', 'what this slate tracks...'),
    ('>Module Builder<', '>Slate Builder<'),
    ('"Update Module"', '"Update Slate"'),
    ('"Module Name and at least 1 field are required."', '"Slate Name and at least 1 field are required."'),
    ('"Failed to save module."', '"Failed to save slate."'),
    ('"Review and customize your module, then publish."', '"Review and customize your slate, then publish."'),
    ('>Add fields or use OrbitBolt to generate your module<', '>Add fields or use OrbitBolt to generate your slate<'),
    ('generating modules', 'generating slates')
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("CreateModulePage.jsx UI text patched")
