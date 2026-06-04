"""
School Suite Ivy League / Silicon Valley UI Enhancement Script
Sweeps through all 26 school pages and upgrades Tailwind classes
to the premium blue & white aesthetic.
ONLY touches src/pages/school/*.jsx
"""
import os
import re

school_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\school"
files_changed = 0

def enhance_file(path):
    global files_changed
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # ================================================================
    # 1. OUTER PAGE WRAPPER — add entrance animation class
    # ================================================================
    # Match the first <div className="space-y-6"> or similar page wrapper
    content = re.sub(
        r'<div className="space-y-6">',
        '<div className="space-y-6 school-page-enter font-dmsans">',
        content,
        count=1
    )

    # ================================================================
    # 2. PRIMARY ACTION BUTTONS — emerald/blue/indigo/purple -> navy
    # ================================================================
    # bg-emerald-600 hover:bg-emerald-700 text-white
    content = re.sub(
        r'bg-emerald-600 hover:bg-emerald-700 text-white',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    # bg-[#1A73E8] hover:bg-[#1557B0] (from previous script)
    content = re.sub(
        r'bg-\[#1A73E8\] hover:bg-\[#1557B0\] text-white shadow-md shadow-\[#1A73E8\]/20 transition-all hover:-translate-y-0\.5 rounded-xl font-semibold',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    # bg-blue-600 hover:bg-blue-700 text-white
    content = re.sub(
        r'bg-blue-600 hover:bg-blue-700 text-white',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    # bg-indigo-600 hover:bg-indigo-700 text-white
    content = re.sub(
        r'bg-indigo-600 hover:bg-indigo-700 text-white',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    # bg-purple-600 hover:bg-purple-700 text-white
    content = re.sub(
        r'bg-purple-600 hover:bg-purple-700 text-white',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )
    # bg-green-600 hover:bg-green-700 text-white
    content = re.sub(
        r'bg-green-600 hover:bg-green-700 text-white',
        'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold',
        content
    )

    # ================================================================
    # 3. CARDS — frosted glass upgrade
    # ================================================================
    # Standard card: bg-card rounded-xl border border-border shadow-sm (and previous variants)
    content = re.sub(
        r'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] dark:shadow-\[0_8px_30px_rgb\(0,0,0,0\.1\)\] overflow-hidden',
        'school-card',
        content
    )
    content = re.sub(
        r'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] dark:shadow-\[0_8px_30px_rgb\(0,0,0,0\.1\)\] transition-all hover:shadow-\[0_8px_30px_rgb\(0,0,0,0\.08\)\]',
        'school-card p-5',
        content
    )
    content = re.sub(
        r'bg-card rounded-xl border border-border p-4 shadow-sm',
        'school-card p-5',
        content
    )
    content = re.sub(
        r'bg-card rounded-xl border border-border shadow-sm overflow-hidden',
        'school-card overflow-hidden',
        content
    )
    content = re.sub(
        r'bg-card rounded-xl border border-border shadow-sm',
        'school-card',
        content
    )

    # ================================================================
    # 4. TYPOGRAPHY — headings to Playfair
    # ================================================================
    # text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white (from previous script)
    content = re.sub(
        r'text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white',
        'text-2xl school-heading font-extrabold tracking-tight',
        content
    )
    content = re.sub(
        r'text-2xl font-bold text-card-foreground',
        'text-2xl school-heading font-extrabold tracking-tight',
        content
    )
    content = re.sub(
        r'text-xl font-bold text-card-foreground',
        'text-xl school-heading font-bold tracking-tight',
        content
    )

    # ================================================================
    # 5. MODAL DIALOGS — frosted glass treatment
    # ================================================================
    content = re.sub(
        r'bg-card rounded-2xl shadow-sm',
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#1E3A8A]/10',
        content
    )
    content = re.sub(
        r'bg-black/40 backdrop-blur-sm',
        'bg-black/30 backdrop-blur-md',
        content
    )

    # ================================================================
    # 6. EMERALD ACCENT COLORS — replace with school navy/blue
    # ================================================================
    # text-emerald-600 -> text-[#1E3A8A]
    content = re.sub(r'text-emerald-600(?![\w-])', 'text-[#1E3A8A] dark:text-blue-400', content)
    content = re.sub(r'text-emerald-700(?![\w-])', 'text-[#1E3A8A] dark:text-blue-400', content)
    # bg-emerald-50 -> bg-[#F0F4FF]
    content = re.sub(r'bg-emerald-50(?![\w-])', 'bg-[#F0F4FF] dark:bg-blue-900/20', content)
    # border-emerald -> border-blue
    content = re.sub(r'border-blue-100 dark:border-blue-900/30', 'border-blue-100 dark:border-blue-800', content)

    # ================================================================
    # 7. PURPLE REFERENCES — replace with school navy/blue
    # ================================================================
    # text-purple-700 -> text-[#1E3A8A]
    content = re.sub(r'text-purple-700(?![\w-])', 'text-[#1E3A8A] dark:text-blue-300', content)
    content = re.sub(r'text-purple-600(?![\w-])', 'text-[#1E3A8A] dark:text-blue-400', content)
    # bg-purple-50 -> bg-[#F0F4FF]
    content = re.sub(r'bg-purple-50(?![\w-])', 'bg-[#F0F4FF] dark:bg-blue-900/20', content)
    # bg-purple-100 -> bg-blue-50
    content = re.sub(r'bg-purple-100(?![\w-])', 'bg-blue-50 dark:bg-blue-900/30', content)

    # ================================================================
    # 8. ACTIVE TAB STATES — use blue border & text
    # ================================================================
    content = re.sub(
        r"border-blue-600 text-emerald-600",
        "border-[#1E3A8A] text-[#1E3A8A] dark:border-blue-400 dark:text-blue-400",
        content
    )
    content = re.sub(
        r"border-blue-600 text-\[#1E3A8A\] dark:text-blue-400",
        "border-[#1E3A8A] text-[#1E3A8A] dark:border-blue-400 dark:text-blue-400",
        content
    )

    # ================================================================
    # 9. FORM AREA TINTS — from green/emerald to blue  
    # ================================================================
    content = re.sub(
        r'bg-emerald-50/50 dark:bg-blue-900/10',
        'bg-[#F0F4FF]/50 dark:bg-blue-900/10',
        content
    )
    content = re.sub(
        r'bg-\[#F0F4FF\] dark:bg-blue-900/20/50 dark:bg-blue-900/10',
        'bg-[#F0F4FF]/50 dark:bg-blue-900/10',
        content
    )

    # ================================================================
    # 10. STUDENT AVATAR COLORS  
    # ================================================================
    content = re.sub(
        r'bg-blue-100 flex items-center justify-center text-emerald-700',
        'bg-[#F0F4FF] dark:bg-blue-900/30 flex items-center justify-center text-[#1E3A8A] dark:text-blue-300',
        content
    )
    content = re.sub(
        r'bg-blue-100 flex items-center justify-center text-\[#1E3A8A\] dark:text-blue-400',
        'bg-[#F0F4FF] dark:bg-blue-900/30 flex items-center justify-center text-[#1E3A8A] dark:text-blue-300',
        content
    )

    # ================================================================
    # 11. STATUS BADGE ACTIVE — was blue-100/emerald-700
    # ================================================================
    content = re.sub(
        r"'bg-blue-100 text-emerald-700'",
        "'bg-blue-50 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-300'",
        content
    )
    content = re.sub(
        r"'bg-blue-100 text-\[#1E3A8A\] dark:text-blue-400'",
        "'bg-blue-50 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-300'",
        content
    )

    # ================================================================
    # 12. CLASS LINK BADGES  
    # ================================================================
    content = re.sub(
        r'bg-\[#F0F4FF\] dark:bg-blue-900/20 text-\[#1E3A8A\] dark:text-blue-400',
        'bg-[#F0F4FF] dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-300',
        content
    )

    # ================================================================
    # 13. TABLE HEADER — was bg-muted
    # ================================================================
    content = re.sub(
        r'bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800',
        'bg-[#F0F4FF]/60 dark:bg-slate-800/40 border-b border-blue-100 dark:border-slate-700',
        content
    )
    content = re.sub(
        r'className="bg-muted border-b border-border"',
        'className="bg-[#F0F4FF]/60 dark:bg-slate-800/40 border-b border-blue-100 dark:border-slate-700"',
        content
    )

    # ================================================================
    # 14. EMPTY STATE ICONS — use school blue
    # ================================================================
    content = re.sub(
        r'opacity-20 text-\[#1A73E8\]',
        'opacity-20 text-[#1E3A8A]',
        content
    )
    content = re.sub(
        r'opacity-30 text-blue-600',
        'opacity-20 text-[#1E3A8A]',
        content
    )

    # ================================================================
    # 15. SEARCH INPUT — premium styling
    # ================================================================
    content = re.sub(
        r'pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-\[#1A73E8\]',
        'pl-9 bg-white/80 dark:bg-slate-800/50 border-blue-100 dark:border-slate-700 rounded-xl focus-visible:ring-[#3B82F6]',
        content
    )

    # ================================================================  
    # 16. INLINE STYLE BACKGROUNDS — remove any old ones
    # ================================================================
    content = content.replace(
        ' style={{ background: "linear-gradient(135deg, rgba(148,0,255,0.04) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}',
        ''
    )

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        files_changed += 1
        print(f"  ✅ Enhanced: {os.path.basename(path)}")
    else:
        print(f"  ⏭️  No changes: {os.path.basename(path)}")

print("🎓 School Suite Ivy League Enhancement Script")
print("=" * 50)

for filename in sorted(os.listdir(school_dir)):
    if not filename.endswith(".jsx"):
        continue
    enhance_file(os.path.join(school_dir, filename))

print("=" * 50)
print(f"🏛️  Done! Enhanced {files_changed} files.")
