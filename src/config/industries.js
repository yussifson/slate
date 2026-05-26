export const INDUSTRIES = {
  law: {
    name: 'Law Firm',
    terms: {
      client: 'Client',
      clients: 'Clients',
      case: 'Case',
      cases: 'Cases',
      lawyer: 'Lawyer',
      lawyers: 'Lawyers',
      court: 'Court',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  school: {
    name: 'School',
    terms: {
      client: 'Student',
      clients: 'Students',
      case: 'Class',
      cases: 'Classes',
      lawyer: 'Teacher',
      lawyers: 'Teachers',
      court: 'Campus',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  hospital: {
    name: 'Hospital',
    terms: {
      client: 'Patient',
      clients: 'Patients',
      case: 'Admission',
      cases: 'Admissions',
      lawyer: 'Doctor',
      lawyers: 'Doctors',
      court: 'Ward',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  hotel: {
    name: 'Hotel',
    terms: {
      client: 'Guest',
      clients: 'Guests',
      case: 'Booking',
      cases: 'Bookings',
      lawyer: 'Manager',
      lawyers: 'Staff',
      court: 'Property',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  church: {
    name: 'Church',
    terms: {
      client: 'Member',
      clients: 'Members',
      case: 'Ministry',
      cases: 'Ministries',
      lawyer: 'Pastor',
      lawyers: 'Pastors',
      court: 'Branch',
    },
    modules: ['cases', 'clients', 'documents', 'tasks', 'team'],
  },
  insurance: {
    name: 'Insurance Agency',
    terms: {
      client: 'Policyholder',
      clients: 'Policyholders',
      case: 'Claim',
      cases: 'Claims',
      lawyer: 'Agent',
      lawyers: 'Agents',
      court: 'Branch',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  retail: {
    name: 'Retail / POS',
    terms: {
      client: 'Customer',
      clients: 'Customers',
      case: 'Order',
      cases: 'Orders',
      lawyer: 'Cashier',
      lawyers: 'Staff',
      court: 'Store',
    },
    modules: ['cases', 'clients', 'invoices', 'tasks', 'team'],
  },
  logistics: {
    name: 'Logistics',
    terms: {
      client: 'Shipper',
      clients: 'Shippers',
      case: 'Shipment',
      cases: 'Shipments',
      lawyer: 'Driver',
      lawyers: 'Drivers',
      court: 'Hub',
    },
    modules: ['cases', 'clients', 'invoices', 'documents', 'tasks', 'team'],
  },
  hr: {
    name: 'HR / ERP',
    terms: {
      client: 'Employee',
      clients: 'Employees',
      case: 'Project',
      cases: 'Projects',
      lawyer: 'Manager',
      lawyers: 'Managers',
      court: 'Department',
    },
    modules: ['cases', 'clients', 'documents', 'tasks', 'team'],
  },
};

export const getIndustryTerms = (industryKey) => {
  const ind = INDUSTRIES[industryKey] || INDUSTRIES.law;
  return ind.terms;
};

export const getTerm = (industryKey, termKey) => {
  const terms = getIndustryTerms(industryKey);
  return terms[termKey] || termKey;
};
