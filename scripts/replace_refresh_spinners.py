import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return False

    original = content
    has_replacement = False

    # 1. Replace <RefreshCw className={`... ${VAR ? 'animate-spin' : ''}`} />
    # Matches <RefreshCw className={`... ${refreshing ? "animate-spin" : ""} ...`} />
    def replace_refresh_conditional(match):
        nonlocal has_replacement
        has_replacement = True
        full = match.group(0)
        # Extract the condition variable, e.g., 'refreshing' or 'loading' or 'isRefreshing'
        cond_match = re.search(r'\$\{([^}]+)\s*\?\s*[\'"]animate-spin[\'"]', full)
        if cond_match:
            condition = cond_match.group(1).strip()
            # Extract size to preserve in the non-loading state
            size_match = re.search(r'w-\d+ h-\d+', full)
            size_class = size_match.group(0) if size_match else 'w-4 h-4'
            return f'{{ {condition} ? <OrbitLoader size="sm" /> : <RefreshCw className="{size_class}" /> }}'
        return full

    # Replace <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
    def replace_refresh_simple_cond(match):
        nonlocal has_replacement
        has_replacement = True
        full = match.group(0)
        cond_match = re.search(r'\{([^}]+)\s*\?\s*[\'"]animate-spin[\'"]', full)
        if cond_match:
            condition = cond_match.group(1).strip()
            size = "sm"
            if "size={32}" in full: size = "md"
            return f'{{ {condition} ? <OrbitLoader size="{size}" /> : <RefreshCw className="w-4 h-4" /> }}'
        return full

    # Replace <RefreshCw className="... animate-spin ..." /> (static spin)
    def replace_refresh_static(match):
        nonlocal has_replacement
        has_replacement = True
        full = match.group(0)
        if "animate-spin" in full and "${" not in full and "?" not in full:
            size = "sm"
            if 'w-8' in full or 'size={32}' in full: size = "md"
            return f'<OrbitLoader size="{size}" />'
        return full

    content = re.sub(r'<RefreshCw\s+className=\{`[^`]*\$\{[^}]+\s*\?\s*[\'"]animate-spin[\'"][^}]*\}[^`]*`\}\s*/>', replace_refresh_conditional, content)
    content = re.sub(r'<RefreshCw\s+(?:size=\{\d+\}\s+)?className=\{[^}]+\s*\?\s*[\'"]animate-spin[\'"][^}]*\}\s*(?:size=\{\d+\}\s+)?/>', replace_refresh_simple_cond, content)
    content = re.sub(r'<RefreshCw\s+(?:size=\{\d+\}\s+)?className=[\'"][^\'"]*animate-spin[^\'"]*[\'"]\s*(?:size=\{\d+\}\s+)?/>', replace_refresh_static, content)

    # 2. Add OrbitLoader import if not present
    if has_replacement and 'OrbitLoader' not in content:
        import_statement = "import { OrbitLoader } from \"@/components/ui/orbit-loader\";\n"
        last_import = content.rfind('import ')
        if last_import != -1:
            end_of_line = content.find('\n', last_import)
            content = content[:end_of_line+1] + import_statement + content[end_of_line+1:]
        else:
            content = import_statement + content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

fixed_count = 0
for root, dirs, files in os.walk('src'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js', '.ts')):
            if process_file(os.path.join(root, file)):
                fixed_count += 1

print(f"Processed {fixed_count} files.")
