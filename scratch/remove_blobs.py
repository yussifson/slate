import os
import re

def remove_blobs(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove large background blur divs
    pattern1 = re.compile(r'\s*<div[^>]*bg-primary/\d+\s+blur-\[\d+px\][^>]*></div>')
    pattern2 = re.compile(r'\s*<div[^>]*bg-gradient-to-\w+\s+from-primary/\d+[^>]*></div>')
    pattern3 = re.compile(r'\s*<div[^>]*bg-primary/\d+\s+blur-\[\d+px\][^>]*\s*/>')
    
    new_content = pattern1.sub('', content)
    new_content = pattern2.sub('', new_content)
    new_content = pattern3.sub('', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            remove_blobs(os.path.join(root, file))
