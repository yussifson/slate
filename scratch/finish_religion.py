import os

brain_dir = r"C:\Users\USER\.gemini\antigravity\brain\5fc3774f-bd63-4afe-a7cc-7e0fe4396dfd"
task_md = os.path.join(brain_dir, "task.md")
walkthrough_md = os.path.join(brain_dir, "walkthrough.md")

if os.path.exists(task_md):
    with open(task_md, 'r') as f:
        content = f.read()
    content = content.replace("[/] Overhaul Religion Industry", "[x] Overhaul Religion Industry")
    with open(task_md, 'w') as f:
        f.write(content)

if os.path.exists(walkthrough_md):
    with open(walkthrough_md, 'a') as f:
        f.write("\n\n## Religion Industry Overhaul Complete\n")
        f.write("The entire Religion module (10 pages) has been migrated to use native PowerSync SQL, removing all mock APIs.\n")
        f.write("Modifications included `Members.jsx`, `Events.jsx`, `Sermons.jsx`, `Prayers.jsx`, `Volunteers.jsx`, `SmallGroups.jsx`, `Groups.jsx`, `Donations.jsx`, and `MemberPortal.jsx`.\n")
        f.write("A new feature **Milestones** (`Milestones.jsx`) was created to allow tracking spiritual milestones like Baptisms and Ordinations.\n")
        f.write("Dedicated `univ_religion_*` tables were added to `AppSchema.js` to ensure the structure was robust and consistent.\n")

print("Done")
