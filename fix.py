import os
import re

files_to_fix = [
  'UnivAgentcommission.jsx', 'UnivApiIntegration.jsx', 'UnivAppointments.jsx',
  'UnivApprovalEngine.jsx', 'UnivArbitration.jsx', 'UnivAssemblyLine.jsx',
  'UnivAssetManagement.jsx', 'UnivAttendance.jsx', 'UnivAuditTrail.jsx'
]

base_dir = r'C:\Users\USER\OneDrive\Documents\airflake\src\components\universal'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix: await supabase.from(TABLE).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    # Example from UnivAgentcommission
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.select\(['\"]\*\['\"]\)\.eq\(['\"]company_id['\"],\s*([^)]+)\)\.order\(['\"]([^'\"]+)['\"],\s*\{\s*ascending:\s*false\s*\}\)",
        r"(await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())",
        content
    )

    # 1b. Fix UnivAssemblyLine
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.select\(['\"]\*\['\"]\)\.eq\(['\"]company_id['\"],\s*([^)]+)\)",
        r"(await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${ \1 } WHERE company_id = ?`, [\2]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())",
        content
    )

    # 2. Fix variable table insert
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.insert\(([^)]+)\)",
        r"(await (async () => { const payload = \2; const keys = Array.isArray(payload) ? Object.keys(payload[0]) : Object.keys(payload); const vals = Array.isArray(payload) ? Object.values(payload[0]) : Object.values(payload); const processedVals = vals.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(`INSERT INTO ${ \1 } (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`, processedVals).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())",
        content
    )

    # 3. Fix variable table update
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.update\(([^)]+)\)\.eq\(['\"]([^'\"]+)['\"],\s*([^)]+)\)",
        r"(await (async () => { const payload = \2; const keys = Object.keys(payload); const vals = Object.values(payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(`UPDATE ${ \1 } SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE \3 = ?`, [...vals, \4]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())",
        content
    )

    # 4. Fix variable table delete
    content = re.sub(
        r"await\s+supabase\.from\(([^)]+)\)\.delete\(\)\.eq\(['\"]([^'\"]+)['\"],\s*([^)]+)\)",
        r"(await powerSync.execute(`DELETE FROM ${ \1 } WHERE \2 = ?`, [\3]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })))",
        content
    )
    
    # 5. Fix query builder in UnivAppointments and UnivAssetManagement
    # let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);
    content = content.replace(
        "let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);\n      if (targetTable === 'industry_records') {\n        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_appts`);\n      }\n      const { data, error } = await query;",
        "let sql = `SELECT * FROM ${targetTable} WHERE company_id = ?`;\n      let params = [effectiveCompanyId];\n      if (targetTable === 'industry_records') {\n        sql += ` AND industry = ? AND record_type = ?`;\n        params.push('orbit_build_data', `${effectivePageName}_appts`);\n      }\n      const { data, error } = await powerSync.execute(sql, params).then(r => ({ data: r.rows._array, error: null })).catch(e => ({ data: null, error: e }));"
    )
    
    content = content.replace(
        "let query = supabase.from(targetTable).select('*').eq('company_id', effectiveCompanyId);\n      if (targetTable === 'industry_records') {\n        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_assets`);\n      }\n      const { data, error } = await query;",
        "let sql = `SELECT * FROM ${targetTable} WHERE company_id = ?`;\n      let params = [effectiveCompanyId];\n      if (targetTable === 'industry_records') {\n        sql += ` AND industry = ? AND record_type = ?`;\n        params.push('orbit_build_data', `${effectivePageName}_assets`);\n      }\n      const { data, error } = await powerSync.execute(sql, params).then(r => ({ data: r.rows._array, error: null })).catch(e => ({ data: null, error: e }));"
    )
    
    # 6. Fix supabase.channel
    content = re.sub(r"const\s+\w+\s*=\s*supabase\.channel\([^;]+;\n", "", content)
    content = re.sub(r"return\s+\(\)\s*=>\s*supabase\.removeChannel\([^;]+;\n?", "", content)
    
    # 7. Fix syntax error in UnivAttendance.jsx
    content = content.replace(
        "await powerSync.execute('SELECT * FROM univ_attendance WHERE company_id = ?', [companyId]).then(res => ({ data: res.rows._array })).order('date', { ascending: false });",
        "await powerSync.execute('SELECT * FROM univ_attendance WHERE company_id = ? ORDER BY date DESC', [companyId]).then(res => ({ data: res.rows._array }));"
    )
    
    # Also in Arbitration
    content = re.sub(
        r"const \{ data: fetchedData, error \} = await supabase\s*\n\s*\.from\(TABLE\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('company_id', companyId\)\s*\n\s*\.order\('created_at', \{ ascending: false \}\);",
        r"const { data: fetchedData, error } = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).then(res => ({ data: res.rows._array, error: null })).catch(e => ({ data: null, error: e }));",
        content
    )
    
    # Any other supabase.from().select()
    content = re.sub(
        r"const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.select\(['\"]\*\['\"]\)\s*\n?\s*\.eq\(['\"]company_id['\"],\s*([^)]+)\)\s*\n?\s*\.order\(['\"]([^'\"]+)['\"],\s*\{\s*ascending:\s*false\s*\}\);",
        r"const { data, error } = await powerSync.execute(`SELECT * FROM ${ \1 } WHERE company_id = ? ORDER BY \3 DESC`, [\2]).then(res => ({ data: res.rows._array, error: null })).catch(e => ({ data: null, error: e }));",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for target in files_to_fix:
    process_file(os.path.join(base_dir, target))

print("Fixed")
