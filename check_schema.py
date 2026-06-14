import os, re

schema_path = 'C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js'
with open(schema_path, 'r', encoding='utf-8') as f:
    schema_code = f.read()

tables = {}
current_table = None
for line in schema_code.split('\n'):
    m = re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*new Table\(\{", line)
    if m:
        current_table = m.group(1)
        tables[current_table] = []
        continue
    if current_table and re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*column\.", line):
        col = re.search(r"^\s*([a-zA-Z0-9_]+)\s*:\s*column\.", line).group(1)
        tables[current_table].append(col)

univ_dir = 'C:/Users/USER/OneDrive/Documents/airflake/src/components/universal'
missing_columns_per_file = {}

for root, dirs, files in os.walk(univ_dir):
    for f in files:
        if not f.endswith('.jsx'): continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Determine table name
        table_name = None
        tm = re.search(r"INSERT INTO (\w+)", content)
        if tm:
            table_name = tm.group(1)
        else:
            continue
            
        if table_name not in tables:
            # print(f"Skipping {f} because table {table_name} is dynamic or not found")
            continue
            
        schema_cols = tables[table_name] + ['id', 'company_id']
        
        payload_blocks = re.findall(r"const _p\s*=\s*\{([^}]*)\};", content)
        if not payload_blocks:
            payload_blocks = re.findall(r"const payload\s*=\s*\{([^}]*)\};", content)
        if not payload_blocks:
            payload_blocks = re.findall(r"const EMPTY_FORM\s*=\s*\{([^}]*)\};", content)
            
        missing = set()
        for block in payload_blocks:
            # Extract keys: words followed by a colon
            keys = re.findall(r"([a-zA-Z0-9_]+)\s*:", block)
            for k in keys:
                if k not in schema_cols:
                    missing.add(k)
                    
        # Exclude removed keys
        for rm in re.findall(r"delete _p\.([a-zA-Z0-9_]+)", content):
            if rm in missing:
                missing.remove(rm)
                
        if missing:
            missing_columns_per_file[f] = {'table': table_name, 'missing': list(missing)}

for f, data in missing_columns_per_file.items():
    print(f"{f} (table: {data['table']}) is inserting missing columns: {', '.join(data['missing'])}")
print(f"Total components with missing columns: {len(missing_columns_per_file)}")
