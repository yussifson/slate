const fs = require('fs');
let code = fs.readFileSync('src/api/RealEstateAPI.js', 'utf8');

code = code.replace(/INSERT INTO audit_logs \(user_id, action, record_type, record_id, changes, created_at\) VALUES \(\?, \?, \?, \?, \?, \?\)',\s*\[(.*?)\]/g, 
  "INSERT INTO audit_logs (id, user_id, action, record_type, record_id, changes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',\n        [crypto.randomUUID(), $1]");

fs.writeFileSync('src/api/RealEstateAPI.js', code);
