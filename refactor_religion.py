import os
import glob
import re

replacements = [
    # DB Tables & Identifiers
    ('church_members', 'religion_members'),
    ('church_ministries', 'religion_groups'),
    ('church_events', 'religion_events'),
    ('church_tithes', 'religion_donations'), # in case it exists
    
    # Imports & Components
    ('ChurchMembers', 'ReligionMembers'),
    ('ChurchMinistries', 'ReligionGroups'),
    ('ChurchEvents', 'ReligionEvents'),
    ('ChurchTithes', 'ReligionDonations'),
    ('ChurchVolunteers', 'ReligionVolunteers'),
    ('ChurchSermons', 'ReligionSermons'),
    ('ChurchSmallGroups', 'ReligionSmallGroups'),
    ('ChurchPrayers', 'ReligionPrayers'),
    ('ChurchMemberPortal', 'ReligionMemberPortal'),
    ('ChurchDashboard', 'ReligionDashboard'),
    ('ChurchIcon', 'HeartHandshake'), # Replace ChurchIcon with something generic
    
    # File Paths & Routes
    ('/church/', '/religion/'),
    ('pages/church/', 'pages/religion/'),
    ("'/church'", "'/religion'"),
    ('"/church"', '"/religion"'),
    ('value: \'church\'', 'value: \'religion\''),
    ('key === \'church\'', 'key === \'religion\''),
    ('id: \'church\'', 'id: \'religion\''),
    
    # UI Text & Copy (Case sensitive mostly)
    ('Church & Congregation Management', 'Religious Organization Management'),
    ('Ministry WorkSlate', 'Religion WorkSlate'),
    ('Church Suite', 'Religion Suite'),
    ('Church Roles', 'Religion Roles'),
    ('Church Portal', 'Religion Portal'),
    ('church portal', 'religion portal'),
    ('church family', 'religious community'),
    ('Church ', 'Religion '),
    ('church ', 'religion '),
    ('Church', 'Religion'),
    ('church', 'religion'),
    
    # Ministries -> Groups / Departments
    ('/ministries', '/groups'),
    ('Ministry Leader', 'Group Leader'),
    ('ministry_leader', 'group_leader'),
    ('Ministry / Role', 'Group / Role'),
    ('Ministry Name', 'Group Name'),
    ('Add Ministry', 'Add Group'),
    ('Create Ministry Dept', 'Create Group'),
    ('Ministry department', 'Group department'),
    ('Ministry', 'Group'),
    ('ministry', 'group'),
    ('Ministries', 'Groups'),
    ('ministries', 'groups'),
    
    # Tithes -> Donations
    ('/tithes', '/donations'),
    ('Tithes', 'Donations'),
    ('tithes', 'donations'),
    ('Tithe', 'Donation'),
    ('tithe', 'donation')
]

# Note: The order matters, longer/more specific strings first.

# We need a function to safely replace without breaking other things.
def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Specific fixes for file paths first
        content = content.replace('./pages/church/Ministries', './pages/religion/Groups')
        content = content.replace('./pages/church/Tithes', './pages/religion/Donations')
        
        for old, new in replacements:
            content = content.replace(old, new)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")

# Process all text files in src/
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.json', '.html')):
            process_file(os.path.join(root, file))

