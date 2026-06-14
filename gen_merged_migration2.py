import re

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'export const AppSchema = new Schema\(\{([\s\S]+?)\}\);', text)
schema_body = m.group(1)

table_pattern = re.compile(r'(\w+):\s*new Table\(\{([\s\S]*?)\}\),')

sql = "-- Ensure all tables exist before altering them\n\n"

for match in table_pattern.finditer(schema_body):
    table_name = match.group(1)
    columns_text = match.group(2)
    
    col_pattern = re.compile(r'(\w+):\s*column\.\w+')
    columns = col_pattern.findall(columns_text)
    
    sql += f'CREATE TABLE IF NOT EXISTS "public"."{table_name}" (\n'
    sql += f'    id uuid default gen_random_uuid() primary key\n'
    sql += f');\n'
    
    for c in columns:
        if c == 'id': continue
        sql += f'ALTER TABLE "public"."{table_name}" ADD COLUMN IF NOT EXISTS "{c}" text;\n'
    
    sql += '\n'

with open('C:/Users/USER/OneDrive/Documents/airflake/supabase/migrations/20260613220000_add_all_merged_columns.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print("Recreated 20260613220000_add_all_merged_columns.sql with CREATE TABLE fallbacks.")
