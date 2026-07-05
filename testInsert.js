import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const comp = {
    name: 'Test Company',
    subdomain: 'testcomp' + Date.now(),
    email: 'test@example.com',
    industry_type: 'law',
    country: 'United States of America',
    currency: 'USD',
    status: 'active'
  };
  
  console.log('Trying USD...');
  let res = await supabase.from('companies').insert([comp]).select();
  if (res.error) console.log('USD Error:', res.error);
  else console.log('USD Success!', res.data);

  comp.subdomain = 'testcomp' + Date.now();
  comp.currency = 'usd';
  console.log('Trying usd...');
  res = await supabase.from('companies').insert([comp]).select();
  if (res.error) console.log('usd Error:', res.error);
  else console.log('usd Success!', res.data);

  comp.subdomain = 'testcomp' + Date.now();
  comp.currency = null;
  console.log('Trying null...');
  res = await supabase.from('companies').insert([comp]).select();
  if (res.error) console.log('null Error:', res.error);
  else console.log('null Success!', res.data);
}

testInsert();
