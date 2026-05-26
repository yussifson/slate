const fs = require('fs');
const schemaPath = 'supabase/schema.sql';
const originalSchema = fs.readFileSync(schemaPath, 'utf8');

const drops = `
-- MASTER RESET: Drop old buggy tables to force recreation (Preserving your new firm & profile)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.case_emails CASCADE;
DROP TABLE IF EXISTS public.case_messages CASCADE;
DROP TABLE IF EXISTS public.case_outcomes CASCADE;
DROP TABLE IF EXISTS public.case_pipelines CASCADE;
DROP TABLE IF EXISTS public.case_pipeline_states CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.client_checklists CASCADE;
DROP TABLE IF EXISTS public.client_messages CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.firm_settings CASCADE;
DROP TABLE IF EXISTS public.hearings CASCADE;
DROP TABLE IF EXISTS public.h_r_complaints CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.legal_cases CASCADE;
DROP TABLE IF EXISTS public.linked_emails CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payroll_slips CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.retainers CASCADE;
DROP TABLE IF EXISTS public.signature_requests CASCADE;
DROP TABLE IF EXISTS public.staff_permissions CASCADE;
DROP TABLE IF EXISTS public.staff_records CASCADE;
DROP TABLE IF EXISTS public.subscription_invoices CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.time_entries CASCADE;

`;

if (!originalSchema.includes('MASTER RESET')) {
  fs.writeFileSync(schemaPath, drops + originalSchema);
  console.log("Prepended drops to schema.sql");
} else {
  console.log("Drops already exist");
}
