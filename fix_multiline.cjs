
 const fs = require('fs');

const file1 = "C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivExpertwitness.jsx";
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(
  /const\s+\{\s*data:\s*fetchedData,\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\('univ_expertwitness'\)\s*\.select\('\*'\)\.eq\('company_id',\s*companyId\)\s*\.eq\('company_id',\s*companyId\)\s*\.order\('created_at',\s*\{\s*ascending:\s*false\s*\}\);/m,
  `let fetchedData = [], error = null; try { const res = await db.execute("SELECT * FROM univ_expertwitness WHERE company_id = ? ORDER BY created_at DESC", [companyId]); fetchedData = res.rows?._array || res.rows; } catch(err) { error = err; }`
);
fs.writeFileSync(file1, code1);

const file2 = "C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivFaculty.jsx";
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  /const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\('univ_faculty'\)\s*\.select\('\*'\)\.eq\('company_id',\s*companyId\)\s*\.eq\('company_id',\s*companyId\)\s*\.order\('first_name',\s*\{\s*ascending:\s*true\s*\}\);/m,
  `let data = [], error = null; try { const res = await db.execute("SELECT * FROM univ_faculty WHERE company_id = ? ORDER BY first_name ASC", [companyId]); data = res.rows?._array || res.rows; } catch(err) { error = err; }`
);
fs.writeFileSync(file2, code2);

const file3 = "C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivFleet.jsx";
let code3 = fs.readFileSync(file3, 'utf8');
code3 = code3.replace(
  /const\s+\{\s*data,\s*error\s*\}\s*=\s*await\s+supabase\s*\.from\('univ_fleet'\)\s*\.select\('\*'\)\.eq\('company_id',\s*companyId\)\s*\.eq\('company_id',\s*companyId\)\s*\.order\('vehicle_name',\s*\{\s*ascending:\s*true\s*\}\);/m,
  `let data = [], error = null; try { const res = await db.execute("SELECT * FROM univ_fleet WHERE company_id = ? ORDER BY vehicle_name ASC", [companyId]); data = res.rows?._array || res.rows; } catch(err) { error = err; }`
);
fs.writeFileSync(file3, code3);

console.log("Done fixed");
