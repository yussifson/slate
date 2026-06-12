import os
import re

targets = [
  "UnivAccessControl.jsx", "UnivAdSpend.jsx", "UnivAdvocacy.jsx",
  "UnivAffiliateProgram.jsx", "UnivAgentcommission.jsx", "UnivAllergyList.jsx",
  "UnivApiIntegration.jsx", "UnivAppointments.jsx", "UnivApprovalEngine.jsx",
  "UnivArbitration.jsx", "UnivAssemblyLine.jsx", "UnivAssetManagement.jsx",
  "UnivAttendance.jsx", "UnivAuditTrail.jsx", "UnivBeneficiaryList.jsx"
]

base_dir = r"C:\Users\USER\OneDrive\Documents\airflake\src\components\universal"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove supabase import
    content = re.sub(r"import\s+\{\s*supabase\s*\}\s+from\s+['\"][^'\"]+['\"];?\n?", "", content)
    content = re.sub(r"import\s+supabase\s+from\s+['\"][^'\"]+['\"];?\n?", "", content)

    # 2. Convert queries:
    # await supabase.from('...').select('*').eq('company_id', companyId).order('...', { ascending: false });
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.select\(['\"]\*\['\"]\)\.eq\(['\"]company_id['\"],\s*([^)]+)\)\.order\(['\"]([^'\"]+)['\"],\s*\{\s*ascending:\s*false\s*\}\);?",
        r"(await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())",
        content
    )
    
    # await supabase.from('...').select('*').eq('company_id', companyId);
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.select\(['\"]\*\['\"]\)\.eq\(['\"]company_id['\"],\s*([^)]+)\);?",
        r"(await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${ \1 } WHERE company_id = ?`, [\2]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())",
        content
    )

    # 3. Convert updates:
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.update\(([^)]+)\)\.eq\(['\"]([^'\"]+)['\"],\s*([^)]+)\)",
        r"(await (async () => { const payload = \2; const keys = Object.keys(payload); const vals = Object.values(payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(`UPDATE ${ \1 } SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE \3 = ?`, [...vals, \4]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())",
        content
    )

    # 4. Convert inserts:
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.insert\(([^)]+)\)",
        r"(await (async () => { const payload = \2; const keys = Array.isArray(payload) ? Object.keys(payload[0]) : Object.keys(payload); const vals = Array.isArray(payload) ? Object.values(payload[0]) : Object.values(payload); const processedVals = vals.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(`INSERT INTO ${ \1 } (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`, processedVals).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())",
        content
    )

    # 5. Convert deletes:
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.delete\(\)\.eq\(['\"]([^'\"]+)['\"],\s*([^)]+)\)",
        r"(await powerSync.execute(`DELETE FROM ${ \1 } WHERE \2 = ?`, [\3]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })))",
        content
    )

    # 6. Convert channels:
    content = re.sub(r"const\s+\w+\s*=\s*supabase\.channel\([^;]+;\n?", "", content)
    content = re.sub(r"return\s+\(\)\s*=>\s*supabase\.removeChannel\([^;]+;\n?", "", content)
    
    # 7. Convert specific manual query builder lines
    content = content.replace(
        "let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);\n      if (targetTable === 'industry_records') {\n        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_appts`);\n      }\n      const { data, error } = await query;",
        "let sql = `SELECT * FROM ${targetTable} WHERE company_id = ?`;\n      let params = [effectiveCompanyId];\n      if (targetTable === 'industry_records') {\n        sql += ` AND industry = ? AND record_type = ?`;\n        params.push('orbit_build_data', `${effectivePageName}_appts`);\n      }\n      const { data, error } = await powerSync.execute(sql, params).then(r => ({ data: r.rows._array, error: null })).catch(e => ({ data: null, error: e }));"
    )
    
    content = content.replace(
        "let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);\n      if (targetTable === 'industry_records') {\n        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_assets`);\n      }\n      const { data, error } = await query;",
        "let sql = `SELECT * FROM ${targetTable} WHERE company_id = ?`;\n      let params = [effectiveCompanyId];\n      if (targetTable === 'industry_records') {\n        sql += ` AND industry = ? AND record_type = ?`;\n        params.push('orbit_build_data', `${effectivePageName}_assets`);\n      }\n      const { data, error } = await powerSync.execute(sql, params).then(r => ({ data: r.rows._array, error: null })).catch(e => ({ data: null, error: e }));"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for target in targets:
    process_file(os.path.join(base_dir, target))

print("All targets processed.")
