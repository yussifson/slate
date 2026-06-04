import os
import re

directories = [
    r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\highschool",
    r"c:\Users\USER\OneDrive\Documents\airflake\src\components\school",
]
additional_files = [
    r"c:\Users\USER\OneDrive\Documents\airflake\src\components\dashboard\SchoolDashboard.jsx"
]

def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Replace emerald with purple
    content = content.replace("emerald-", "purple-")
    
    # 2. Inject exact #6F00FF where appropriate (buttons, text, etc)
    content = content.replace("bg-purple-600", "bg-[#6F00FF]")
    content = content.replace("bg-purple-700", "bg-[#5200c2]")
    content = content.replace("text-purple-600", "text-[#6F00FF]")
    
    # 3. For gradients
    content = content.replace("from-purple-500", "from-[#6F00FF]")
    content = content.replace("from-purple-600", "from-[#6F00FF]")
    content = content.replace("to-purple-700", "to-[#5200c2]")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for d in directories:
    if not os.path.exists(d): continue
    for filename in os.listdir(d):
        if not filename.endswith(".jsx"): continue
        process_file(os.path.join(d, filename))

for f in additional_files:
    if os.path.exists(f):
        process_file(f)
