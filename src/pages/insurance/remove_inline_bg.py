import os
import re

insurance_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\insurance"

def process_file(path):
    if not os.path.exists(path):
        return
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove the inconsistent inline background styles added previously
    content = content.replace(
        ' style={{ background: "linear-gradient(135deg, rgba(148,0,255,0.04) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}', 
        ''
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for filename in os.listdir(insurance_dir):
    if not filename.endswith(".jsx"): continue
    process_file(os.path.join(insurance_dir, filename))

print("Inconsistent inline backgrounds removed from Insurance suite.")
