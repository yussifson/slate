const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/USER/OneDrive/Documents/airflake/src/components/universal';
const targets = ['UnivTenant.jsx', 'UnivTimebilling.jsx', 'UnivTrademark.jsx'];

for (const file of targets) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Replace useEffect
  content = content.replace(/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(companyId\)\s*\{\s*fetchData\(\);\s*const\s+channel[\s\S]*?\}\s*\},/g,
    'useEffect(() => { if (companyId) { fetchData(); } },');

  // Replace fetchData
  const tableMatch = content.match(/from\('([^']+)'\)/);
  if (tableMatch) {
    const table = tableMatch[1];
    content = content.replace(/const\s+fetchData[\s\S]*?finally\s*\{\s*setLoading\(false\);\s*\}\s*\};/g,
      "const fetchData = async () => { setLoading(true); try { const { rows } = await db.execute('SELECT * FROM " + table + " WHERE company_id = ? ORDER BY created_at DESC', [companyId]); setData(rows?._array || []); } catch (err) { console.error(err); toast.error(err.message || 'Failed to fetch data'); } finally { setLoading(false); } };");
  }

  fs.writeFileSync(path.join(dir, file), content);
}

// Timeline
let tcontent = fs.readFileSync(path.join(dir, 'UnivTimeline.jsx'), 'utf8');
tcontent = tcontent.replace(/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(companyId\)\s*\{\s*const\s+channel[\s\S]*?\}\s*\},/g,
  'useEffect(() => { if (companyId) { } },');
fs.writeFileSync(path.join(dir, 'UnivTimeline.jsx'), tcontent);

