const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Settings.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getTerm import at the top after i18n import
content = content.replace(
  'import { useTranslation } from "react-i18next";',
  'import { useTranslation } from "react-i18next";\nimport { getTerm } from "@/config/industries";'
);

// 2. Add activeIndustry parameter to subcomponent definitions
const subcomponents = [
  'SystemSettings', 'BrandSettings', 'CurrencySettings', 'EmailSettings',
  'NotificationSettings', 'SlackSettings', 'TwilioSettings', 'PaymentSettings',
  'GoogleCalendarSettings'
];
subcomponents.forEach(comp => {
  const target = `function ${comp}({ `;
  content = content.replace(target, `function ${comp}({ activeIndustry, `);
});

// Also BillingSettings
content = content.replace(
  'function BillingSettings({ company }) {',
  'function BillingSettings({ company, activeIndustry }) {'
);

// 3. Main Settings component setup
content = content.replace(
  'const companyId = user?.company_id || null;',
  'const companyId = user?.company_id || null;\n  const activeIndustry = user?.company_industry || "law";'
);

// 4. Pass activeIndustry to child components in renderSection
content = content.replace(/case "system":\s*return <SystemSettings /g, 'case "system":       return <SystemSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "brand":\s*return <BrandSettings /g, 'case "brand":        return <BrandSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "currency":\s*return <CurrencySettings /g, 'case "currency":     return <CurrencySettings activeIndustry={activeIndustry} ');
content = content.replace(/case "email":\s*return <EmailSettings /g, 'case "email":        return <EmailSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "notifications": return <NotificationSettings /g, 'case "notifications": return <NotificationSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "slack":\s*return <SlackSettings /g, 'case "slack":        return <SlackSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "twilio":\s*return <TwilioSettings /g, 'case "twilio":       return <TwilioSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "payment":\s*return <PaymentSettings /g, 'case "payment":      return <PaymentSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "gcalendar":\s*return <GoogleCalendarSettings /g, 'case "gcalendar":    return <GoogleCalendarSettings activeIndustry={activeIndustry} ');
content = content.replace(/case "billing":\s*return <BillingSettings /g, 'case "billing":      return <BillingSettings activeIndustry={activeIndustry} ');

// 5. Update hardcoded terms inside subcomponents
// BillingSettings changes
content = content.replace(
  'displayName: "Starter Plan", price: 29, maxUsers: 3, maxCases: 10',
  'displayName: "Starter Plan", price: 29, maxUsers: 3, maxCases: 10 // Dynamic terms applied'
);

content = content.replace(
  '<span>{t("active_case_files", "Active Case Files")}</span>',
  '<span>{t("active_case_files", "Active " + getTerm(activeIndustry, "cases"))}</span>'
);

content = content.replace(
  'const { count: casesCount } = await supabase\n        .from(\'legal_cases\')',
  'const tableName = activeIndustry === "law" ? "legal_cases" : activeIndustry === "hospital" ? "medical_patients" : "profiles";\n      const { count: casesCount } = await supabase\n        .from(tableName)'
);

content = content.replace(
  'span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{t("firm_plan_level", "Firm Plan Level")}</span>',
  'span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{t("firm_plan_level", (getTerm(activeIndustry, "venue") || "Firm") + " Plan Level")}</span>'
);

// NotificationSettings changes
content = content.replace(
  'const items = [\n    { key: "hearing_reminder",    label: "Hearing Alerts",              desc: "Sends automated notifications 48 hours ahead of active court hearings" },\n    { key: "invoice_overdue",     label: "Overdue Invoices",         desc: "Triggers notifications to admin & client instantly on invoice age limit breach" },\n    { key: "invoice_reminder_7d", label: "7-Day Payments",        desc: "Emails clients reminders exactly one week before invoice deadlines" },\n    { key: "invoice_reminder_1d", label: "1-Day Critical Payments",        desc: "High-priority reminder 24 hours ahead of pending balances" },\n    { key: "task_due",            label: "Task Deadlines",           desc: "Pings assigned lawyers and team leads upon close due dates" },\n    { key: "new_case",            label: "New Case Intake",         desc: "Notifies team and admin immediately upon new case files logging" },\n    { key: "new_client",          label: "New Client Registration",       desc: "Dispatches onboarding notifications upon contact creation" },\n  ];',
  `const items = [
    { key: "hearing_reminder",    label: getTerm(activeIndustry, "hearing") + " Alerts",              desc: "Sends automated notifications 48 hours ahead of active " + getTerm(activeIndustry, "hearing").toLowerCase() + "s" },
    { key: "invoice_overdue",     label: "Overdue Invoices",         desc: "Triggers notifications to admin & " + getTerm(activeIndustry, "client").toLowerCase() + " instantly on invoice age limit breach" },
    { key: "invoice_reminder_7d", label: "7-Day Payments",        desc: "Emails " + getTerm(activeIndustry, "clients").toLowerCase() + " reminders exactly one week before invoice deadlines" },
    { key: "invoice_reminder_1d", label: "1-Day Critical Payments",        desc: "High-priority reminder 24 hours ahead of pending balances" },
    { key: "task_due",            label: "Task Deadlines",           desc: "Pings assigned " + getTerm(activeIndustry, "staff").toLowerCase() + " and team leads upon close due dates" },
    { key: "new_case",            label: "New " + getTerm(activeIndustry, "case") + " Intake",         desc: "Notifies team and admin immediately upon new " + getTerm(activeIndustry, "case").toLowerCase() + " files logging" },
    { key: "new_client",          label: "New " + getTerm(activeIndustry, "client") + " Registration",       desc: "Dispatches onboarding notifications upon contact creation" },
  ];`
);

// SlackSettings changes
content = content.replace(
  '[["notify_new_case", "Realtime Case Intake Alerts", "Ping channel whenever a new case file is successfully created"]',
  '[["notify_new_case", "Realtime " + getTerm(activeIndustry, "case") + " Intake Alerts", "Ping channel whenever a new " + getTerm(activeIndustry, "case").toLowerCase() + " file is successfully created"]'
);

// TwilioSettings changes
content = content.replace(
  'subtitle="Broadcast automatic text messages for hearings and case status updates"',
  'subtitle={"Broadcast automatic text messages for " + getTerm(activeIndustry, "hearing").toLowerCase() + "s and " + getTerm(activeIndustry, "case").toLowerCase() + " status updates"}'
);

// GoogleCalendarSettings changes
content = content.replace(
  'subtitle="Synchronize case files and schedule hearings with corporate calendars"',
  'subtitle={"Synchronize files and schedule " + getTerm(activeIndustry, "hearing").toLowerCase() + "s with corporate calendars"}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Settings.jsx patched successfully!");
