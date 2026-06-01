import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Building2, Users, Briefcase, ArrowRight, ArrowLeft, Check, Sparkles, Loader2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import { getTerm, INDUSTRIES } from '@/config/industries';

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to top on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Step 1: Firm profile
  const [firmName, setFirmName] = useState(user?.company_name || '');
  const [country, setCountry] = useState('Nigeria');
  const [currency, setCurrency] = useState('NGN');
  const [subdomain, setSubdomain] = useState('');
  const [industry, setIndustry] = useState(user?.company_industry || 'law');

  // Step 2: Setup Mode
  const [setupMode, setSetupMode] = useState('template'); // 'template', 'orbit', 'custom'
  const [selectedModules, setSelectedModules] = useState([]);

  // Step 3: Staff invites
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffName, setStaffName] = useState('');
  const [invitedStaff, setInvitedStaff] = useState([]);

  // Step 4: First Case
  const [caseTitle, setCaseTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const handleAddStaff = () => {
    if (!staffEmail || !staffName) return;
    setInvitedStaff([...invitedStaff, { name: staffName, email: staffEmail, role: staffRole }]);
    setStaffEmail('');
    setStaffName('');
    setStaffRole('');
  };

  const handleRemoveStaff = (index) => {
    setInvitedStaff(invitedStaff.filter((_, idx) => idx !== index));
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);

    try {
      let companyIdToUse = user?.company_id;

      if (!companyIdToUse) {
         // Check if a company was already created by this user in a previous partial attempt
         const { data: existingComp, error: existingErr } = await supabase
            .from('companies')
            .select('id, subdomain')
            .eq('email', user?.email)
            .single();

         if (existingComp) {
            companyIdToUse = existingComp.id;
         } else {
            if (!subdomain || !firmName) throw new Error("Please provide a workspace name and subdomain.");
            const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            const { data: compData, error: compErr } = await supabase.from('companies').insert({
               name: firmName,
               subdomain: cleanSubdomain,
               email: user?.email,
               industry_type: industry,
               country: country,
               currency: currency,
               subscription_plan: 'starter',
               subscription_status: 'trial',
               status: 'active'
            }).select().single();

            if (compErr) {
               if (compErr.code === '23505' && compErr.message.includes('companies_subdomain_key')) {
                  throw new Error(`The workspace URL "${cleanSubdomain}" is already taken. Please choose another one.`);
               }
               throw compErr;
            }
            companyIdToUse = compData.id;
         }

         const { error: profErr } = await supabase.from('profiles').update({
            company_id: companyIdToUse,
            company_name: firmName,
            role: 'company_admin'
         }).eq('id', user.id);
         
         if (profErr) throw profErr;
      } else {
        // 1. Update company details
        const { error: compError } = await supabase
          .from('companies')
          .update({
            name: firmName,
            country: country,
            currency: currency,
            status: 'active'
          })
          .eq('id', companyIdToUse);

        if (compError) throw compError;
      }

      // 2. Insert invited staff records
      if (invitedStaff.length > 0) {
        const staffInserts = invitedStaff.map(s => ({
          company_id: companyIdToUse,
          user_email: s.email,
          full_name: s.name,
          role: s.role,
          department: 'Operations'
        }));
        await supabase.from('staff_records').insert(staffInserts);
      }

      // 3. Create first client and case
      if (clientName && caseTitle) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: companyIdToUse,
            name: clientName,
            email: clientEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
            status: 'active'
          })
          .select()
          .single();

        if (!clientError && clientData) {
          await supabase.from('legal_cases').insert({
            company_id: companyIdToUse,
            client_id: clientData.id,
            title: caseTitle,
            stage: 'intake',
            status: 'active',
            description: `First ${getTerm(industry, 'case').toLowerCase()} initialized during onboarding.`
          });
        }
      }

      // 4. Trigger celebration confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });

      // 5. Refresh user session and go to dashboard
      await refreshUser();
      
      // Store onboarding completion in localStorage to prevent repeat redirects
      localStorage.setItem(`onboarding_done_${companyIdToUse}`, 'true');

      // Store setup mode and selected modules in localStorage
      localStorage.setItem(`setup_mode_${companyIdToUse}`, setupMode);
      if (setupMode === 'template') {
        localStorage.removeItem(`active_modules_${companyIdToUse}`); // Template implies all modules
      } else if (setupMode === 'orbit') {
        // Orbit = blank slate — only dynamic modules appear, no predefined industry pages
        localStorage.setItem(`active_modules_${companyIdToUse}`, JSON.stringify(['__orbit__']));
      } else if (setupMode === 'custom') {
        localStorage.setItem(`active_modules_${companyIdToUse}`, JSON.stringify(selectedModules));
      }
      
      toast({ title: "Setup Complete!", description: "Welcome to your new digital workspace." });
      
      const { currentSubdomain, baseDomain } = getSubdomainAndBase();
      if (!currentSubdomain) {
         const { data: company } = await supabase.from('companies').select('subdomain').eq('id', companyIdToUse).single();
         if (company?.subdomain) {
             const port = window.location.port ? `:${window.location.port}` : '';
             window.location.href = `${window.location.protocol}//${company.subdomain}.${baseDomain}${port}/`;
             return;
         }
      }
      navigate('/');
    } catch (err) {
      console.error("Onboarding failed:", err);
      // Give a better error message if it's a fetch error
      let errMsg = err.message || err.toString();
      if (errMsg.includes('Failed to fetch')) {
         errMsg += " (This is often caused by a network issue, ad-blocker, or a problem connecting to the database)";
      }
      toast({ title: "Setup Failed", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Profile' },
    { num: 2, title: 'Setup' },
    { num: 3, title: 'Team' },
    { num: 4, title: 'Launch' }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] flex flex-col justify-center items-center sm:py-12 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full h-[100dvh] sm:h-auto sm:max-w-2xl bg-white sm:rounded-3xl sm:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] sm:border border-slate-100 relative z-10 flex flex-col sm:max-h-[85vh]">
        
        {/* Header Section */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="/optalflow-logo.svg" alt="Optalflow" className="h-10" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t("workspace_setup_wizard", "Workspace Setup")}</h1>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between">
              {steps.map((s) => {
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ring-4 ring-white
                        ${isCompleted ? 'bg-blue-600 text-white shadow-md' : 
                          isCurrent ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-md' : 
                          'bg-slate-100 text-slate-400 border-2 border-slate-100'}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8 scroll-smooth hide-scrollbar">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Step 1: Company Profile */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {t("setup_your", "Setup your")} {INDUSTRIES[industry]?.name || 'Workspace'}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {t(
                      "provide_your_organization_s_ph",
                      "Provide your organization's physical coordinates and standard operating currency for dynamic billing templates."
                    )}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{INDUSTRIES[industry]?.name || 'Workspace'} {t("name", "Name")}</label>
                    <Input 
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="E.g. Mensah & Partners"
                      className="h-12 bg-white border-slate-200 focus:bg-white focus-visible:bg-white focus:border-blue-500 focus:ring-blue-500 text-slate-900 rounded-xl"
                    />
                  </div>

                  {!user?.company_id && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("workspace_url_subdomain", "Workspace URL (Subdomain)")}</label>
                        <div className="flex items-center relative">
                          <Input 
                            type="text"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value)}
                            placeholder="mycompany"
                            className="h-12 bg-white border-slate-200 focus:bg-white focus-visible:bg-white focus:border-blue-500 focus:ring-blue-500 text-slate-900 rounded-xl pl-4 pr-32"
                          />
                          <span className="absolute right-4 text-slate-400 font-medium text-sm pointer-events-none">.optalflow.com</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("industry", "Industry")}</label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl text-slate-900 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-slate-900 border-slate-200">
                            <SelectItem value="law">{t("law_firm", "Law Firm")}</SelectItem>
                            <SelectItem value="hospital">{t("hospital_healthcare", "Hospital & Healthcare")}</SelectItem>
                            <SelectItem value="school">{t("school_education", "School & Education")}</SelectItem>
                            <SelectItem value="hotel">{t("hotel_hospitality", "Hotel & Hospitality")}</SelectItem>
                            <SelectItem value="church">{t("church_religion", "Church & Religion")}</SelectItem>
                            <SelectItem value="insurance">{t("insurance", "Insurance")}</SelectItem>
                            <SelectItem value="retail">{t("retail_pos", "Retail / POS")}</SelectItem>
                            <SelectItem value="logistics">{t("logistics_delivery", "Logistics & Delivery")}</SelectItem>
                            <SelectItem value="hr">{t("hr_erp", "HR & ERP")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("country", "Country")}</label>
                      <Select value={country} onValueChange={(v) => {
                        setCountry(v);
                        if (v === 'Ghana') setCurrency('GHS');
                        else if (v === 'Nigeria') setCurrency('NGN');
                        else if (v === 'Sierra Leone') setCurrency('SLL');
                        else setCurrency('USD');
                      }}>
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl text-slate-900 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-slate-900 border-slate-200">
                          <SelectItem value="Nigeria">{t("nigeria", "Nigeria")}</SelectItem>
                          <SelectItem value="Ghana">{t("ghana", "Ghana")}</SelectItem>
                          <SelectItem value="Sierra Leone">{t("sierra_leone", "Sierra Leone")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("currency", "Currency")}</label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl text-slate-900 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-slate-900 border-slate-200">
                          <SelectItem value="NGN">{t("ngn", "NGN (₦)")}</SelectItem>
                          <SelectItem value="GHS">{t("ghs", "GHS (₵)")}</SelectItem>
                          <SelectItem value="SLL">{t("sll_le", "SLL (Le)")}</SelectItem>
                          <SelectItem value="ZAR">{t("zar_r", "ZAR (R)")}</SelectItem>
                          <SelectItem value="USD">{t("usd", "USD ($)")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Setup Mode */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Choose Your Setup Mode
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    How would you like to initialize your workspace?
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Template Option */}
                  <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'template' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
                    <input 
                      type="radio" 
                      name="setupMode" 
                      value="template" 
                      checked={setupMode === 'template'} 
                      onChange={() => setSetupMode('template')} 
                      className="sr-only" 
                    />
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'template' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {setupMode === 'template' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <h3 className={`font-bold ${setupMode === 'template' ? 'text-blue-900' : 'text-slate-900'}`}>Build with Template</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Initializes your dashboard with all standard predefined pages and modules for a {INDUSTRIES[industry]?.name || 'business'}. Recommended for quick starts.</p>
                      </div>
                    </div>
                  </label>
                  
                  {/* Orbit Option */}
                  <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'orbit' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}>
                    <input 
                      type="radio" 
                      name="setupMode" 
                      value="orbit" 
                      checked={setupMode === 'orbit'} 
                      onChange={() => setSetupMode('orbit')} 
                      className="sr-only" 
                    />
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'orbit' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                        {setupMode === 'orbit' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold ${setupMode === 'orbit' ? 'text-indigo-900' : 'text-slate-900'}`}>Build with Orbit</h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">AI Powered</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Start fresh with a blank slate. Use Orbit AI to dynamically generate custom pages and databases exactly how you want them.</p>
                      </div>
                    </div>
                  </label>

                  {/* Custom Option */}
                  <div className={`relative p-5 rounded-2xl border-2 transition-all duration-200 ${setupMode === 'custom' ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input 
                        type="radio" 
                        name="setupMode" 
                        value="custom" 
                        checked={setupMode === 'custom'} 
                        onChange={() => setSetupMode('custom')} 
                        className="sr-only" 
                      />
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'custom' ? 'border-slate-800 bg-slate-800' : 'border-slate-300'}`}>
                        {setupMode === 'custom' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <h3 className={`font-bold ${setupMode === 'custom' ? 'text-slate-900' : 'text-slate-900'}`}>Custom Selection</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Hand-pick exactly which predefined pages you want to include in your workspace.</p>
                      </div>
                    </label>
                    
                    {setupMode === 'custom' && (
                      <div className="mt-5 pt-5 border-t border-slate-200 pl-9">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {INDUSTRIES[industry]?.nav?.filter(n => !['/', '/settings', '/integrations', '/admin'].includes(n.path)).map((navItem) => (
                            <label key={navItem.path} className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 transition-colors group">
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedModules.includes(navItem.path)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedModules([...selectedModules, navItem.path]);
                                    else setSelectedModules(selectedModules.filter(p => p !== navItem.path));
                                  }}
                                  className="peer sr-only"
                                />
                                <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-slate-800 peer-checked:border-slate-800 transition-colors"></div>
                                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                              </div>
                              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{navItem.label}</span>
                            </label>
                          ))}
                        </div>
                        {selectedModules.length === 0 && (
                          <p className="text-xs text-amber-600 font-medium mt-3 bg-amber-50 p-2 rounded-lg inline-block">Please select at least one module to continue.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Invite Team */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {t("invite_your_team", "Invite your team")}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {t("add_your", "Add your")} {getTerm(industry, 'lawyer').toLowerCase()}{t(
                      "s_and_staff_members_to_collabo",
                      "s and staff members to collaborate in real-time."
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                      <Input 
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="h-11 bg-white border-slate-200 focus:bg-white focus-visible:bg-white text-slate-900 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                      <Input 
                        type="email"
                        placeholder="jane@example.com"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        className="h-11 bg-white border-slate-200 focus:bg-white focus-visible:bg-white text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Role</label>
                      <Select value={staffRole} onValueChange={setStaffRole}>
                        <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl text-slate-900">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-xl">
                          {(INDUSTRIES[industry]?.roles || INDUSTRIES.law.roles)
                            .filter(r => r.value !== 'company_admin')
                            .map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleAddStaff}
                      disabled={!staffEmail || !staffName || !staffRole}
                      className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95"
                    >
                      {t("add_team", "Add")}
                    </Button>
                  </div>
                </div>

                {/* Invited List */}
                {invitedStaff.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invites ({invitedStaff.length})</h4>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {invitedStaff.map((staff, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {staff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-none">{staff.name}</p>
                              <p className="text-slate-500 text-xs mt-1">{staff.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge role={staff.role} industry={industry} />
                            <button 
                              onClick={() => handleRemoveStaff(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No team members added yet.</p>
                    <p className="text-xs text-slate-400 mt-1">You can always invite them later from settings.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: First Case */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {t("initialize_your_first", "Initialize your first")} {getTerm(industry, 'case')}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {t("create_a", "Create a")} {getTerm(industry, 'case').toLowerCase()} {t("and_link_it_to_your_first_acti", "and link it to your first active")} {getTerm(industry, 'client').toLowerCase()} {t("to_test_the_pipeline", "to test the pipeline.")}
                  </p>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(industry, 'case')} {t("title", "Title")}</label>
                    <Input 
                      type="text"
                      value={caseTitle}
                      onChange={(e) => setCaseTitle(e.target.value)}
                      placeholder={`E.g., Initial ${getTerm(industry, 'case')} for setup`}
                      className="h-12 bg-white border-blue-200 focus:bg-white focus-visible:bg-white focus:border-blue-500 text-slate-900 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(industry, 'client')} {t("full_name", "Full Name")}</label>
                      <Input 
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Adama Mensah"
                        className="h-12 bg-white border-blue-200 focus:bg-white focus-visible:bg-white focus:border-blue-500 text-slate-900 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(industry, 'client')} {t("email", "Email")} <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                      <Input 
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="contact@email.com"
                        className="h-12 bg-white border-blue-200 focus:bg-white focus-visible:bg-white focus:border-blue-500 text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-slate-100 bg-slate-50/50 sm:rounded-b-3xl shrink-0">
          <div className="flex justify-between items-center gap-4">
            {step > 1 ? (
              <Button 
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-12 px-6 rounded-xl text-slate-700 border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> {t("back", "Back")}
              </Button>
            ) : (
              <div></div> // Empty div for spacing if no back button
            )}
            
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !firmName) || 
                  (step === 2 && setupMode === 'custom' && selectedModules.length === 0)
                }
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 group transition-all"
              >
                {t("continue_setup", "Continue Setup")}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("finalizing_workspace", "Finalizing Workspace...")}</span>
                  </>
                ) : (
                  <>
                    <span>{(!caseTitle || !clientName) ? t("skip_and_complete", "Skip & Complete Setup!") : t("complete_setup", "Complete Setup!")}</span>
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for role badges
function Badge({ role, industry }) {
  const roles = INDUSTRIES[industry]?.roles || INDUSTRIES.law.roles;
  const roleDef = roles.find(r => r.value === role);
  const label = roleDef ? roleDef.label : role;
  
  return (
    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
      {label}
    </span>
  );
}
