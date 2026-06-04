import os

hotel_dir = r"c:\Users\USER\OneDrive\Documents\airflake\src\pages\hotel"
for filename in os.listdir(hotel_dir):
    if not filename.endswith(".jsx"): continue
    path = os.path.join(hotel_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Replace the old background style with a premium beautiful gradient
    old_style = 'style={{ backgroundColor: "rgba(68, 49, 153, 0.03)", minHeight: "100vh" }}'
    new_style = 'style={{ background: "linear-gradient(135deg, rgba(68,49,153,0.08) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}'
    content = content.replace(old_style, new_style)

    old_style_2 = "style={{ backgroundColor: 'rgba(68, 49, 153, 0.03)', minHeight: '100vh' }}"
    content = content.replace(old_style_2, new_style)
    
    # 2. Replace the dark header in Restaurant.jsx
    if filename == "Restaurant.jsx":
        content = content.replace("bg-slate-900 text-white", "bg-[#443199] text-white shadow-md")
        content = content.replace("bg-slate-800", "bg-[#362878]") # The input field inside the dark header

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
