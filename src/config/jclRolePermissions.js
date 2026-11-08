/**
 * JCL Real Estate & Construction Role-Based Access Control (RBAC)
 * 
 * Rules:
 * - company_admin / super_admin: Full access to all features across all departments
 * - operations: Shared core accessible to ALL staff (Dashboard, Intelligence, Calendar, Tasks, Time Tracking, Pipeline, Notifications, Chat, Board, Inbox, Smart Docs)
 * - hr: Operations + All HR features (/hr, /team, /hr/roles, /hr/departments, /attendance, /performance, /jcl/employee-assets)
 * - finance: Operations + All Finance features (/finance/accounting, /invoices, /billing, /expenses, /payroll, /jcl/project-finance, /real-estate/payment-schedules, /real-estate/commissions)
 * - marketing: Operations + All Marketing features (/jcl/engagements, /real-estate/clients, /real-estate/viewings, /real-estate/offers, /real-estate/counter-offers, /real-estate/crm-leads, /real-estate/customer-timeline, /real-estate/analytics, /real-estate/field-tracker)
 * - it: Everything EXCEPT HR (/hr, /team, /hr/assets) and Finance (/finance/accounting, /payroll, /invoices, /jcl/project-finance)
 * - procurement: Operations + All Procurement features (/jcl/procurement, /jcl/requisitions, /jcl/purchase-orders, /jcl/inventory)
 * - engineering: Operations + All Engineering features (/engineering, /engineering/drawings, /boq, /jcl/projects) + All Procurement features (/jcl/procurement, /jcl/requisitions, /jcl/purchase-orders, /jcl/inventory)
 * - secretary: Operations + All Secretary / Front Desk features (/jcl/front-desk, /jcl/item-register)
 */

export const JCL_OPERATIONS_PATHS = [
  '/',
  '/my-dashboard',
  '/real-estate/analytics',
  '/intelligence',
  '/calendar',
  '/tasks',
  '/time-tracking',
  '/pipeline',
  '/notifications',
  '/chat',
  '/board',
  '/email-inbox',
  '/smart-docs',
  '/settings',
  '/integrations',
  '/portal'
];

export const JCL_HR_PATHS = [
  '/hr',
  '/team',
  '/employees',
  '/roles',
  '/departments',
  '/attendance',
  '/performance',
  '/hr/assets',
  '/jcl/employee-assets',
  '/real-estate/team-management'
];

export const JCL_FINANCE_PATHS = [
  '/finance/accounting',
  '/jcl/project-finance',
  '/invoices',
  '/billing',
  '/payroll',
  '/expenses',
  '/fees',
  '/real-estate/payment-schedules',
  '/real-estate/commissions',
  '/real-estate/commission-rules',
  '/real-estate/escrow',
  '/real-estate/rent-payments'
];

export const JCL_MARKETING_PATHS = [
  '/jcl/engagements',
  '/real-estate/clients',
  '/real-estate/viewings',
  '/real-estate/offers',
  '/real-estate/counter-offers',
  '/real-estate/crm-leads',
  '/real-estate/customer-timeline',
  '/real-estate/field-tracker',
  '/real-estate/marketer-tracker'
];

export const JCL_PROCUREMENT_PATHS = [
  '/jcl/procurement',
  '/jcl/requisitions',
  '/jcl/purchase-orders',
  '/jcl/inventory',
  '/procurement'
];

export const JCL_ENGINEERING_PATHS = [
  '/engineering',
  '/engineering/drawings',
  '/boq',
  '/bom',
  '/jcl/projects'
];

export const JCL_SECRETARY_PATHS = [
  '/jcl/front-desk',
  '/jcl/item-register'
];

export const JCL_PROPERTIES_PATHS = [
  '/real-estate/properties',
  '/real-estate/leases',
  '/real-estate/lease-renewals',
  '/real-estate/maintenance',
  '/real-estate/contractors',
  '/real-estate/contractor-reviews',
  '/real-estate/market-data',
  '/real-estate/comparable-properties'
];

