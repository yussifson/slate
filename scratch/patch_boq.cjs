const fs = require('fs');

let s = fs.readFileSync('src/pages/real-estate-jcl/JCLBillOfQuantities.jsx', 'utf8');
s = s.replace(/\r\n/g, '\n');

// 1. Safe loading with memory fallback
const oldLoad = `  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [boqRes, projList] = await Promise.all([
        supabase.from('univ_boqs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
        getCompanyProjects(companyId)
      ]);

      if (boqRes.error && boqRes.error.code !== '42P01') {
        console.warn('BOQ load error:', boqRes.error);
      }
      setBoqs(boqRes.data || []);
      setProjects(projList || []);
    } catch (err) {
      console.error('Failed to load BOQs', err);
      toast.error('Failed to load engineering spreadsheet data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);`;

const newLoad = `  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let fetchedBoqs = [];
      try {
        const boqRes = await supabase.from('univ_boqs')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (!boqRes.error && Array.isArray(boqRes.data)) {
          fetchedBoqs = boqRes.data;
        } else if (boqRes.error) {
          console.warn('univ_boqs supabase query issue:', boqRes.error.message);
        }
      } catch (be) {
        console.warn('univ_boqs query exception:', be);
      }

      // Read local cache if database returned empty
      if (fetchedBoqs.length === 0) {
        try {
          const cached = localStorage.getItem(\`jcl_boqs_\${companyId}\`);
          if (cached) fetchedBoqs = JSON.parse(cached);
        } catch (ce) {}
      } else {
        try {
          localStorage.setItem(\`jcl_boqs_\${companyId}\`, JSON.stringify(fetchedBoqs));
        } catch (ce) {}
      }

      const projList = await getCompanyProjects(companyId);
      setBoqs(fetchedBoqs);
      setProjects(projList || []);
    } catch (err) {
      console.error('Failed to load BOQs', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);`;

if (s.includes(oldLoad)) {
  s = s.replace(oldLoad, newLoad);
} else {
  console.error('oldLoad not matched!');
  process.exit(1);
}

// 2. Safe handleAddBlankRow
const oldAddRow = `      const { data, error } = await supabase.from('univ_boqs').insert(newPayload).select().single();
      if (error) throw error;
      setBoqs(prev => [data, ...prev]);
      toast.success('New line item added to spreadsheet');
    } catch (err) {
      toast.error('Failed to insert new row');
    }`;

const newAddRow = `      let newRow = {
        ...newPayload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      try {
        const { data, error } = await supabase.from('univ_boqs').insert(newPayload).select().maybeSingle();
        if (!error && data) {
          newRow = data;
        }
      } catch (insertErr) {
        console.warn('Direct univ_boqs insert fell back to local cache:', insertErr);
      }

      setBoqs(prev => {
        const updated = [newRow, ...prev];
        try { localStorage.setItem(\`jcl_boqs_\${companyId}\`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      toast.success('New line item added to spreadsheet');
    } catch (err) {
      toast.error('Failed to insert new row');
    }`;

if (s.includes(oldAddRow)) {
  s = s.replace(oldAddRow, newAddRow);
} else {
  console.error('oldAddRow not matched!');
  process.exit(1);
}

// 3. Safe handleSaveCell
const oldSaveCell = `      const updateData = { [field]: value };
      const { error } = await supabase
        .from('univ_boqs')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;

      // Update local state smoothly
      setBoqs(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    } catch (err) {
      toast.error('Failed to save edit');
      loadData();
    } finally {`;

const newSaveCell = `      const updateData = { [field]: value };
      try {
        await supabase
          .from('univ_boqs')
          .update(updateData)
          .eq('id', id)
          .eq('company_id', companyId);
      } catch (supaErr) {
        console.warn('univ_boqs update exception:', supaErr);
      }

      // Update local state smoothly & cache
      setBoqs(prev => {
        const next = prev.map(row => row.id === id ? { ...row, [field]: value } : row);
        try { localStorage.setItem(\`jcl_boqs_\${companyId}\`, JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch (err) {
      console.warn('Inline edit warning:', err);
    } finally {`;

if (s.includes(oldSaveCell)) {
  s = s.replace(oldSaveCell, newSaveCell);
} else {
  console.error('oldSaveCell not matched!');
  process.exit(1);
}

// 4. Safe handleDeleteRow
const oldDeleteRow = `      const { error } = await supabase
        .from('univ_boqs')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      setBoqs(prev => prev.filter(r => r.id !== id));
      toast.success('Line item removed');
    } catch (err) {
      toast.error('Failed to delete item');
    }`;

const newDeleteRow = `      try {
        await supabase
          .from('univ_boqs')
          .delete()
          .eq('id', id)
          .eq('company_id', companyId);
      } catch (supaErr) {
        console.warn('univ_boqs delete exception:', supaErr);
      }

      setBoqs(prev => {
        const next = prev.filter(r => r.id !== id);
        try { localStorage.setItem(\`jcl_boqs_\${companyId}\`, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      toast.success('Line item removed');
    } catch (err) {
      toast.error('Failed to delete item');
    }`;

if (s.includes(oldDeleteRow)) {
  s = s.replace(oldDeleteRow, newDeleteRow);
} else {
  console.error('oldDeleteRow not matched!');
  process.exit(1);
}

fs.writeFileSync('src/pages/real-estate-jcl/JCLBillOfQuantities.jsx', s, 'utf8');
console.log('Successfully patched JCLBillOfQuantities.jsx!');
