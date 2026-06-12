const fs = require('fs');
const files = [
    'UnivHotelReview.jsx', 'UnivImmunization.jsx', 'UnivInKindDonation.jsx', 'UnivInsurancePolicy.jsx'
];

files.forEach(f => {
    const path = `src/components/universal/${f}`;
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Remove import
    content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*['"][^'"]+['"];?\n?/g, '');
    
    // Replace DB import if missing
    if (!content.includes('powerSync as db') && !content.includes('usePowerSync')) {
        if (content.includes('import { powerSync }')) {
            content = content.replace('import { powerSync }', 'import { powerSync as db }');
        } else {
            content = content.replace(/(import .*?;?\n)(?!import)/, '$1import { powerSync as db } from "@/api/PowerSyncConnector";\n');
        }
    }

    // Replace SELECT
    content = content.replace(/(?:const\s+\{\s*data(?:,\s*error)?\s*\}\s*=\s*await\s+|await\s+)supabase[\s\S]*?\.from\(['"]([^'"]+)['"]\)[\s\S]*?\.select\(['"]\*['"]\)([\s\S]*?);/g, (match, table, eqs) => {
        // Find order if it exists
        let cleanEqs = eqs;
        let orderClause = "";
        const orderMatch = eqs.match(/\.order\(['"]([^'"]+)['"],\s*\{\s*ascending:\s*(true|false)\s*\}\)/);
        if (orderMatch) {
            cleanEqs = eqs.replace(orderMatch[0], '');
            const ascStr = orderMatch[2] === 'true' ? 'ASC' : 'DESC';
            orderClause = ` ORDER BY ${orderMatch[1]} ${ascStr}`;
        }

        const eqMatches = [...cleanEqs.matchAll(/\.eq\(['"]([^'"]+)['"],\s*([^)]+)\)/g)];
        const whereClause = eqMatches.length ? "WHERE " + eqMatches.map(m => `${m[1]} = ?`).join(' AND ') : "";
        const whereVals = eqMatches.map(m => m[2]).join(', ');
        
        return `(async () => { const res = await db.execute(\`SELECT * FROM ${table} ${whereClause}${orderClause}\`, [${whereVals}]); return { data: res.rows ? (res.rows._array || Array.from(res.rows)) : [], error: null }; })();`;
    });

    // Replace INSERT
    content = content.replace(/(?:const\s+\{\s*error\s*\}\s*=\s*await\s+|await\s+)supabase[\s\S]*?\.from\(['"]([^'"]+)['"]\)[\s\S]*?\.insert\(([^)]+)\);?/g, (match, table, payload) => {
        let cleanPayload = payload.trim();
        if (cleanPayload.startsWith('[')) cleanPayload = cleanPayload.slice(1, -1).trim();
        return `(async () => { const p = ${cleanPayload}; const keys = Object.keys(p); const vals = Object.values(p).map(v => typeof v === 'object' ? JSON.stringify(v) : v); await db.execute(\`INSERT INTO ${table} (\${keys.join(', ')}) VALUES (\${keys.map(()=>'?').join(', ')})\`, vals); return { error: null }; })();`;
    });

    fs.writeFileSync(path, content, 'utf8');
});
