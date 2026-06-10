import re
with open('src/pages/marketing/Home.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove shadow-2xl from the first wrapper (video modal or something)
content = re.sub(r'rounded-\[2rem\] shadow-2xl overflow-hidden', 'rounded-[2rem] overflow-hidden', content)

# Remove shadow-2xl from hero image wrapper
content = re.sub(r'bg-slate-50 shadow-2xl overflow-hidden', 'bg-slate-50 overflow-hidden', content)

# Remove shadow-2xl from Meet Orbit AI image wrapper
content = re.sub(r'bg-white shadow-2xl overflow-hidden', 'bg-white overflow-hidden', content)

with open('src/pages/marketing/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
