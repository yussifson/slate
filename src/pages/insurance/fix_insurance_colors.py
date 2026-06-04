import os
import re

insurance_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\insurance"

def process_file(path):
    if not os.path.exists(path):
        return
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want to replace primary button classes like:
    # bg-emerald-600 hover:bg-emerald-700
    # bg-teal-600 hover:bg-teal-700
    # with bg-insurance-600 hover:bg-insurance-700
    
    content = re.sub(r'bg-(emerald|teal|cyan|red|amber|purple|green|indigo|blue)-600 hover:bg-\1-700', 'bg-insurance-600 hover:bg-insurance-700', content)
    
    # Replace large icon placeholder colors
    content = re.sub(r'w-12 h-12 mx-auto mb-3 opacity-30 text-(emerald|teal|cyan|red|amber|purple|green|indigo|blue)-600', 'w-12 h-12 mx-auto mb-3 opacity-30 text-insurance-600', content)

    # Any lone text-emerald-600 or text-teal-600 that isn't a semantic status?
    # like <p className="font-mono font-bold text-emerald-600">{premium.receiptNumber}</p>
    content = re.sub(r'font-mono font-bold text-(emerald|teal|cyan|red|amber|purple|green|indigo|blue)-600', 'font-mono font-bold text-insurance-600', content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for filename in os.listdir(insurance_dir):
    if not filename.endswith(".jsx"): continue
    process_file(os.path.join(insurance_dir, filename))

print("Insurance suite primary elements standardized to #9400FF brand colors (including emerald/teal).")
