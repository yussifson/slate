import os
import glob

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filepath}')
    except Exception as e:
        print(f'Error processing {filepath}: {e}')

replacements = [
    ('Welcome to your workspace', 'Welcome to your workslate'),
    ('welcome_to_your_workspace', 'welcome_to_your_workslate'),
    ('welcome_to_workspace', 'welcome_to_workslate'),
    ('Go to Workspace', 'Go to WorkSlate'),
    ('go_to_workspace', 'go_to_workslate'),
    ('New Workspace', 'New WorkSlate'),
    ('New workspace', 'New workslate'),
    ('Search workspaces', 'Search workslates'),
    ('Custom Code Workspace', 'Custom Code WorkSlate'),
    ('LMS Workspaces', 'LMS WorkSlates'),
    ('your workspace', 'your workslate'),
    ('Your workspace', 'Your workslate'),
    ('Workspace Module', 'WorkSlate Module'),
    ('workspace_module', 'workslate_module'),
    ('Law Firm Workspace', 'Law Firm WorkSlate'),
    ('Healthcare Workspace', 'Healthcare WorkSlate'),
    ('Education Workspace', 'Education WorkSlate'),
    ('Hospitality Workspace', 'Hospitality WorkSlate'),
    ('Ministry Workspace', 'Ministry WorkSlate'),
    ('Insurance Workspace', 'Insurance WorkSlate'),
    ('Retail Workspace', 'Retail WorkSlate'),
    ('Logistics Workspace', 'Logistics WorkSlate'),
    ('HR & ERP Workspace', 'HR & ERP WorkSlate')
]

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.tsx', '.ts')):
            replace_in_file(os.path.join(root, file), replacements)
