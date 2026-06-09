import os
import re

def get_files():
    files_to_process = []
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                files_to_process.append(os.path.join(root, file))
    return files_to_process

def safe_replace(text):
    pattern = re.compile(r'\b(workspace|module|optalflow)s?\b', re.IGNORECASE)
    
    def replacer(match):
        word = match.group(0)
        lower_word = word.lower()
        original_word = word
        
        # Replacement map
        if lower_word.startswith('workspace'):
            base = 'workslate'
        elif lower_word.startswith('module'):
            base = 'slate'
        elif lower_word.startswith('optalflow'):
            base = 'slate'
            
        # Pluralization
        is_plural = lower_word.endswith('s')
        if is_plural:
            base += 's'
            
        # Case matching
        if original_word.isupper():
            rep = base.upper()
        elif original_word.istitle():
            rep = base.capitalize()
        else:
            rep = base
            
        # Context check
        start = match.start()
        end = match.end()
        preceding = text[max(0, start-20):start]
        following = text[end:min(len(text), end+20)]
        
        # Exclude CSS classes
        if (preceding and preceding[-1] == '-') or (following and following[0] == '-'):
            return original_word
            
        # Exclude object properties / methods
        if (preceding and preceding[-1] == '.') or (following and following[0] == '.'):
            return original_word
            
        # Exclude paths
        if (preceding and preceding[-1] == '/') or (following and following[0] == '/'):
            return original_word
            
        # Exclude imports
        if 'import ' in preceding or 'from ' in preceding:
            return original_word
            
        # Exclude HTML/JSX tags
        if (preceding and preceding[-1] in ('<', '/')) or (following and following[0] == '='):
            return original_word
            
        # Exclude if it looks like a variable declaration or function parameter
        if re.search(r'\b(const|let|var|class|function)\s+$', preceding):
            return original_word
            
        # Exclude if inside className="..."
        last_class_idx = preceding.rfind('className=')
        if last_class_idx != -1:
            quote_char = text[start - len(preceding) + last_class_idx + 10]
            if preceding.find(quote_char, last_class_idx + 11) == -1:
                return original_word
                
        # Exclude if it's an exact parameter being passed: e.g., `setWorkspace(workspace)`
        # or it's standalone variable like `value={workspace}`
        if preceding.endswith('{') and following.startswith('}'):
            return original_word
        if preceding.endswith('(') and following.startswith(')'):
            return original_word
            
        # Also exclude object keys like `workspace: `
        if following.startswith(':'):
            return original_word
            
        # Exclude React Hook usages like `useModule` or `ModuleProvider` which wouldn't have boundaries, 
        # but what about exact strings in code logic like `type === 'workspace'`?
        # That might be OK to replace if it's UI driven, but risky.
        # We will allow it for now since the user said "wherever you see...".
        
        return rep

    return pattern.sub(replacer, text)

count = 0
for f in get_files():
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        new_content = safe_replace(content)
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            count += 1
            print(f"Updated {f}")
    except UnicodeDecodeError:
        print(f"Skipping {f} due to encoding issue")

print(f"Done. Updated {count} files.")
