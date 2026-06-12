import os
import re

files = [
    "UnivCarrierContract.jsx", "UnivCaseManagement.jsx", "UnivChangeRequest.jsx", "UnivChat.jsx", "UnivChatTranscript.jsx", "UnivChurnRisk.jsx", "UnivClassAttendance.jsx", "UnivClientledger.jsx", "UnivClientPortal.jsx", "UnivColdChain.jsx", "UnivCommissionStructure.jsx", "UnivCompetitorPrice.jsx", "UnivCompliance.jsx", "UnivConcreteTest.jsx", "UnivConflictcheck.jsx"
]

folder = "c:/Users/USER/OneDrive/Documents/airflake/src/components/universal"

for f in files:
    path = os.path.join(folder, f)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # ensure powerSync is imported
    if "import { powerSync } from" not in content and 'import {powerSync} from' not in content:
        # add it after the first import
        content = re.sub(r'^(import\s+.*?;\n?)', r'\1import { powerSync } from "@/api/PowerSyncConnector";\n', content, count=1)
        
    # handle UnivChat, UnivClientPortal, UnivCompliance, etc.
    # `let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);`
    content = re.sub(
        r"let\s+query\s*=\s*supabase\.from\(([^)]+)\)\.select\('\*'\)\.eq\('company_id',\s*([^)]+)\);",
        r"let query = { table: \1, company_id: \2 };",
        content
    )
    # in UnivChat/ClientPortal, the query is modified:
    # `query = query.eq('industry', 'orbit_build_data').eq('record_type', ...);`
    content = re.sub(
        r"query\s*=\s*query\.eq\('industry',\s*'orbit_build_data'\)\.eq\('record_type',\s*([^)]+)\);",
        r"query.industry = 'orbit_build_data'; query.record_type = \1;",
        content
    )
    # then: `const { data, error } = await query.order('created_at', { ascending: true });`
    # replace with db execution:
    content = re.sub(
        r"const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+query\.order\('created_at',\s*\{\s*ascending:\s*true\s*\}\);",
        r"""const { data, error } = await (async () => {
        let sql = `SELECT * FROM ${query.table} WHERE company_id = ?`;
        let params = [query.company_id];
        if (query.industry) {
          sql += ` AND industry = ? AND record_type = ?`;
          params.push(query.industry, query.record_type);
        }
        sql += ` ORDER BY created_at ASC`;
        return _runQuery(sql, params);
      })();""",
        content
    )
    
    # UnivCaseManagement.jsx, UnivClassAttendance.jsx
    # `const { data, error } = await supabase.from('...').select('*').eq('company_id', companyId).eq('company_id', companyId).order(...)`
    content = re.sub(
        r"const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+supabase\s*\n*\s*\.from\(([^)]+)\)\s*\n*\s*\.select\('\*'\)\.eq\('company_id',\s*([^)]+)\)\s*\n*\s*\.eq\('company_id',\s*[^)]+\)\s*\n*\s*\.order\('([^']+)',\s*\{\s*ascending:\s*false\s*\}\);",
        r"const { data, error } = await _runQuery(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2]);",
        content
    )

    # UnivCommissionStructure.jsx
    # `await supabase.from('univ_commissionstructure').update({ ...formData, company_id: companyId }).eq('id', editingId);`
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.update\(([^)]+)\)\.eq\('id',\s*([^)]+)\);",
        r"await _update(\1, \2, 'id', \3);",
        content
    )
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.insert\(\[\{([^\}]+)\}\]\);",
        r"await _insert(\1, [{\2}]);",
        content
    )
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.delete\(\)\.eq\('id',\s*([^)]+)\);",
        r"await _delete(\1, 'id', \2);",
        content
    )

    # remaining raw supabase inserts in Chat/ClientPortal/Compliance:
    # `const { error } = await supabase.from(targetTable).insert([payload]);`
    content = re.sub(
        r"const\s+\{\s*error\s*\}\s*=\s*await\s+supabase\.from\(([^)]+)\)\.insert\(([^)]+)\);",
        r"const { error } = await _insert(\1, \2);",
        content
    )
    
    # `const { error } = await supabase.from(targetTable).update(updatePayload).eq('id', itemData.id);`
    content = re.sub(
        r"const\s+\{\s*error\s*\}\s*=\s*await\s+supabase\.from\(([^)]+)\)\.update\(([^)]+)\)\.eq\('id',\s*([^)]+)\);",
        r"const { error } = await _update(\1, \2, 'id', \3);",
        content
    )
    
    # UnivClientledger.jsx / UnivConflictcheck.jsx
    # `const { data: fetchedData, error } = await supabase.from('univ_clientledger').select('*').eq('company_id', companyId).order('created_at', { ascending: false });`
    content = re.sub(
        r"const\s+\{\s*data:\s*fetchedData\s*,\s*error\s*\}\s*=\s*await\s+supabase\s*\n*\s*\.from\(([^)]+)\)\s*\n*\s*\.select\('\*'\)\s*\n*\s*\.eq\('company_id',\s*([^)]+)\)\s*\n*\s*\.order\('([^']+)',\s*\{\s*ascending:\s*false\s*\}\);",
        r"const { data: fetchedData, error } = await _runQuery(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2]);",
        content
    )
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f"Fixed {f}")
