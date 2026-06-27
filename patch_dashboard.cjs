const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EnterpriseDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the Security Leak: Fetch ONLY companies the user has access to.
// We will replace the fetchPortfolio logic.
content = content.replace(
  /const fetchPortfolio = async \(\) => \{[\s\S]*?setLoading\(false\);\n  \};/,
  `const fetchPortfolio = async () => {
    try {
      if (!user?.id || !user?.available_companies?.length) {
        setPortfolio([]);
        setLoading(false);
        return;
      }
      
      const companyIds = user.available_companies.map(c => c.id);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);
        
      if (error) throw error;
      
      // Ensure current company is always in the list if not fetched
      let finalData = data || [];
      if (user.company_id && !finalData.find(c => c.id === user.company_id)) {
         const { data: currentCompany } = await supabase.from('companies').select('*').eq('id', user.company_id).single();
         if (currentCompany) finalData.push(currentCompany);
      }
      
      setPortfolio(finalData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch enterprise portfolio:", err);
      setLoading(false);
    }
  };`
);

// 2. Fix the "Global Portfolio Intelligence" dark color
// Change bg-slate-900 / dark backgrounds to white/emerald
content = content.replace(
  /className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200\/40 dark:shadow-none h-full flex flex-col"/g,
  `className="bg-white dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-800/30 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none h-full flex flex-col"`
);

content = content.replace(
  /className="bg-gradient-to-r from-slate-900 to-emerald-950 p-5 flex items-center justify-between"/g,
  `className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border-b border-emerald-100 dark:border-emerald-800/30 p-5 flex items-center justify-between"`
);

content = content.replace(
  /className="text-white text-lg font-bold tracking-tight">Global Portfolio Intelligence/g,
  `className="text-emerald-900 dark:text-emerald-100 text-lg font-bold tracking-tight">Global Portfolio Intelligence`
);

content = content.replace(
  /className="text-emerald-200\/60 text-sm">AI Agent connected/g,
  `className="text-emerald-600/80 dark:text-emerald-400/80 text-sm">AI Agent connected`
);

content = content.replace(
  /className="flex-1 bg-slate-50 dark:bg-slate-950 relative min-h-\[600px\]"/g,
  `className="flex-1 bg-white dark:bg-transparent relative min-h-[600px]"`
);

content = content.replace(
  /<Globe className="w-96 h-96" \/>/g,
  `<Globe className="w-96 h-96 text-emerald-900" />`
);


// 3. Fix the Scroll issue in the Deploy Vertical Modal (remove overflow-hidden)
content = content.replace(
  /className="max-w-4xl max-h-\[85vh\] overflow-y-auto p-0 rounded-3xl border-0 overflow-hidden"/g,
  `className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 rounded-3xl border-0"`
);


// 4. Implement the Super Admin style Vertical Switching logic
// We need to change how `setSelectedVertical` acts, or add a function to actually SWITCH.
// In the dropdown:
content = content.replace(
  /onClick=\{\(\) => setSelectedVertical\(company\)\}/g,
  `onClick={() => handleVerticalSwitch(company)}`
);

// Add the handleVerticalSwitch function right after fetchPortfolio
const switchFunction = `
  const handleVerticalSwitch = (company) => {
    setSelectedVertical(company);
    // Behave like Super Admin: override industry and reload
    const newIndustry = company.industry_type || company.industry;
    if (newIndustry) {
      sessionStorage.setItem('slate_industry_override', newIndustry);
      toast.success(\`Switched to \${newIndustry} vertical\`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
`;

content = content.replace(
  /useEffect\(\(\) => \{/g,
  switchFunction + '\n  useEffect(() => {'
);


fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed EnterpriseDashboard.jsx");
