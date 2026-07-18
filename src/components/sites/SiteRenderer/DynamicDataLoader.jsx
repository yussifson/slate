import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * useDynamicData — Custom hook that fetches live data from Slate modules.
 *
 * @param {string} siteId      – UUID of the site
 * @param {string} companyId   – UUID of the company
 * @param {string} sectionType – One of: 'booking', 'products', 'menu', 'jobs'
 *
 * @returns {{ data: any[], loading: boolean, error: string|null }}
 */
export function useDynamicData(siteId, companyId, sectionType) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!companyId || !sectionType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        let result = [];

        switch (sectionType) {

          /* -- BOOKINGS ------------------------------------------------- */
          case 'booking':
          case 'bookings': {
            const { data: rows, error: err } = await supabase
              .from('univ_bookings')
              .select('id, title, description, start_time, end_time, capacity, price, status, image_url')
              .eq('company_id', companyId)
              .eq('status', 'available')
              .order('start_time', { ascending: true })
              .limit(50);
            if (err) throw err;
            result = rows || [];
            break;
          }

          /* -- PRODUCTS ------------------------------------------------- */
          case 'products':
          case 'product': {
            // Try univ_inventory first, fall back to retail_inventory
            let rows = null;
            let fetchErr = null;

            ({ data: rows, error: fetchErr } = await supabase
              .from('univ_inventory')
              .select('id, name, description, price, sale_price, image_url, category, stock_quantity, sku, is_active')
              .eq('company_id', companyId)
              .eq('is_active', true)
              .order('name')
              .limit(100));

            if (fetchErr || !rows) {
              ({ data: rows, error: fetchErr } = await supabase
                .from('retail_inventory')
                .select('id, name, description, price, sale_price, image_url, category, stock_quantity, sku')
                .eq('company_id', companyId)
                .order('name')
                .limit(100));
              if (fetchErr) throw fetchErr;
            }

            result = rows || [];
            break;
          }

          /* -- MENU ----------------------------------------------------- */
          case 'menu':
          case 'menu_items': {
            let rows = null;
            let fetchErr = null;

            ({ data: rows, error: fetchErr } = await supabase
              .from('univ_menu_items')
              .select('id, name, description, price, category, image_url, is_available, dietary_info, allergens')
              .eq('company_id', companyId)
              .eq('is_available', true)
              .order('category')
              .limit(200));

            if (fetchErr || !rows) {
              ({ data: rows, error: fetchErr } = await supabase
                .from('dining_items')
                .select('id, name, description, price, category, image_url, is_available')
                .eq('company_id', companyId)
                .order('category')
                .limit(200));
              if (fetchErr) throw fetchErr;
            }

            result = rows || [];
            break;
          }

          /* -- JOBS ----------------------------------------------------- */
          case 'jobs':
          case 'careers': {
            // Try a dedicated jobs table first, fall back to hr employees for open roles
            let rows = null;
            let fetchErr = null;

            // Attempt a dedicated jobs/positions table
            ({ data: rows, error: fetchErr } = await supabase
              .from('univ_job_postings')
              .select('id, title, department, location, type, description, requirements, salary_range, posted_at, is_active')
              .eq('company_id', companyId)
              .eq('is_active', true)
              .order('posted_at', { ascending: false })
              .limit(50));

            if (fetchErr || !rows || rows.length === 0) {
              // Fallback: look at HR employees table for open_position markers
              ({ data: rows, error: fetchErr } = await supabase
                .from('univ_hr_employees')
                .select('id, job_title, department, location, employment_type, notes')
                .eq('company_id', companyId)
                .eq('status', 'open_position')
                .limit(50));

              if (fetchErr) {
                // Still failing — return empty array (not all companies have jobs data)
                result = [];
                break;
              }
            }

            result = rows || [];
            break;
          }

          /* -- UNKNOWN -------------------------------------------------- */
          default:
            result = [];
        }

        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn(`[useDynamicData] Could not load "${sectionType}" data:`, err?.message || err);
          setData([]);
          setError(err?.message || 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [siteId, companyId, sectionType]);

  return { data, loading, error };
}

export default useDynamicData;
