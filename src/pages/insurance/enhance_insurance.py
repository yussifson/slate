import os
import re

insurance_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\insurance"

def process_file(path):
    if not os.path.exists(path):
        return
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace legacy colors with insurance
    content = content.replace("indigo-", "insurance-")
    content = content.replace("blue-", "insurance-")
    
    # 2. Inject vibrant insurance gradient background into the outermost div
    # using #9400FF (rgba: 148,0,255)
    gradient_style = ' style={{ background: "linear-gradient(135deg, rgba(148,0,255,0.04) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}'
    
    # Replace `<div className="space-y-6"`
    if 'style={{ background: "linear-gradient' not in content:
        content = re.sub(
            r'(<div className="space-y-[56](?:[^"]*)?")', 
            r'\1' + gradient_style, 
            content, 
            count=1
        )
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for filename in os.listdir(insurance_dir):
    if not filename.endswith(".jsx"): continue
    process_file(os.path.join(insurance_dir, filename))

print("Insurance suite updated with #9400FF brand colors.")
