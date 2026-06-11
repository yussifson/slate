import { generateText } from './cloudflareAI';
import { supabase } from '@/api/supabaseClient';

const ORBIT_BUILD_PROMPT = `You are OrbitBuild, an elite Workspace Assembly Engine for Slate.
Your purpose is to understand a business or industry described by the user and assemble a complete workspace.
You MUST NOT generate database schemas. You MUST ONLY select from the predefined library of Universal Components.

CRITICAL INSTRUCTIONS:
1. Analyze the industry/business requested and identify the required business capabilities.
2. Select the most specific and appropriate Universal Component to fulfill those capabilities.
3. Assemble a list of pages for the workspace (generate between 6 and 12 pages depending on the complexity).
4. Provide a domain-specific \`page_name\` (e.g., "Pet Records", "Billing & Invoicing", "Student Attendance") but map it to exactly one matching \`component_id\` from the allowed library below.
5. THE FIRST PAGE MUST ALWAYS BE A DASHBOARD. Set \`page_name\` to "Dashboard" and \`component_id\` to "dashboard".
6. Avoid using the generic table or grid components unless the page is explicitly just a basic data table with no other domain representation.
7. The \`industry_name\` must be a short, smart, and accurate title (1-2 words max) that names the system (e.g., "Optavel Retail", "City Hospital", "Grace School"). Do not use long descriptions.

ALLOWED COMPONENT IDS (YOU MUST USE EXACTLY ONE OF THESE AS THE \`component_id\` FOR EACH PAGE):
- \`dashboard\` : Main system dashboard, charts, overview (MUST be the first page)
- \`crm\` : Customer relationship management, leads, sales pipeline
- \`invoice\` : Invoices, billing, payment requests
- \`appointment\` : Appointment scheduling, client bookings
- \`inventory\` : Stock and inventory management
- \`hremployee\` : HR directory, employee list, staff profiles
- \`kanban\` : Task management boards, project cards
- \`calendar\` : Calendar views, schedules, event planners
- \`analytics\` : Reports, analytics, chart pages
- \`formwizard\` : Multi-step forms, wizard flows, request approvals
- \`search\` : Global search, directory lookup
- \`timeline\` : Timelines, project roadmap, Gantt-like displays
- \`documentmanager\` : Documents, file repository, upload management
- \`messaging\` : Chat, messages, team channels
- \`notification\` : Alerts, notifications history
- \`contactmanagement\` : Customer/client lists, contact manager
- \`payment\` : Payment transactions, gateways, invoice list
- \`subscription\` : Subscriptions, recurring packages, plans
- \`assetmanagement\` : Physical assets, hardware, equipment tracking
- \`procurement\` : Purchasing, vendors, procurement orders
- \`pos\` : Point of Sale system
- \`attendance\` : Staff attendance, time clock tracking
- \`payroll\` : Payroll, salary slips, pay cycles
- \`recruitment\` : Applicant tracking, job recruitment
- \`leavemanagement\` : Time-off requests, leave approvals
- \`studentrecords\` : Students management database
- \`faculty\` : Teachers, professors, instructors directory
- \`course\` : Courses, curriculum, classes, lectures
- \`gradebook\` : Student grades, exam marks, transcripts
- \`classattendance\` : Academic class attendance logging
- \`lms\` : Learning management system, materials, lessons
- \`parentportal\` : Parents/guardians access portal
- \`patientrecords\` : Medical clinic patient list
- \`emr\` : Electronic medical records, clinical notes
- \`prescription\` : Prescriptions, pharmacy orders, medication plans
- \`labresults\` : Lab tests, diagnostics results
- \`wardmanagement\` : Hospital wards, rooms, bed bookings
- \`telemedicine\` : Virtual doctor consultations, video calls
- \`booking\` : Hotel/hospitality reservations, bookings
- \`room\` : Room management, hotel room inventory
- \`housekeeping\` : Cleaning status, tasks list
- \`menu\` : Restaurant menu items, food catalog
- \`diningorders\` : Restaurant table orders, dining requests
- \`fleet\` : Delivery/dispatch fleet vehicles
- \`dispatch\` : Driver dispatch, fleet allocation
- \`routeplanning\` : Route navigation, delivery path mapping
- \`delivery\` : Shipments, order delivery status tracking
- \`warehouse\` : Warehouses management, bin allocations
- \`project\` : Project management, construction plans
- \`boq\` : Bill of Quantities (construction material estimates)
- \`siteinspections\` : Construction site inspection notes, snag lists
- \`safety\` : Incident reports, safety compliance
- \`contractor\` : Contractors, builders, subcontractors
- \`case\` : Legal case management, files
- \`legaldocuments\` : Contracts, legal agreements archive
- \`courtcalendar\` : Court schedules, hearing dates
- \`clientportal\` : Legal client portal access
- \`production\` : Factory production lines, batches
- \`bom\` : Bill of Materials (manufacturing component structures)
- \`machine\` : Factory machinery list, equipment maintenance
- \`qualitycontrol\` : Product inspections, quality checklists
- \`consultation\` : Professional client consultation log
- \`retainer\` : Retainer agreement tracker
- \`escrow\` : Escrow transactions ledger
- \`timebilling\` : Billable hours sheet
- \`conflictcheck\` : Legal conflict checking records
- \`arbitration\` : Discussions/mediation tracking
- \`trademark\` : Intellectual property & patent filing
- \`clientledger\` : Professional account ledger
- \`expertwitness\` : Witness registry database
- \`briefs\` : Legal arguments repository
- \`property\` : Real estate properties list
- \`tenant\` : Tenant profiles directory
- \`lease\` : Lease agreements registry
- \`rentpayment\` : Rent ledger and alerts
- \`maintenancerequest\` : Tenancy repair tickets
- \`propertyinspection\` : Property safety audits
- \`listing\` : Real estate sales listings
- \`agentcommission\` : Sales rep commissions ledger
- \`hoa\` : HOA ledger
- \`utilitybill\` : Property utility trackers
- \`productcatalog\` : Online store stock catalog
- \`orderregistry\` : Customer checkout orders
- \`discount\` : Promotions and coupons database
- \`customerreview\` : Feedback and ratings log
- \`supplierdirectory\` : Wholesale vendor registry
- \`returnrefund\` : Return management tickets
- \`giftcard\` : Digital codes catalog
- \`wishlist\` : Customer favorite logs
- \`loyaltypoint\` : Rewards program ledger
- \`shippinglabel\` : Fulfillment labels log
- \`generalledger\` : Double entry accounts
- \`expensereport\` : Staff reimbursement tracker
- \`taxfiling\` : Quarterly tax forms log
- \`audittrail\` : System logs database
- \`cashflow\` : Inflow & outflow records
- \`fixedasset\` : Capital hardware amortization
- \`purchaseorder\` : Purchase approvals ledger
- \`budgetplan\` : Department cost allocations
- \`bankreconciliation\` : Bank statement reconciliation checklist
- \`stockoption\` : Equity distribution logs
- \`enrollment\` : Admissions applications log
- \`tuition\` : Fee structures and payments
- \`scholarship\` : Financial aid allocation list
- \`syllabus\` : Lesson plans and milestones
- \`examschedule\` : Term test planners
- \`alumni\` : Graduate contacts register
- \`librarybook\` : Book catalog and checkouts
- \`hostelroom\` : Dormitory beds allocation
- \`schoolbusroute\` : School bus fleet routes
- \`extracurricular\` : Extra-curricular club memberships
- \`doctorschedule\` : Doctor shifts schedule
- \`medicalbilling\` : Medical billing & insurance codes
- \`referral\` : Patient referral logs
- \`immunization\` : Vaccine logs
- \`allergylist\` : Patient allergy profile
- \`operationtheater\` : Surgery scheduling
- \`vitalsigns\` : Patient continuous vitals monitoring
- \`triage\` : ER triage checklist
- \`dischargesummary\` : Patient discharge summaries
- \`insurancepolicy\` : Patient policy verifications
- \`eventplanner\` : Event itineraries
- \`ticketsales\` : Ticket sales register
- \`flightbooking\` : Flight travel itineraries
- \`carrental\` : Car rental reservations
- \`tourpackage\` : Travel sightseeing itineraries
- \`luggageclaim\` : Guest baggage tickets
- \`feedbacksurvey\` : Guest surveys log
- \`cateringmenu\` : Catering menu items
- \`tablereservation\` : Restaurant table bookings
- \`hotelreview\` : Hotel guest review scorecards
- \`pallettracker\` : Pallet and barcode tracking
- \`customsdoc\` : Import/export customs sheets
- \`carriercontract\` : Carrier freight rates log
- \`coldchain\` : Temperature log monitors
- \`crossdocking\` : Transit manifests
- \`inventoryaudit\` : Physical stockcount audit logs
- \`damagedgoods\` : Stock damage records
- \`forkliftmaintenance\` : Warehouse equipment checks
- \`lastmiledelivery\` : Local dropoff rosters
- \`billoflading\` : Shipment verification sheets
- \`subcontractoragreement\` : External subcontractor agreements
- \`permittracker\` : Local permit tracking
- \`blueprint\` : Blueprint CAD files
- \`equipmentrental\` : Machinery rental logs
- \`snaglist\` : Snag defect checklists
- \`concretetest\` : Structural strength tests
- \`workorder\` : Manufacturing work logs
- \`assemblyline\` : Station progress monitors
- \`rawmaterial\` : Raw materials logs
- \`scraprate\` : Production failure metrics
- \`donorprofile\` : NGO donor profiles
- \`donationlog\` : NGO donation logs
- \`grantproposal\` : NGO grant proposals
- \`volunteerroster\` : NGOs volunteer staffing
- \`campaignmetric\` : NGO social campaign metrics
- \`beneficiarylist\` : Resource allocation logs
- \`pledge\` : Pledge commitment tracker
- \`sponsorship\` : Sponsor partnership deals
- \`advocacy\` : advocacy campaign logs
- \`inkinddonation\` : In-kind donation inventory
- \`performancereview\` : HR performance reviews
- \`trainingcourse\` : Training course records
- \`expenseclaim\` : HR expense claims
- \`timesheet\` : Timesheets logs
- \`orgchart\` : Organization structure nodes
- \`disciplinary\` : Disciplinary incident logs
- \`onboardingtask\` : Onboarding checklists
- \`exitinterview\` : Attrion logs
- \`benefitelection\` : Benefit enrolments
- \`commissionstructure\` : Sales commissions percentage models
- \`campaignschedule\` : Marketing campaign calendars
- \`adspend\` : Ad spend cost tracking
- \`newsletter\` : Marketing newsletters log
- \`pressrelease\` : PR distributions archive
- \`seokeyword\` : SEO keywords tracker
- \`brandasset\` : Brand identity asset logs
- \`affiliateprogram\` : Marketing affiliate links ledger
- \`competitorprice\` : Market price scans
- \`leadmagnet\` : Newsletter signups log
- \`sponsorshipdeck\` : Sponsor pitch decks
- \`supportticket\` : Client support tickets
- \`kbarticle\` : KB support articles
- \`slaagreement\` : SLA contracts register
- \`feedbackform\` : NPS surveys
- \`churnrisk\` : CS churn risk log
- \`featurerequest\` : Customer request log
- \`chattranscript\` : CS chat transcripts
- \`customerjourney\` : CS milestone tracks
- \`calllog\` : Inbound/outbound call logs
- \`incidentreport\` : Outage incident logs
- \`servermetric\` : Server metrics tracking
- \`ipaddress\` : Server IP assignments
- \`accesscontrol\` : Door badge registers
- \`sslcertificate\` : Domain SSL certificates tracker
- \`gdprrequest\` : Data deletion requests
- \`softwarelicense\` : IT software licenses tracker
- \`vulnerability\` : Vulnerability scan logs
- \`databackup\` : Backup completion logs

ALLOWED ICONS (YOU MUST CHOOSE A UNIQUE ICON FOR EACH PAGE FROM THIS EXACT LIST):
LayoutDashboard, Briefcase, Users, Calendar, Receipt, CheckSquare, FolderOpen, Settings,
Scale, UserCog, CreditCard, UserCircle, UserPlus, BookOpen, Shield, TrendingUp, Trophy,
Search, Mail, BarChart2, Download, MessageCircle, HeartHandshake, GraduationCap, BookMarked,
ClipboardList, Bus, FileText, Stethoscope, Bed, Pill, FlaskConical, Activity, Sparkles,
UtensilsCrossed, Star, ShoppingCart, Package, Truck, Tag, Layers, Bell, Award, Library,
Building2, AlertCircle, Clock, Network, Gift, Banknote, Map, Warehouse, Car, MapPin, Zap,
Store, ShieldAlert, HeartPulse, FilePlus, FileCheck, Gavel, Target, Calculator, Home, Wallet,
PieChart, Laptop, Smartphone, MessageSquare, LineChart

JSON OUTPUT FORMAT:
You must output EXACTLY a valid JSON object. DO NOT output any markdown tags like \`\`\`json. DO NOT output any conversational text.
ONLY the JSON object.

{
  "industry_name": "Veterinary Clinic",
  "pages": [
    {
      "page_name": "Dashboard",
      "component_id": "dashboard",
      "icon": "LayoutDashboard",
      "description": "Clinic performance and overview."
    },
    {
      "page_name": "Pet Records",
      "component_id": "patientrecords",
      "icon": "HeartPulse",
      "description": "Manage pet profiles and clinical histories."
    },
    {
      "page_name": "Appointments",
      "component_id": "appointment",
      "icon": "Calendar",
      "description": "Schedule clinic visits."
    },
    {
      "page_name": "Billing",
      "component_id": "invoice",
      "icon": "Receipt",
      "description": "Generate invoices and track payments."
    }
  ]
}
`;

