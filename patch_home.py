import sys

with open('src/pages/marketing/Home.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const suites = [')
end_idx = content.find(' {/* ============================================================ */', start_idx)

if start_idx == -1 or end_idx == -1:
    print('Still could not find boundaries', start_idx, end_idx)
    sys.exit(1)

new_suites_and_section = '''const suites = [
    {
      id: 'retail',
      name: 'Retail WorkSlate',
      tagline: 'Multi-Store POS & Inventory',
      description: 'Unify your retail operations with centralized inventory management, multi-store POS, and detailed sales analytics.',
      features: ['Multi-Store Cloud POS', 'Real-time Inventory', 'Supplier Management', 'Sales Analytics']
    },
    {
      id: 'hospital',
      name: 'Healthcare WorkSlate',
      tagline: 'Clinic & Hospital Management',
      description: 'Streamline patient onboarding, appointment scheduling, and staff rostering with our secure health-compliant platform.',
      features: ['Patient Records & History', 'Appointment Scheduling', 'Medical Billing', 'Staff Rostering']
    },
    {
      id: 'school',
      name: 'Education WorkSlate',
      tagline: 'School & Campus Management',
      description: 'Unify student records, grading, fee collection, and parent communication in a single intuitive system.',
      features: ['Student Information System', 'Fee Collection', 'Gradebook & Exams', 'Parent Portal']
    },
    {
      id: 'hotel',
      name: 'Hospitality WorkSlate',
      tagline: 'Hotel & Property Management',
      description: 'Deliver exceptional guest experiences with integrated booking, housekeeping, and point-of-sale systems.',
      features: ['Booking & Reservations', 'Housekeeping Manager', 'Restaurant POS', 'Guest CRM']
    },
    {
      id: 'church',
      name: 'Ministry WorkSlate',
      tagline: 'Church & Congregation Management',
      description: 'Engage your congregation with powerful tools for donation tracking, event scheduling, and member communication.',
      features: ['Member Database', 'Donation & Tithing', 'Event Management', 'Volunteer Scheduling']
    },
    {
      id: 'insurance',
      name: 'Insurance WorkSlate',
      tagline: 'Agency & Policy Management',
      description: 'Accelerate policy issuance, manage claims efficiently, and track commissions with our dedicated insurance suite.',
      features: ['Policy Administration', 'Claims Processing', 'Commission Tracking', 'Client Portal']
    },
    {
      id: 'logistics',
      name: 'Logistics WorkSlate',
      tagline: 'Freight & Delivery Management',
      description: 'Optimize your supply chain with real-time fleet tracking, dispatch routing, and automated invoicing.',
      features: ['Fleet & Asset Tracking', 'Dispatch Management', 'Automated Invoicing', 'Driver App Integration']
    },
    {
      id: 'hr',
      name: 'HR & ERP WorkSlate',
      tagline: 'Enterprise Resource Planning',
      description: 'Manage your most valuable assets with our comprehensive HR suite, including payroll, performance, and leave management.',
      features: ['Automated Payroll', 'Leave & Attendance', 'Performance Reviews', 'Employee Self-Service']
    },
    {
      id: 'law',
      name: 'Law Firm WorkSlate',
      tagline: 'Legal Practice Management',
      description: 'A complete ecosystem for modern law firms to manage cases, track billable hours, and collaborate with clients securely.',
      features: ['Case & Matter Management', 'Conflict Checking', 'Legal Billing & Trust Accounting', 'Secure Client Portal']
    }
  ];
  
  function SuitesSection() {
    const { t } = useTranslation();
    const [activeSuite, setActiveSuite] = useState(suites[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    return (
      <section className="py-16 md:py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                {t("tailored_suites_for_your_indus", "Tailored suites for your industry")}
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                {t(
                  "we_ve_built_specialized_operat",
                  "We've built specialized operational systems that adapt to your specific business model and workflows."
                )}
              </p>
            </div>
          </FadeIn>
          
          {/* Top Tabs Column (Navigation) */}
          <div className="flex overflow-x-auto justify-start lg:justify-center items-center gap-3 mb-12 pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {suites.map(suite => {
              const isActive = activeSuite.id === suite.id;
              return (
                <button
                  key={suite.id}
                  onClick={() => setActiveSuite(suite)}
                  className={lex-none flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 transform shadow-sm }
                >
                  {suite.name.replace(' WorkSlate', '')}
                </button>
              );
            })}
          </div>

          <div className="max-w-5xl mx-auto relative items-start">
            {/* Content Container */}
            <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="relative z-10">
                <FadeIn key={activeSuite.id}>
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-primary shadow-sm border border-slate-200">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </span>
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest">
                          {activeSuite.name}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-primary/90 text-xs font-bold uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5" /> {t("orbit_ai_powered", "Orbit AI Powered")}
                        </div>
                      </div>
                      
                      <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                        {activeSuite.tagline}
                      </h3>
                      
                      <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                        {activeSuite.description}
                      </p>
                      
                      {/* Features List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeSuite.features.map((feat, idx) => {
                          return (
                            <div key={idx} className="flex items-start gap-3 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                              <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-primary shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="font-bold text-slate-700 text-sm leading-snug">{feat}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-12 pt-8 border-t border-slate-100 flex items-center">
                        <Button 
                          onClick={() => setIsModalOpen(true)}
                          className="bg-primary text-white hover:bg-primary/90 font-bold py-6 px-10 rounded-full shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                        >
                          {t("explore", "Explore")} {activeSuite.name} {t("details", "details")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal / Popup for WorkSlate Details */}
        {isModalOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsModalOpen(false)}
            ></div>
            
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex-none p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                    {t("workspace_module", "WorkSlate Module")}
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeSuite.name}</h3>
                  <p className="text-slate-500 font-medium mt-2 max-w-2xl">{activeSuite.description}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors -mr-2 -mt-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
                <div className="max-w-3xl mx-auto">
                  <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    {t("core_features_capabilities", "Core Features & Capabilities")}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {activeSuite.features.map((feat, idx) => {
                      return (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-slate-200 transition-colors">
                          <h5 className="font-bold text-slate-900 text-lg mb-2">{feat}</h5>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            {t(
                              "powerful_tools_to_automate_thi",
                              "Powerful tools to automate this aspect of your business, integrating seamlessly with your broader operations."
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </section>
    );
  }
'''

new_content = content[:start_idx] + new_suites_and_section + content[end_idx:]

with open('src/pages/marketing/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
