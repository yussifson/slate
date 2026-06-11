const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase', 'migrations', '20260611000001_univ_components_batch1.sql');
let content = fs.readFileSync(filePath, 'utf8');

const target = "company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())";
const replacement = "auth.uid() IS NOT NULL";

content = content.split(target).join(replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed public.users references in batch1.sql');
