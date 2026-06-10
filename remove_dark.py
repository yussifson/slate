import os
import re

dir_path = 'src/pages/marketing'
for filename in os.listdir(dir_path):
    if filename.endswith('.jsx'):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace instances of dark:[a-zA-Z0-9/\-\[\]\.]+
        new_content = re.sub(r'\s*dark:[a-zA-Z0-9/\-\[\]\.]+', '', content)
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Removed dark classes from {filename}")

