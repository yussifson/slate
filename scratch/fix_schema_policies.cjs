const fs = require('fs');
const schemaPath = 'supabase/schema.sql';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace all CREATE POLICY lines with DROP POLICY IF EXISTS followed by CREATE POLICY
schema = schema.replace(/CREATE POLICY "Enable all for authenticated users" ON public\.([a-z_]+) FOR ALL USING \(auth\.role\(\) = 'authenticated'\);/g, 
  'DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.$1;\nCREATE POLICY "Enable all for authenticated users" ON public.$1 FOR ALL USING (auth.role() = \'authenticated\');'
);

fs.writeFileSync(schemaPath, schema);
console.log("Fixed policies in schema.sql");
