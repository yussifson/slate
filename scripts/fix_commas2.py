import os
import re

count = 0
for root, dirs, files in os.walk('src'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            # clean up trailing comma before closing brace in imports
            new_content = re.sub(r',\s*}', '}', content)
            # clean up leading comma after opening brace
            new_content = re.sub(r'{\s*,', '{', new_content)
            
            if new_content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
print(f"Fixed {count} files")
