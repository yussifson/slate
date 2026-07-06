const fs = require('fs');

// Fix RealEstateAPI.js
let apiCode = fs.readFileSync('src/api/RealEstateAPI.js', 'utf8');

// The pattern to replace
const targetPattern = /Object\.keys\(data\)\.forEach\(key => \{\s*if \(key !== 'id' && key !== 'company_id' && key !== 'created_at'\) \{\s*updates\.push\(`\$\{key\} = \?`\);\s*params\.push\(typeof data\[key\] === 'object' \? JSON\.stringify\(data\[key\]\) : data\[key\]\);\s*\}\s*\}\);/g;

const replacement = `const toSnakeCase = str => str.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
      Object.keys(data).forEach(key => {
        const dbKey = toSnakeCase(key);
        if (dbKey !== 'id' && dbKey !== 'company_id' && dbKey !== 'created_at' && data[key] !== undefined) {
          updates.push(\`\${dbKey} = ?\`);
          params.push(typeof data[key] === 'object' && data[key] !== null ? JSON.stringify(data[key]) : data[key]);
        }
      });`;

apiCode = apiCode.replace(targetPattern, replacement);
fs.writeFileSync('src/api/RealEstateAPI.js', apiCode);

// Fix RealEstateAnalytics.js
let analyticsCode = fs.readFileSync('src/api/RealEstateAnalytics.js', 'utf8');

analyticsCode = analyticsCode.replace(/t\.transaction_type = 'sale'/g, "t.status = 'closed'");
analyticsCode = analyticsCode.replace(/t\.transaction_amount/g, "t.sale_price");
analyticsCode = analyticsCode.replace(/transaction_type = 'sale'/g, "status = 'closed'");
analyticsCode = analyticsCode.replace(/transaction_type = 'lease'/g, "status = 'active'"); // assuming lease active status

if (!analyticsCode.includes('getClientScoring')) {
    const getClientScoringFunc = `
  async getClientScoring(companyId) {
    try {
      const result = await powerSync.execute(
        'SELECT * FROM univ_re_client_scoring WHERE company_id = ? ORDER BY last_scored DESC LIMIT 100',
        [companyId]
      );
      return result.rows._array || [];
    } catch (e) {
      console.error('[Analytics] getClientScoring failed:', e);
      return [];
    }
  },`;

    analyticsCode = analyticsCode.replace(
        /\/\/\s*────────────────────────────────────────────────────────\s*\/\/\s*AGENT METRICS/,
        `${getClientScoringFunc}\n\n  // ────────────────────────────────────────────────────────\n  // AGENT METRICS`
    );
    // If the above failed because the comment wasn't exact, just append before the last closing brace
    if (!analyticsCode.includes('getClientScoring')) {
      analyticsCode = analyticsCode.replace(/};\s*$/g, `${getClientScoringFunc}\n};\n`);
    }
}

fs.writeFileSync('src/api/RealEstateAnalytics.js', analyticsCode);
console.log('Scripts patched successfully');
