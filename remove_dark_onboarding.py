import os
import re

filepath = 'src/pages/OnboardingWizard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all dark: classes (e.g. dark:bg-slate-900/40, dark:text-slate-100)
content = re.sub(r'\s*dark:[a-zA-Z0-9/\-\[\]\.]+', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done removing dark classes from OnboardingWizard.")
