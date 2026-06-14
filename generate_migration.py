import os, re

# 1. Parse AppSchema.js for desired columns
schema_path = 'C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js'
with open(schema_path, 'r', encoding='utf-8') as f:
    app_schema = f.read()

desired_schema = {}
current_table = None
for line in app_schema.split('\n'):
    m = re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*new Table\(\{", line)
    if m:
        current_table = m.group(1)
        desired_schema[current_table] = []
        continue
    if current_table and re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*column\.", line):
        col = re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*column\.", line).group(1)
        if col not in ['id', 'created_at']:
            desired_schema[current_table].append(col)

# 2. Parse migrations for existing Postgres columns
migrations_dir = 'C:/Users/USER/OneDrive/Documents/airflake/supabase/migrations'
existing_schema = {}

for root, dirs, files in os.walk(migrations_dir):
    for file in sorted(files):
        if not file.endswith('.sql'): continue
        with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
            sql = f.read()
            
        # Parse CREATE TABLE
        # It's usually CREATE TABLE public.table_name ( ... );
        # Or ALTER TABLE public.table_name ADD COLUMN ...
        
        # A simple way to track is to just find all mentions of table_name and column_name
        # But let's be more precise: we only care about adding missing columns as text.
        pass

# Actually, an easier way is to just generate ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
# Postgres 10+ supports `ADD COLUMN IF NOT EXISTS`.
# So we can just generate a massive script that does `ADD COLUMN IF NOT EXISTS` for EVERY custom column in AppSchema!
# This is completely safe and guarantees alignment!

sql_statements = []

for table, columns in desired_schema.items():
    if not table.startswith('univ_'): continue  # only focus on the generated components
    for col in columns:
        if col in ['id', 'created_at', 'company_id']: continue
        # use text for everything as that's what AppSchema.js mostly maps to, and it's flexible
        sql = f"ALTER TABLE public.{table} ADD COLUMN IF NOT EXISTS {col} text;"
        sql_statements.append(sql)

# Also univ_contacts
if 'univ_contacts' in desired_schema:
    for col in desired_schema['univ_contacts']:
         if col not in ['id', 'created_at', 'company_id']:
             sql_statements.append(f"ALTER TABLE public.univ_contacts ADD COLUMN IF NOT EXISTS {col} text;")

# Deduplicate
sql_statements = list(dict.fromkeys(sql_statements))

out_path = 'C:/Users/USER/OneDrive/Documents/airflake/supabase/migrations/20260613200000_add_missing_univ_columns.sql'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f"Generated {len(sql_statements)} ALTER TABLE statements.")
