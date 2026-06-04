import os
import re

hotel_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\hotel"
for filename in os.listdir(hotel_dir):
    if not filename.endswith(".jsx"): continue
    path = os.path.join(hotel_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace amber- and blue- with violet-
    content = content.replace("amber-", "violet-")
    content = content.replace("blue-", "violet-")
    
    # Update primary actions to exact brand color
    content = content.replace("bg-violet-600", "bg-[#443199]")
    content = content.replace("bg-violet-700", "bg-[#362878]")
    
    # Update gradients
    content = content.replace("from-violet-500", "from-[#443199]")
    content = content.replace("from-violet-600", "from-[#443199]")
    content = content.replace("to-violet-700", "to-[#362878]")
    content = content.replace("to-violet-800", "to-[#362878]")
    
    # Add subtle background tint to outermost wrapper
    def replacer(m):
        return m.group(0) + ' style={{ backgroundColor: "rgba(68, 49, 153, 0.03)", minHeight: "100vh" }}'
    
    # Only replace the first occurrence
    content, count = re.subn(r'return\s*\(\s*(?:<>)?\s*<div\s+className="([^"]+)"', replacer, content, count=1)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
