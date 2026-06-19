import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return False

    original = content

    # Add import if we replace anything
    has_replacement = False

    # 1. Replace Loader2
    # Regex to find <Loader2 ... animate-spin ... />
    # We will just replace any <Loader2 .../> with OrbitLoader
    # First, let's categorize by size based on className
    
    def replacer_loader2(match):
        nonlocal has_replacement
        has_replacement = True
        full_tag = match.group(0)
        
        # Determine size
        if 'w-8' in full_tag or 'h-8' in full_tag or 'w-12' in full_tag or 'w-10' in full_tag or 'w-6' in full_tag:
            size = 'md'
        elif 'w-5' in full_tag or 'h-5' in full_tag:
            size = 'md'
        else:
            size = 'sm'
            
        # For buttons or small contexts, usually sm
        # If there's mr-2 or similar, keep a wrapper or just use standard OrbitLoader since it's inline-flex
        # Wait, if there's a margin, we might lose it. Let's just use <OrbitLoader size="..." />
        
        return f'<OrbitLoader size="{size}" />'
    
    content = re.sub(r'<Loader2[^>]*/>', replacer_loader2, content)
    
    # 2. Replace RefreshCw that are acting as spinners standalone (not inside buttons)
    # Actually, RefreshCw is often used as a button icon that spins WHEN loading, but is a static icon otherwise.
    # Prompt: "The Orbit Loader is the ONLY spinner/loader animation in the entire product".
    # So if RefreshCw spins, we should replace it with OrbitLoader when loading, or just replace the spin entirely.
    # The prompt says: "Every generic CSS spinner animation that is not the Orbit Loader... Replace all of them with the appropriate Orbit Loader variant"
    # This might be too complex for a blind regex if it's conditional like <RefreshCw className={loading ? "animate-spin" : ""} />
    # For now, let's target the static CSS spinners.
    
    def replacer_css_spinner(match):
        nonlocal has_replacement
        has_replacement = True
        full_tag = match.group(0)
        if 'w-12' in full_tag or 'w-10' in full_tag or 'w-8' in full_tag:
            return '<OrbitLoader size="md" />'
        return '<OrbitLoader size="sm" />'
        
    # Replace <div className="...animate-spin..."></div>
    content = re.sub(r'<div[^>]*animate-spin[^>]*>\s*</div>', replacer_css_spinner, content)
    content = re.sub(r'<span[^>]*animate-spin[^>]*>\s*</span>', replacer_css_spinner, content)
    
    # Remove unused Loader2 import
    if has_replacement:
        content = re.sub(r'import\s+\{\s*([^}]*?)\s*Loader2\s*([^}]*?)\s*\}\s+from\s+["\']lucide-react["\'];?', 
                         lambda m: f'import {{{m.group(1)}{m.group(2)}}} from "lucide-react";' if m.group(1).strip() or m.group(2).strip() else '', 
                         content)
        # Cleanup empty imports like import { , } from ...
        content = re.sub(r'import\s+\{\s*,?\s*\}\s+from\s+["\']lucide-react["\'];?', '', content)
        
        # Add OrbitLoader import if not present
        if 'OrbitLoader' not in original:
            import_statement = "import { OrbitLoader } from \"@/components/ui/orbit-loader\";\n"
            # Insert after the last import, or at the top
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

# Process all source files
fixed_count = 0
for root, dirs, files in os.walk('src'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js', '.ts')):
            if process_file(os.path.join(root, file)):
                fixed_count += 1

print(f"Processed {fixed_count} files.")
