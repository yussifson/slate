import { supabase } from './src/api/supabaseClient.js';
async function searchAll() {
  console.log('Searching...');
  
  const tables = ['companies', 'industry_records', 'company_custom_features', 'profiles'];
  for (const table of tables) {
     const { data, error } = await supabase.from(table).select('*').limit(100);
     if (error) console.error(error);
     if (data) {
       for (const row of data) {
         const str = JSON.stringify(row);
         if (str.includes('istockphoto.com') || str.includes('ecology')) {
            console.log('Found in ' + table + ': ' + row.id);
            console.log(str.substring(Math.max(0, str.indexOf('istock') - 20), str.indexOf('istock') + 100));
         }
       }
     }
  }
  console.log('Done');
}
searchAll();
