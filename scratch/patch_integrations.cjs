const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Integrations.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getTerm import
if (!content.includes('import { getTerm } from "@/config/industries";')) {
  content = content.replace(
    'import { useAuth } from \'@/lib/AuthContext\';',
    'import { useAuth } from \'@/lib/AuthContext\';\nimport { getTerm } from "@/config/industries";'
  );
}

// 2. Add activeIndustry variable inside component
if (!content.includes('const activeIndustry = user?.company_industry || "law";')) {
  content = content.replace(
    'const { user } = useAuth();',
    'const { user } = useAuth();\n  const activeIndustry = user?.company_industry || "law";'
  );
}

// 3. Dynamic descriptions inside filteredApps.map
content = content.replace(
  'const isConnected = !!connectedApps[app.provider];\n            const isLoading = loadingAppId === app.id;',
  `const isConnected = !!connectedApps[app.provider];
            const isLoading = loadingAppId === app.id;
            
            let appDescription = app.description;
            if (app.id === 'docusign') {
              appDescription = "Send contracts, agreements, and forms for legally binding e-signatures directly from " + getTerm(activeIndustry, "case").toLowerCase() + " records.";
            } else if (app.id === 'whatsapp_business') {
              appDescription = "Send automated SMS and WhatsApp reminders for " + getTerm(activeIndustry, "hearing").toLowerCase() + "s and billing notifications.";
            }`
);

// Replace render call with dynamic appDescription
content = content.replace(
  '<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{app.description}</p>',
  '<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{appDescription}</p>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Integrations.jsx patched successfully!");
