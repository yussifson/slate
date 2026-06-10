import re

filepath = 'supabase/migrations/20260610_univ_components_phase1.sql'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove foreign key constraints to public.companies and auth.users
content = re.sub(r' REFERENCES public\.companies\(id\) ON DELETE CASCADE', '', content)
content = re.sub(r' REFERENCES auth\.users\(id\)', '', content)
content = re.sub(r' REFERENCES public\.univ_hr_employees\(id\)', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed foreign key constraints from SQL script to prevent 42P01")
