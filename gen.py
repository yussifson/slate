import re
import os

with open('./src/api/schemaColumns.js', 'r') as f:
    content = f.read()

# Extract the SCHEMA_COLUMNS object content
match = re.search(r'export const SCHEMA_COLUMNS = (\{.*\});', content, re.DOTALL)
if match:
    import ast
    import json
    
    # We can use a simple regex approach since it's just JSON-like
    tables = {}
    
    table_matches = re.finditer(r'"([^"]+)":\s*\[(.*?)\]', match.group(1), re.DOTALL)
    for tm in table_matches:
        table_name = tm.group(1)
        cols_text = tm.group(2)
        cols = [c.strip().strip('"').strip("'") for c in cols_text.split(',') if c.strip()]
        tables[table_name] = cols

    out = ["import { column, Schema, Table } from '@powersync/web';", "", "export const AppSchema = new Schema({"]
    
    for table, cols in tables.items():
        out.append(f"    {table}: new Table({{")
        for col in cols:
            out.append(f"        {col}: column.text,")
        out.append("    }),")
    
    out.append("});\n")
    
    with open('./src/api/AppSchema.js', 'w') as f:
        f.write('\n'.join(out))
    
    print("Done generating AppSchema.js!")
else:
    print("Could not find SCHEMA_COLUMNS")
