const fs = require('fs');
const path = require('path');

const targets = [
  "UnivAccessControl.jsx", "UnivAdSpend.jsx", "UnivAdvocacy.jsx",
  "UnivAffiliateProgram.jsx", "UnivAgentcommission.jsx", "UnivAllergyList.jsx",
  "UnivApiIntegration.jsx", "UnivAppointments.jsx", "UnivApprovalEngine.jsx",
  "UnivArbitration.jsx", "UnivAssemblyLine.jsx", "UnivAssetManagement.jsx",
  "UnivAttendance.jsx", "UnivAuditTrail.jsx", "UnivBeneficiaryList.jsx"
];

const baseDir = path.join(__dirname, 'src', 'components', 'universal');

for (const target of targets) {
  const filepath = path.join(baseDir, target);
  let content = fs.readFileSync(filepath, 'utf8');

  // Remove import
  content = content.replace(/import\s+\{\s*supabase\s*\}\s+from\s+['"][^'"]+['"];?\n?/g, '');
  content = content.replace(/import\s+supabase\s+from\s+['"][^'"]+['"];?\n?/g, '');

  // Channels
  content = content.replace(/const\s+\w+\s*=\s*supabase\.channel[^\n]+subscribe\(\);\n?/g, '');
  content = content.replace(/return\s+\(\)\s*=>\s*supabase\.removeChannel[^\n]+\n?/g, '');

  // supabase.from().select('*').eq('company_id', x).order(...)
  // We use a generic approach: while there is a supabase.from
  let safety = 0;
  while (content.includes('supabase.from') && safety < 100) {
    safety++;
    const match = content.match(/await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.select\(['"]\*['"]\)\s*\n?\s*\.eq\(['"]company_id['"],\s*([^)]+)\)\s*\n?\s*\.order\(['"]([^'"]+)['"],\s*\{\s*ascending:\s*false\s*\}\)/);
    if (match) {
      const repl = `(await (async () => { try { const res = await powerSync.execute(\`SELECT * FROM \${${match[1]}} WHERE company_id = ? ORDER BY ${match[3]} DESC\`, [${match[2]}]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())`;
      content = content.substring(0, match.index) + repl + content.substring(match.index + match[0].length);
      continue;
    }

    const match2 = content.match(/await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.select\(['"]\*['"]\)\s*\n?\s*\.eq\(['"]company_id['"],\s*([^)]+)\)/);
    if (match2) {
      const repl = `(await (async () => { try { const res = await powerSync.execute(\`SELECT * FROM \${${match2[1]}} WHERE company_id = ?\`, [${match2[2]}]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })())`;
      content = content.substring(0, match2.index) + repl + content.substring(match2.index + match2[0].length);
      continue;
    }

    const match3 = content.match(/await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.update\(([^)]+)\)\s*\n?\s*\.eq\(['"]([^'"]+)['"],\s*([^)]+)\)/);
    if (match3) {
      const repl = `(await (async () => { const payload = ${match3[2]}; const keys = Object.keys(payload); const vals = Object.values(payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(\`UPDATE \${${match3[1]}} SET \${keys.map(k => \`\${k} = ?\`).join(', ')} WHERE ${match3[3]} = ?\`, [...vals, ${match3[4]}]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())`;
      content = content.substring(0, match3.index) + repl + content.substring(match3.index + match3[0].length);
      continue;
    }

    const match4 = content.match(/await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.insert\(([^)]+)\)/);
    if (match4) {
      const repl = `(await (async () => { const payload = ${match4[2]}; const keys = Array.isArray(payload) ? Object.keys(payload[0]) : Object.keys(payload); const vals = Array.isArray(payload) ? Object.values(payload[0]) : Object.values(payload); const processedVals = vals.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); return powerSync.execute(\`INSERT INTO \${${match4[1]}} (\${keys.join(', ')}) VALUES (\${keys.map(() => '?').join(', ')})\`, processedVals).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })); })())`;
      content = content.substring(0, match4.index) + repl + content.substring(match4.index + match4[0].length);
      continue;
    }

    const match5 = content.match(/await\s+supabase\s*\n?\s*\.from\(([^)]+)\)\s*\n?\s*\.delete\(\)\s*\n?\s*\.eq\(['"]([^'"]+)['"],\s*([^)]+)\)/);
    if (match5) {
      const repl = `(await powerSync.execute(\`DELETE FROM \${${match5[1]}} WHERE ${match5[2]} = ?\`, [${match5[3]}]).then(r => ({ error: null, data: r })).catch(e => ({ error: e, data: null })))`;
      content = content.substring(0, match5.index) + repl + content.substring(match5.index + match5[0].length);
      continue;
    }

    // specific to UnivArbitration
    if (content.includes("supabase.channel('univ_arbitration_changes')")) {
      content = content.replace(/const channel = supabase\.channel[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n/g, "");
      content = content.replace(/return \(\) => \{\s*supabase\.removeChannel\(channel\);\s*\};\n/g, "");
    }
    
    // specific to ApprovalEngine
    if (content.includes("supabase\n      .from(TEMPLATES_TABLE)")) {
        content = content.replace(/await supabase\s*\n\s*\.from\(TEMPLATES_TABLE\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('company_id', companyId\)/g, "await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${TEMPLATES_TABLE} WHERE company_id = ?`, [companyId]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })()");
        content = content.replace(/await supabase\s*\n\s*\.from\(TABLE\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('company_id', companyId\)\s*\n\s*\.order\('created_at', \{ ascending: false \}\)/g, "await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })()");
        content = content.replace(/await supabase\.from\(TABLE\)\.insert\(\{/g, "await (async () => { const payload = {");
        // we might just need to rely on the generic ones, but newlines break generic matches. Let me update generic matches to use \s*
    }

    break; // No generic matches found
  }
  
  // Specific fallback for UnivApprovalEngine
  content = content.replace(/await supabase\s*\n\s*\.from\(TEMPLATES_TABLE\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('company_id', companyId\)/g, "await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${TEMPLATES_TABLE} WHERE company_id = ?`, [companyId]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })()");
  content = content.replace(/await supabase\s*\n\s*\.from\(TABLE\)\s*\n\s*\.select\('\*'\)\s*\n\s*\.eq\('company_id', companyId\)\s*\n\s*\.order\('created_at', \{ ascending: false \}\)/g, "await (async () => { try { const res = await powerSync.execute(`SELECT * FROM ${TABLE} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]); return { data: res.rows._array, error: null }; } catch(e) { return { data: null, error: e }; } })()");


  fs.writeFileSync(filepath, content, 'utf8');
}

console.log('Node Migration Done');
