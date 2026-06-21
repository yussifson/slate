import os
import re
import json

src_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src"
output_dir = os.path.join(src_dir, "locales", "en")
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "translation.json")

# Match t("key", "Default value") or t('key', 'Default value')
pattern_with_default = re.compile(r't\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*[\'"]([^\'"]+)[\'"]\s*\)')
pattern_key_only = re.compile(r't\(\s*[\'"]([^\'"]+)[\'"]\s*\)')

translations = {}

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    for match in pattern_with_default.findall(content):
                        key, default_val = match
                        translations[key] = default_val
                        
                    for match in pattern_key_only.findall(content):
                        key = match
                        if key not in translations:
                            translations[key] = key
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(translations, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(translations)} strings to {output_file}")
