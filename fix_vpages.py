import os
import glob

files = glob.glob('src/pages/vocational/V*.jsx')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace the double braces that were incorrectly added
    content = content.replace("{{", "{").replace("}}", "}")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print(f"Fixed {len(files)} files.")