/**
 * Assembles a full workspace configuration via LLM and saves it to industry_records.
 * @param {string} prompt - User's description of their business/needs
 * @param {string} companyId - The newly created company ID
 * @returns {Promise<Array>} - The assembled workspace configuration
 */
export async function generateOrbitBuildWorkspace(prompt, companyId) {
  try {
    const aiMessages = [
      { role: 'system', content: ORBIT_BUILD_PROMPT },
      { role: 'user', content: prompt }
    ];

    const responseText = await generateText(aiMessages);
    
    // Parse the JSON array. Handle potential markdown formatting.
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    let parsedData = null;
    let assembledPages = [];
    let industryName = 'Custom Workslate';

    // Best-effort attempt to extract an industry name from the prompt
    // e.g., "Build a veterinary clinic management system..." -> "veterinary clinic"
    const extractIndustryFromPrompt = (text) => {
      const match = text.match(/(?:build|create|make) (?:a|an) (.*?) (?:management system|workspace|app|software)/i);
      return match ? match[1].trim().replace(/\b\w/g, l => l.toUpperCase()) : 'Custom Workslate';
    };

    try {
      parsedData = JSON.parse(jsonStr);
      
      // Handle fallback for older generated arrays vs the new object structure
      if (Array.isArray(parsedData)) {
        assembledPages = parsedData;
        industryName = extractIndustryFromPrompt(prompt);
      } else if (parsedData && Array.isArray(parsedData.pages)) {
        assembledPages = parsedData.pages;
        if (parsedData.industry_name) {
          industryName = parsedData.industry_name;
        } else {
          industryName = extractIndustryFromPrompt(prompt);
        }
      } else {
        throw new Error("OrbitBuild returned invalid format (expected array of pages or object with pages array).");
      }
    } catch (parseErr) {
      console.error("Failed to parse OrbitBuild JSON:", parseErr, "\nRaw text:", jsonStr);
      throw new Error("OrbitBuild failed to assemble the workspace correctly. Please try again.");
    }

    if (!assembledPages || assembledPages.length === 0) {
      throw new Error("OrbitBuild returned no pages.");
    }

    // Save the assembly configuration to industry_records
    const configId = crypto.randomUUID();
    const { error: configError } = await supabase.from('industry_records').insert({
      id: configId,
      company_id: companyId,
      industry: 'orbit_build',
      record_type: 'workspace_config',
      data: { pages: assembledPages, industry_name: industryName, prompt: prompt },
      search_text: 'orbit build assembly configuration',
      created_at: new Date().toISOString()
    });

    if (configError) {
      console.error("Failed to save OrbitBuild config:", configError);
      throw new Error("Failed to save the workspace configuration.");
    }

    // Update the company's industry_type
    const { error: compError } = await supabase.from('companies').update({
      industry_type: 'orbit_build'
    }).eq('id', companyId);

    if (compError) {
      console.error("Failed to update company industry_type:", compError);
    }

    return assembledPages;
  } catch (err) {
    console.error("OrbitBuild generation error:", err);
    throw err;
  }
}
