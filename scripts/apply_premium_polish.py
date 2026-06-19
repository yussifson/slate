import os
import re

# 1. Update index.css
INDEX_CSS_PATH = "src/index.css"

with open(INDEX_CSS_PATH, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Add body antialiased and line-height
if "-webkit-font-smoothing: antialiased" not in css_content:
    css_content = css_content.replace(
        "body {\n    @apply bg-background text-foreground font-inter relative min-h-screen;",
        "body {\n    @apply bg-background text-foreground font-inter relative min-h-screen;\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n    line-height: 1.6;"
    )

# Append global rules if not already present
global_rules = """
/* PREMIUM UI POLISH GLOBAL STYLES */

/* Focus States */
*:focus-visible {
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(25, 184, 110, 0.15) !important;
}

.dark *:focus-visible {
  box-shadow: 0 0 0 3px rgba(31, 224, 134, 0.15) !important;
}

/* Button Refinements */
button {
  transition: opacity 150ms ease, transform 150ms ease, background 150ms ease, border-color 150ms ease !important;
}
button:active {
  transform: translateY(0) !important;
  opacity: 1 !important;
}
button[class*="bg-primary"]:hover, button[class*="bg-blue"]:hover, button[class*="primary"]:hover {
  opacity: 0.92 !important;
  transform: translateY(-1px) !important;
}

/* Input Refinements */
input, select, textarea {
  transition: border-color 150ms ease, box-shadow 150ms ease !important;
}
input:focus, select:focus, textarea:focus {
  box-shadow: 0 0 0 3px rgba(25, 184, 110, 0.12) !important;
  border-color: rgba(25, 184, 110, 0.5) !important;
  outline: none !important;
}
.dark input:focus, .dark select:focus, .dark textarea:focus {
  box-shadow: 0 0 0 3px rgba(31, 224, 134, 0.12) !important;
  border-color: rgba(31, 224, 134, 0.5) !important;
}

/* Interactive Rows and Lists */
tr:not(:has(th)), li, [class*="card"][role="button"], a[class*="card"] {
  transition: background 120ms ease !important;
}
tr:not(:has(th)):hover, li:hover, [class*="card"][role="button"]:hover, a[class*="card"]:hover {
  background: rgba(0,0,0,0.02);
}
.dark tr:not(:has(th)):hover, .dark li:hover, .dark [class*="card"][role="button"]:hover, .dark a[class*="card"]:hover {
  background: rgba(255,255,255,0.03);
}

/* Animations */
@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.97) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes dropdown-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

[role="dialog"], .modal-content, [class*="Modal"] {
  animation: modal-enter 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

[role="menu"], .dropdown-content, [class*="DropdownMenu"] {
  animation: dropdown-enter 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

"""

if "PREMIUM UI POLISH GLOBAL STYLES" not in css_content:
    # Also adjust the scrollbar code that is already there
    # It has ::-webkit-scrollbar { width: 8px; height: 8px; }
    # Let's replace it with the new rules
    
    css_content = re.sub(
        r'::-webkit-scrollbar \{[^}]+\}',
        '::-webkit-scrollbar { width: 5px; height: 5px; }',
        css_content
    )
    
    css_content = re.sub(
        r'::-webkit-scrollbar-track \{[^}]+\}',
        '::-webkit-scrollbar-track { background: transparent; }',
        css_content
    )
    
    css_content = re.sub(
        r'::-webkit-scrollbar-thumb \{[^}]+\}',
        '::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 999px; }',
        css_content
    )
    
    css_content = re.sub(
        r'::-webkit-scrollbar-thumb:hover \{[^}]+\}',
        '::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }',
        css_content
    )
    
    css_content += "\n\n" + global_rules
    
    # Add dark mode scrollbar inside dark class
    if ".dark {" in css_content and "rgba(255,255,255,0.12)" not in css_content:
        dark_scrollbars = """
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
"""
        css_content = css_content.replace(".dark {", f".dark {{\n{dark_scrollbars}")

with open(INDEX_CSS_PATH, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Updated index.css")

# 2. Process all JSX/TSX files
def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content

    # 1. Typography
    # font-weight: 700 to 600
    content = re.sub(r'\bfont-bold\b', 'font-semibold', content)
    content = content.replace('font-[700]', 'font-[600]')
    
    def inject_class(match, cls_to_inject):
        cls_str = match.group(0)
        if cls_to_inject not in cls_str:
            return cls_str[:-1] + f" {cls_to_inject}" + cls_str[-1]
        return cls_str

    content = re.sub(r'className=["\'][^"\']*\btext-(?:2xl|3xl|4xl|5xl|6xl)\b[^"\']*["\']', 
                     lambda m: inject_class(m, "tracking-[-0.02em]"), content)
    
    content = re.sub(r'className=["\'][^"\']*\b(?:uppercase|text-xs)\b[^"\']*["\']', 
                     lambda m: inject_class(m, "tracking-[0.04em]"), content)

    content = re.sub(r'\btext-muted-foreground\b', 'text-[#71717a] dark:text-gray-400', content)
    content = re.sub(r'\btext-gray-500\b', 'text-[#71717a] dark:text-gray-400', content)

    # 2. Borders
    content = re.sub(r'\bborder-gray-200\b', 'border-[0.5px] border-black/9 dark:border-white/8', content)
    content = re.sub(r'\bborder-gray-300\b', 'border-[0.5px] border-black/9 dark:border-white/8', content)
    content = re.sub(r'\bborder-border\b', 'border-[0.5px] border-black/9 dark:border-white/8', content)
    content = re.sub(r'\bborder \b', 'border-[0.5px] border-black/9 dark:border-white/8 ', content)

    # 3. Border Radius
    content = re.sub(r'\brounded-lg\b', 'TEMP_ROUNDED_XL', content)
    content = re.sub(r'\brounded-md\b', 'TEMP_ROUNDED_LG', content)
    content = re.sub(r'\brounded\b', 'TEMP_ROUNDED_MD', content)
    
    content = content.replace('TEMP_ROUNDED_XL', 'rounded-xl')
    content = content.replace('TEMP_ROUNDED_LG', 'rounded-lg')
    content = content.replace('TEMP_ROUNDED_MD', 'rounded-md')
    
    content = content.replace('rounded-[10px]', 'rounded-xl')
    
    # 4. Shadows
    content = re.sub(r'\bshadow-md\b', 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]', content)
    content = re.sub(r'\bshadow-lg\b', 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]', content)
    content = re.sub(r'\bshadow\b', 'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]', content)

    content = re.sub(r'className=["\'][^"\']*\b(?:card|glass-card|bg-card|bg-white)\b[^"\']*["\']', 
                     lambda m: inject_class(m, "hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"), content)

    # 10. Spacing micro-adjustments
    content = re.sub(r'\bgap-1\b', 'gap-1.5', content)
    content = re.sub(r'\bgap-1.5\b', 'gap-2', content)

    # 11. Status Badges
    colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'emerald', 'indigo']
    for c in colors:
        content = re.sub(rf'\bbg-{c}-500\b', f'bg-{c}-500/10', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

modified_count = 0
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js', '.ts')):
            if process_file(os.path.join(root, file)):
                modified_count += 1

print(f"Modified {modified_count} files in src/ directory.")
