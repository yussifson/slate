import re
import sys

def fix_imports(file):
    with open(file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    orig = text
    
    # Remove any supabase import
    text = re.sub(r"import\s+.*?supabase.*?from\s+['\"].*?['\"];?\n", "", text)

    # Ensure db import
    if "import { powerSync as db }" not in text:
        text = re.sub(r"(import React.*?;\n)", r"\1\nimport { powerSync as db } from '@/api/PowerSyncConnector';\n", text, count=1)

    if text != orig:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(text)

for f in sys.argv[1:]:
    fix_imports(f)
