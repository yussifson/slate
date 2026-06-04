import os
import re

hospital_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\hospital"
dashboard_file = r"c:\Users\USER\OneDrive\Documents\airflake\src\components\dashboard\HospitalDashboard.jsx"

def process_file(path):
    if not os.path.exists(path):
        return
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace blue with teal globally
    content = content.replace("blue-", "teal-")
    content = content.replace("bg-[#3b82f6]", "bg-[#0d9488]")
    content = content.replace("text-[#3b82f6]", "text-[#0d9488]")
    
    # 2. Fix Dashboard Charts (replace the old blue #2247fc with dynamic primary)
    content = content.replace('stopColor="#2247fc"', 'stopColor="hsl(var(--primary))"')
    content = content.replace('stroke="#2247fc"', 'stroke="hsl(var(--primary))"')
    content = content.replace('fill="#2247fc"', 'fill="hsl(var(--primary))"')
    
    # 3. Inject peaceful teal gradient background into the outermost div
    # Look for `<div className="space-y-6"` or `<div className="space-y-5"`
    gradient_style = ' style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}'
    
    # Using regex to target the first occurrence of the wrapper div
    if 'style={{ background: "linear-gradient' not in content:
        content = re.sub(
            r'(<div className="space-y-[56](?:[^"]*)?")', 
            r'\1' + gradient_style, 
            content, 
            count=1
        )
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# Process all files in hospital directory
for filename in os.listdir(hospital_dir):
    if not filename.endswith(".jsx"): continue
    process_file(os.path.join(hospital_dir, filename))

# Process the hospital dashboard
process_file(dashboard_file)
print("Hospital suite beautifully themed with peaceful green/teal.")
