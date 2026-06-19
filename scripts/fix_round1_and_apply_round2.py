import os
import re

# ============================================================
# PHASE 0: Fix Round 1 corrupted rounded classes
# The Round 1 script's \brounded\b regex also matched compound
# classes like rounded-full, rounded-xl etc, producing invalid
# classes like rounded-md-full, rounded-md-xl, rounded-md-sm
# ============================================================

ROUND1_FIXES = {
    'rounded-md-full': 'rounded-full',
    'rounded-md-xl': 'rounded-xl',
    'rounded-md-2xl': 'rounded-2xl',
    'rounded-md-3xl': 'rounded-3xl',
    'rounded-md-sm': 'rounded-sm',
    'rounded-md-r-full': 'rounded-r-full',
    'rounded-md-l-full': 'rounded-l-full',
    'rounded-md-t-full': 'rounded-t-full',
    'rounded-md-b-full': 'rounded-b-full',
    'rounded-md-tl': 'rounded-tl',
    'rounded-md-tr': 'rounded-tr',
    'rounded-md-bl': 'rounded-bl',
    'rounded-md-br': 'rounded-br',
    'rounded-md-t-xl': 'rounded-t-xl',
    'rounded-md-b-xl': 'rounded-b-xl',
    'rounded-md-t-lg': 'rounded-t-lg',
    'rounded-md-b-lg': 'rounded-b-lg',
    'rounded-md-l-xl': 'rounded-l-xl',
    'rounded-md-r-xl': 'rounded-r-xl',
    'rounded-md-none': 'rounded-none',
    'rounded-md-t-none': 'rounded-t-none',
    'rounded-md-b-none': 'rounded-b-none',
}

def fix_round1_bugs(content):
    """Fix corrupted rounded classes from Round 1"""
    for broken, fixed in ROUND1_FIXES.items():
        content = content.replace(broken, fixed)
    return content

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return False

    original = content

    # Phase 0: Fix Round 1 bugs
    content = fix_round1_bugs(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all source files
fixed_count = 0
for root, dirs, files in os.walk('src'):
    # Skip node_modules
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js', '.ts', '.css')):
            if process_file(os.path.join(root, file)):
                fixed_count += 1

print(f"Phase 0: Fixed Round 1 bugs in {fixed_count} files")
