import os

replacements = [
    ('/modules/BOLT', '/slate/BOLT'),
    ('/modules/create', '/slate/create'),
    ('/modules/edit', '/slate/edit'),
    ("path: '/modules", "path: '/slate")
]

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.tsx', '.ts')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                    
                if content != new_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated routing strings in {filepath}')
            except:
                pass
