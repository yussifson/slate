import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking Supabase connection...");
  
  // 1. Check companies
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('id, name, industry_type, custom_domain');
  console.log("Companies:", companies, "Error:", compErr);

  // 2. Check univ_re_properties
  const { data: props, error: propErr } = await supabase
    .from('univ_re_properties')
    .select('id, company_id, property_type, address, features');
  console.log("Properties total:", props?.length, "Error:", propErr);
  if (props) {
    const landProps = props.filter(p => p.property_type === 'land' || p.property_type === 'parcel');
    console.log("Land properties count:", landProps.length);
    landProps.forEach(p => console.log(` - ID: ${p.id}, Company: ${p.company_id}, Type: ${p.property_type}, Address: ${p.address}`));
  }

  // 3. Check univ_land_parcels
  const { data: parcels, error: parcelErr } = await supabase
    .from('univ_land_parcels')
    .select('*');
  console.log("univ_land_parcels:", parcels?.length, "Error:", parcelErr?.message || parcelErr);

  // 4. Check univ_re_leads
  const { data: leads, error: leadErr } = await supabase
    .from('univ_re_leads')
    .select('*');
  console.log("univ_re_leads total:", leads?.length, "Error:", leadErr?.message || leadErr);
  if (leads) {
    leads.forEach(l => console.log(` - Lead: ${l.first_name} ${l.last_name}, Company: ${l.company_id}, Status: ${l.status}, Created: ${l.created_at}`));
  }
}

check();
