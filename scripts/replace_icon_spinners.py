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

    # Replace <Activity|AlertCircle|Sparkles className="... animate-spin ..." /> if it looks like a loader (has text-center py-10 etc usually, or just replace all animate-spin)
    # Actually, we can just replace anything matching <[A-Za-z]+\s+className=[\'"][^\'"]*animate-spin[^\'"]*[\'"]\s*(?:/>|></[A-Za-z]+>)
    # But ONLY if it's not already OrbitLoader. Wait, OrbitLoader doesn't use animate-spin in the jsx, it's in css.
    
    # We will exclude <Sparkles> because TopBar uses it for a decorative effect (animate-spin-slow, or isAIOpen).
    # Wait, the prompt said "Replace every generic CSS spinner animation... Replace all of them". Let's replace the Universal ones.
    
    def replacer(match):
        full = match.group(0)
        tag = match.group(1)
        if tag in ('Activity', 'AlertCircle', 'Sparkles'):
            # Only replace if it's not a TopBar/GlobalAIAssistant decorative sparkle
            if 'text-white' in full and 'w-3.5' in full:
                return full # AI button Sparkles
            if 'isAIOpen' in full or 'animate-spin-slow' in full:
                return full # Decorative
            
            nonlocal has_replacement
            has_replacement = True
            size = "md" if ('w-8' in full or 'w-10' in full or 'w-12' in full) else "sm"
            return f'<OrbitLoader size="{size}" />'
        return full

    content = re.sub(r'<([A-Za-z0-9]+)[^>]*?animate-spin[^>]*?/>', replacer, content)

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
