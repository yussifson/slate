import re

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract everything between `export const AppSchema = new Schema({` and the closing `});`
m = re.search(r'export const AppSchema = new Schema\(\{([\s\S]+?)\}\);', text)
if not m:
    print("Could not parse Schema.")
    exit(1)

schema_body = m.group(1)

# Find all table definitions
# format: table_name: new Table({ ... }),
table_pattern = re.compile(r'(\w+):\s*new Table\(\{([\s\S]*?)\}\),')

tables = {}
for match in table_pattern.finditer(schema_body):
    table_name = match.group(1)
    columns_text = match.group(2)
    
    # Extract columns
    col_pattern = re.compile(r'(\w+):\s*column\.\w+')
    columns = col_pattern.findall(columns_text)
    
    if table_name not in tables:
        tables[table_name] = []
    
    for c in columns:
        if c not in tables[table_name]:
            tables[table_name].append(c)

# Rebuild the schema body
new_schema_body = "\n"
for table_name, columns in tables.items():
    new_schema_body += f"    {table_name}: new Table({{\n"
    for c in columns:
        new_schema_body += f"        {c}: column.text,\n"
    new_schema_body += "    }),\n"

new_text = text.replace(schema_body, new_schema_body)

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Merged all duplicate tables and columns in AppSchema.js successfully.")
