import os

filepath = 'src/components/orbitbolt/OrbitBoltWorkspace.jsx'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('"Module Name"', '"Slate Name"')
    content = content.replace('"Module Type"', '"Slate Type"')
    content = content.replace('"Untitled Module"', '"Untitled Slate"')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("OrbitBoltWorkspace.jsx patched")
