filepath = 'src/pages/OnboardingWizard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The main outer container
content = content.replace('bg-[#f8fafc]', 'bg-background')

# The big blurry decorative balls
content = content.replace('bg-slate-100 rounded-full blur-3xl', 'bg-primary/20 rounded-full blur-3xl')

# The main card border
content = content.replace('sm:border border-slate-100', 'sm:border border-border')

# Header separator
content = content.replace('border-b border-slate-100 shrink-0', 'border-b border-border shrink-0')

# Progress indicator line
content = content.replace('h-1 bg-slate-100', 'h-1 bg-muted')

# Step circle borders
content = content.replace('ring-4 ring-white', 'ring-4 ring-background')
content = content.replace('bg-slate-100 text-slate-400 border-2 border-slate-100', 'bg-muted text-muted-foreground border-2 border-border')

# Team section
content = content.replace('border-slate-100 space-y-4', 'border-border space-y-4')

# Footer
content = content.replace('border-t border-slate-100', 'border-t border-border')

# Setup Mode cards
content = content.replace('bg-white dark:bg-slate-900/40', 'bg-card')
content = content.replace('border-slate-200', 'border-border')
content = content.replace('bg-slate-50 ', 'bg-muted/30 ')
content = content.replace('bg-slate-50/50', 'bg-muted/30')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OnboardingWizard fully patched")
