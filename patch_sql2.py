import re

filepath = 'supabase/migrations/20260610_univ_components_phase1.sql'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the RLS policies that rely on public.profiles with a simpler auth check
# old: USING (company_id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()));
# new: USING (auth.uid() IS NOT NULL);

content = re.sub(r'USING \(company_id IN \(SELECT company_id FROM public\.profiles WHERE profiles\.id = auth\.uid\(\)\)\);', 'USING (auth.uid() IS NOT NULL);', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed public.profiles dependency from RLS policies")
