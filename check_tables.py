import re

with open('C:/Users/USER/OneDrive/Documents/airflake/src/api/AppSchema.js', 'r', encoding='utf-8') as f:
    text = f.read()

tables = []
for line in text.split('\n'):
    m = re.search(r"new Table\(\s*['\"`](\w+)['\"`]", line)
    if m: tables.append(m.group(1))
print(f'Total tables in AppSchema.js: {len(tables)}')
print(tables)
