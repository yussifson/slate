import re

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'export const AppSchema = new Schema\(\{([\s\S]+?)\}\);', text)
schema_body = m.group(1)

table_pattern = re.compile(r'(\w+):\s*new Table\(\{([\s\S]*?)\}\),')

sql = "-- Add all columns from AppSchema.js if they don't exist\n\n"

for match in table_pattern.finditer(schema_body):
    table_name = match.group(1)
    columns_text = match.group(2)
    
    col_pattern = re.compile(r'(\w+):\s*column\.\w+')
    columns = col_pattern.findall(columns_text)
    
    for c in columns:
        if c == 'id': continue
        sql += f'ALTER TABLE "public"."{table_name}" ADD COLUMN IF NOT EXISTS "{c}" text;\n'

with open('C:/Users/USER/OneDrive/Documents/airflake/supabase/migrations/20260613220000_add_all_merged_columns.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print("Created 20260613220000_add_all_merged_columns.sql")
