import re

filepath = 'src/pages/OnboardingWizard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace steps array
content = content.replace("const steps = [\n    { num: 1, title: 'Profile' },\n    { num: 2, title: 'Setup' },\n    { num: 3, title: 'Team' },\n    { num: 4, title: 'Launch' }\n  ];", "const steps = [\n    { num: 1, title: 'Setup Mode' },\n    { num: 2, title: 'Profile' },\n    { num: 3, title: 'Team' },\n    { num: 4, title: 'Launch' }\n  ];")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Steps updated")