/**
 * Returns allowed paths for a given role in JCL
 */
export function getJCLRolePermissions(roleName) {
  const r = (roleName || '').toLowerCase().trim();

  // Company Admin / Super Admin gets everything (null signifies unrestricted)
  if (['company_admin', 'super_admin', 'admin', 'managing_partner', 'owner'].includes(r)) {
    return null;
  }

  // HR
  if (['hr', 'hr_manager', 'human_resources', 'recruiter', 'hr_officer'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_HR_PATHS
    ]));
  }

  // Finance
  if (['finance', 'accountant', 'finance_officer', 'payroll_officer', 'treasurer'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_FINANCE_PATHS
    ]));
  }

  // Marketing
  if (['marketing', 'marketing_executive', 'marketer', 'field_tracker', 'crm_lead', 'agent', 'real_estate_agent'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_MARKETING_PATHS,
      ...JCL_PROPERTIES_PATHS
    ]));
  }

  // IT & Support (Everything EXCEPT HR and Finance)
  if (['it', 'it_support', 'tech', 'system_admin', 'developer'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_MARKETING_PATHS,
      ...JCL_PROCUREMENT_PATHS,
      ...JCL_ENGINEERING_PATHS,
      ...JCL_SECRETARY_PATHS,
      ...JCL_PROPERTIES_PATHS,
      '/sites',
      '/integrations',
      '/real-estate/audit-log'
    ]));
  }

  // Procurement
  if (['procurement', 'procurement_officer', 'logistics', 'supply_chain', 'inventory_manager'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_PROCUREMENT_PATHS
    ]));
  }

  // Engineering (All Engineering + All Procurement + Operations)
  if (['engineering', 'engineer', 'lead_engineer', 'site_supervisor', 'quantity_surveyor', 'project_manager', 'architect'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_ENGINEERING_PATHS,
      ...JCL_PROCUREMENT_PATHS
    ]));
  }

  // Secretary / Front Desk
  if (['secretary', 'front_desk', 'receptionist', 'clerk', 'office_administrator'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_SECRETARY_PATHS
    ]));
  }

  // Property Manager
  if (['property_manager', 'landlord', 'estate_manager'].includes(r)) {
    return Array.from(new Set([
      ...JCL_OPERATIONS_PATHS,
      ...JCL_PROPERTIES_PATHS,
      '/jcl/engagements'
    ]));
  }

  // Default fallback: Always grant Operations paths to any valid authenticated employee
  return JCL_OPERATIONS_PATHS;
}

/**
 * Standard Default Roles available to all companies and selectable across HR & Staffing
 */
export const DEFAULT_PLATFORM_ROLES = [
  { id: 'admin', label: 'Company Admin / Executive', department: 'Administration', description: 'Full access to all system modules, settings and departments' },
  { id: 'finance', label: 'Finance & Accounting', department: 'Finance', description: 'Access to accounting, project finance, billing, invoices, payroll & expenses' },
  { id: 'hr', label: 'Human Resources', department: 'Human Resources', description: 'Access to employee directory, attendance, performance, assets & HR management' },
  { id: 'marketing', label: 'Marketing & Sales', department: 'Marketing', description: 'Access to CRM leads, client directory, property viewings, offers & campaigns' },
  { id: 'engineering', label: 'Engineering & Construction', department: 'Engineering', description: 'Access to engineering drawings, BOQ, projects & procurement' },
  { id: 'procurement', label: 'Procurement & Logistics', department: 'Procurement', description: 'Access to requisitions, purchase orders, inventory & suppliers' },
  { id: 'secretary', label: 'Secretary / Front Desk', department: 'Administration', description: 'Access to visitor logs, front desk reception & office custody items' },
  { id: 'it', label: 'IT & Support / Systems', department: 'IT & Support', description: 'Technical infrastructure, system settings, integrations & audit logs' },
  { id: 'property_manager', label: 'Property Manager', department: 'Operations', description: 'Management of properties, tenant leases, inspections & maintenance' }
];

