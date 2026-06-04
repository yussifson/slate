import os
import re

school_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\school"

def enhance_file(path):
    if not os.path.exists(path):
        return
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content

    # Enhance standard cards to Silicon Valley style floating cards
    content = re.sub(
        r'bg-card rounded-xl border border-border p-4 shadow-sm',
        r'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        content
    )
    
    # Enhance slightly different card variants
    content = re.sub(
        r'bg-card rounded-xl border border-border shadow-sm',
        r'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden',
        content
    )

    # Enhance Main Page Headers
    content = re.sub(
        r'text-2xl font-bold text-card-foreground',
        r'text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white',
        content
    )
    
    # Enhance standard primary buttons
    content = re.sub(
        r'bg-blue-600 hover:bg-blue-700 text-white',
        r'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-md shadow-[#1A73E8]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    content = re.sub(
        r'bg-indigo-600 hover:bg-indigo-700 text-white',
        r'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-md shadow-[#1A73E8]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    content = re.sub(
        r'bg-emerald-600 hover:bg-emerald-700 text-white',
        r'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-md shadow-[#1A73E8]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    content = re.sub(
        r'bg-purple-600 hover:bg-purple-700 text-white',
        r'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-md shadow-[#1A73E8]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )

    # Enhance Search inputs to look premium
    content = re.sub(
        r'pl-9 bg-card',
        r'pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-[#1A73E8]',
        content
    )
    
    # Enhance standard icons in empty states or metrics to Google Blue
    content = re.sub(
        r'opacity-30 text-(blue|indigo|purple|emerald)-600',
        r'opacity-20 text-[#1A73E8]',
        content
    )

    # Make table headers look cleaner
    content = re.sub(
        r'bg-card border-b border-border',
        r'bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800',
        content
    )

    if content != original_content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

for filename in os.listdir(school_dir):
    if not filename.endswith(".jsx"): continue
    process_file = os.path.join(school_dir, filename)
    enhance_file(process_file)

print("School suite UI enhancements applied successfully.")
