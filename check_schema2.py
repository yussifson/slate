import re

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    schema = f.read()

tables = ['univ_crm_leads', 'univ_faculty', 'univ_hr_employees', 'univ_parent_portal_access', 'univ_patients', 'univ_prescriptions', 'univ_students', 'univ_wards']
for t in tables:
    m = re.search(f"{t}:\\s*new Table\\(\\{{([^}}]+)\\}}\\)", schema)
    if m:
        if 'first_name' in m.group(1):
            print(f"{t} has first_name")
        else:
            has_name = "name:" in m.group(1)
            print(f"{t} DOES NOT have first_name. Has name? {has_name}")
    else:
        print(f"{t} not found in schema")
