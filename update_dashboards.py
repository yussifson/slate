import os

dashboard_files = [
    'src/components/dashboard/GenericDashboard.jsx',
    'src/components/dashboard/HotelDashboard.jsx',
    'src/components/dashboard/InsuranceDashboard.jsx',
    'src/components/dashboard/LawDashboard.jsx',
    'src/components/dashboard/LogisticsDashboard.jsx',
    'src/components/dashboard/ReligionDashboard.jsx',
    'src/components/dashboard/RetailDashboard.jsx'
]

for file in dashboard_files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
            
    # Add button
    vertical = 'industry' # Default for generic
    if 'HotelDashboard' in file: vertical = '"hospitality"'
    elif 'LawDashboard' in file: vertical = '"law"'
    
    button_str = f'          <RunIntelligenceButton vertical={{{vertical}}} />'
    
    target = '<BarChart2'
    if target in content and '<RunIntelligenceButton' not in content:
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if '<BarChart2' in line:
                for j in range(i, min(i+5, len(lines))):
                    if '</Button>' in lines[j]:
                        lines.insert(j+1, button_str)
                        break
                break
        content = '\n'.join(lines)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done')
