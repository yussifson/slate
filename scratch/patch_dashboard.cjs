const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'SuperAdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getTerm import
if (!content.includes('import { getTerm } from "@/config/industries";')) {
  content = content.replace(
    'import { useAuth } from "@/lib/AuthContext";',
    'import { useAuth } from "@/lib/AuthContext";\nimport { getTerm } from "@/config/industries";'
  );
}

// 2. Add activeIndustry variable inside component
if (!content.includes('const activeIndustry = user?.company_industry || "law";')) {
  content = content.replace(
    'const { user, refreshUser } = useAuth();',
    'const { user, refreshUser } = useAuth();\n  const activeIndustry = user?.company_industry || "law";'
  );
}

// 3. Dynamic terms replacement
content = content.replace(
  'h1 className="text-xl font-bold">{t("firm_setup", "Firm Setup")}</h1>',
  'h1 className="text-xl font-bold">{t("firm_setup", (getTerm(activeIndustry, "venue") || "Firm") + " Setup")}</h1>'
);

content = content.replace(
  'p className="text-sm text-muted-foreground">{t(\n            "configure_your_law_firm_and_ma",\n            "Configure your law firm and manage team members."\n          )}</p>',
  'p className="text-sm text-muted-foreground">{t("configure_your_law_firm_and_ma", "Configure your " + (getTerm(activeIndustry, "venue") || "firm").toLowerCase() + " and manage team members.")}</p>'
);

content = content.replace(
  't("setup_firm", "Setup Firm")',
  't("setup_firm", "Setup " + (getTerm(activeIndustry, "venue") || "Firm"))'
);

content = content.replace(
  't("max_cases", "Max Cases")',
  't("max_cases", "Max " + (getTerm(activeIndustry, "cases") || "Cases"))'
);

content = content.replace(
  't("edit_firm_details", "Edit Firm Details")',
  't("edit_firm_details", "Edit " + (getTerm(activeIndustry, "venue") || "Firm") + " Details")'
);

content = content.replace(
  't("no_firm_configured_yet", "No firm configured yet.")',
  't("no_firm_configured_yet", "No " + (getTerm(activeIndustry, "venue") || "firm").toLowerCase() + " configured yet.")'
);

content = content.replace(
  't("setup_your_firm", "Setup Your Firm")',
  't("setup_your_firm", "Setup Your " + (getTerm(activeIndustry, "venue") || "Firm"))'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("SuperAdminDashboard.jsx patched successfully!");
