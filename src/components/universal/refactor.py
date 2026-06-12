import os
import re

files = [
    "UnivCarrierContract.jsx", "UnivCaseManagement.jsx", "UnivChangeRequest.jsx", "UnivChat.jsx", "UnivChatTranscript.jsx", "UnivChurnRisk.jsx", "UnivClassAttendance.jsx", "UnivClientledger.jsx", "UnivClientPortal.jsx", "UnivColdChain.jsx", "UnivCommissionStructure.jsx", "UnivCompetitorPrice.jsx", "UnivCompliance.jsx", "UnivConcreteTest.jsx", "UnivConflictcheck.jsx"
]

folder = "c:/Users/USER/OneDrive/Documents/airflake/src/components/universal"

helpers = """
const _runQuery = async (query, args) => {
  try {
    const res = await powerSync.execute(query, args);
    return { data: res.rows?._array || [], error: null };
  } catch(err) {
    return { data: null, error: err };
  }
};
const _insert = async (table, payload) => {
  const obj = Array.isArray(payload) ? payload[0] : payload;
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const placeholders = keys.map(() => '?').join(', ');
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  try { await powerSync.execute(query, values); return { error: null }; } catch(e) { return { error: e }; }
};
const _update = async (table, obj, idColumn, idValue) => {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const setClause = keys.map(k => k + ' = ?').join(', ');
  const query = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`;
  try { await powerSync.execute(query, [...values, idValue]); return { error: null }; } catch(e) { return { error: e }; }
};
const _delete = async (table, idColumn, idValue) => {
  const query = `DELETE FROM ${table} WHERE ${idColumn} = ?`;
  try { await powerSync.execute(query, [idValue]); return { error: null }; } catch(e) { return { error: e }; }
};
"""

for f in files:
    path = os.path.join(folder, f)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. remove supabase imports
    content = re.sub(r'import\s+\{\s*supabase\s*\}\s+from\s+[^;]+;\n?', '', content)
    content = re.sub(r'import\s+supabase\s+from\s+[^;]+;\n?', '', content)
    
    # remove channel subscriptions
    content = re.sub(r'const\s+channel\s*=\s*supabase\.channel.*?\.subscribe\(\);', '', content, flags=re.DOTALL)
    content = re.sub(r'return\s*\(\)\s*=>\s*\{\s*supabase\.removeChannel\(channel\);\s*\};', '', content)

    # 2. Add helper functions after imports
    if '_runQuery' not in content:
        # find last import
        import_end = 0
        for m in re.finditer(r'^import.*$', content, re.MULTILINE):
            import_end = m.end()
        content = content[:import_end] + "\n" + helpers + "\n" + content[import_end:]

    # 3. Replace operations
    content = re.sub(
        r"await\s+supabase\s*\n*\s*\.from\(([^)]+)\)\s*\n*\s*\.select\('\*'\)(?:\s*\n*\s*\.eq\('company_id',\s*([^)]+)\))+\s*\n*\s*\.order\('([^']+)',\s*\{\s*ascending:\s*false\s*\}\)",
        r"await _runQuery(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2])",
        content
    )
    content = re.sub(
        r"await\s+supabase\s*\n*\s*\.from\(([^)]+)\)\s*\n*\s*\.select\('\*'\)\s*\n*\s*\.order\('([^']+)',\s*\{\s*ascending:\s*false\s*\}\)",
        r"await _runQuery(`SELECT * FROM ${ \1 } ORDER BY \2 DESC`, [])",
        content
    )
    content = re.sub(
        r"await\s+supabase\s*\n*\s*\.from\(([^)]+)\)\s*\n*\s*\.select\('\*'\)\s*\n*\s*\.eq\('company_id',\s*([^)]+)\)",
        r"await _runQuery(`SELECT * FROM ${ \1 } WHERE company_id = ?`, [\2])",
        content
    )
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.insert\(([^)]+)\)",
        r"await _insert(\1, \2)",
        content
    )
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.update\(([^)]+)\)\.eq\('id',\s*([^)]+)\)",
        r"await _update(\1, \2, 'id', \3)",
        content
    )
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.delete\(\)\.eq\('id',\s*([^)]+)\)",
        r"await _delete(\1, 'id', \2)",
        content
    )
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f"Processed {f}")
