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
import { COUNTRIES_CURRENCIES } from '@/config/countries';
import { generateOrbitBuildWorkspace } from '@/lib/orbitBuildGenerator';

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Disconnect Auth Pages from Dashboard Theme Switcher
  useEffect(() => {
    const root = window.document.documentElement;
    const originalClass = root.className;
    
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    return () => {
      root.className = originalClass;
      root.style.colorScheme = '';
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to top on step change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const md = user?.user_metadata || {};
  const [workspaceName, setWorkspaceName] = useState(md.company_name || '');
  const [subdomain, setSubdomain] = useState(md.subdomain || '');
  const isMissingMetadata = !md.company_name || !md.subdomain;

  const [country, setCountry] = useState('United States of America');
  const [currency, setCurrency] = useState('USD');
  const [industry, setIndustry] = useState(user?.company_industry || 'law');
  const [educationLevel, setEducationLevel] = useState('');
  const [orbitPrompt, setOrbitPrompt] = useState('');
  const [orbitProgress, setOrbitProgress] = useState('');

  useEffect(() => {
    const selected = COUNTRIES_CURRENCIES.find(c => c.country === country);
    if (selected) {
      setCurrency(selected.currency);
    }
  }, [country]);

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
            .limit(1)
            .maybeSingle();

         if (existingComp) {
            companyIdToUse = existingComp.id;
         }

          if (!companyIdToUse) {
             const cName = workspaceName || md.company_name || 'My Workspace';
             const cSubdomain = subdomain || md.subdomain || `workspace-${Date.now()}`;
             
             let finalIndustry = (industry === 'school' && educationLevel !== 'basic') ? educationLevel : industry;
             if (setupMode === 'orbit') {
               finalIndustry = 'orbit_build';
             }
             
             const finalEduLevel = (industry === 'school' && educationLevel === 'basic') ? 'basic' : null;

               let insertSuccess = false;
               let attempt = 0;
               let finalSubdomain = cSubdomain;
               let newCompData = null;

               while (!insertSuccess && attempt < 3) {
                 const { data: newComp, error: newCompErr } = await supabase.from('companies').insert({
                     name: cName,
                     subdomain: finalSubdomain,
                     email: user.email,
                     industry_type: finalIndustry || 'law',
                     education_level: finalEduLevel,
                     country: country,
                     currency: currency,
                     subscription_plan: 'starter',
                     subscription_status: 'trial',
                     status: 'active'
                 }).select().single();

                 if (newCompErr) {
                   if (newCompErr.code === '23505') {
                     // Duplicate subdomain, try appending a random string
                     finalSubdomain = `${cSubdomain}-${Math.random().toString(36).substring(2, 6)}`;
                     attempt++;
                   } else {
                     throw newCompErr;
                   }
                 } else {
                   insertSuccess = true;
                   newCompData = newComp;
                 }
               }

               if (!insertSuccess) {
                 throw new Error("Could not generate a unique subdomain. Please try again.");
               }
               companyIdToUse = newCompData.id;
          }

         const { error: profErr } = await supabase.from('profiles').update({
            company_id: companyIdToUse,
            role: 'company_admin'
         }).eq('id', user.id);
         
         if (profErr) throw profErr;
      }

      // 1. Update company details
      let finalIndustry = (industry === 'school' && educationLevel !== 'basic') ? educationLevel : industry;
      if (setupMode === 'orbit') {
         finalIndustry = 'orbit_build';
      }

      const { error: compError } = await supabase
        .from('companies')
          .update({
            industry_type: finalIndustry,
            education_level: (industry === 'school' && educationLevel === 'basic') ? 'basic' : null,
            country: country,
            currency: currency,
            status: 'active'
          })
          .eq('id', companyIdToUse);

        if (compError) throw compError;

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
          .limit(1)
          .maybeSingle();

        if (!clientError && clientData) {
          await supabase.from('legal_cases').insert({
            company_id: companyIdToUse,
            client_id: clientData.id,
            title: caseTitle,
            stage: 'intake',
            status: 'active',
            practice_area: finalIndustry
          });
        }
      }

      // 4. Trigger celebration confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });

      // Handle OrbitBuild if selected
      if (setupMode === 'orbit' && orbitPrompt) {
         setOrbitProgress("Analyzing Industry & Assembling Workspace...");
         try {
             await generateOrbitBuildWorkspace(orbitPrompt, companyIdToUse);
         } catch (err) {
             console.error("OrbitBuild Error", err);
             toast({ title: "OrbitBuild Failed", description: err.message, variant: "destructive" });
         }
         setOrbitProgress("");
      }

      // 5. Refresh user session and go to dashboard
      await refreshUser();
      
      // Store onboarding completion in localStorage to prevent repeat redirects
      localStorage.setItem(`onboarding_done_${companyIdToUse}`, 'true');

      // Store setup mode and selected modules in localStorage
      localStorage.setItem(`setup_mode_${companyIdToUse}`, setupMode);
      if (setupMode === 'template') {
        localStorage.removeItem(`active_modules_${companyIdToUse}`); // Template implies all modules
      } else if (setupMode === 'orbit') {
        // Orbit = blank slate � only dynamic modules appear, no predefined industry pages
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
    { num: 1, title: 'Setup Mode' },
    { num: 2, title: 'Profile' },
    { num: 3, title: 'Team' },
    { num: 4, title: 'Launch' }
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col justify-center items-center sm:py-12 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full h-[100dvh] sm:h-auto sm:max-w-3xl bg-card sm:rounded-3xl sm:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] sm:border border-border relative z-10 flex flex-col sm:my-10">
        
        {/* Header Section */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="/slate-logo.svg" alt="Slate" className="h-10" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t("workspace_setup_wizard", "WorkSlate Setup")}</h1>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between">
              {steps.map((s) => {
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ring-4 ring-background
                        ${isCompleted ? 'bg-primary text-white shadow-md' : 
                          isCurrent ? 'bg-card border-2 border-primary text-primary shadow-md' : 
                          'bg-muted text-muted-foreground border-2 border-border'}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${isCurrent ? 'text-primary' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
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
                    Choose Your Setup Mode
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    How would you like to initialize your workslate?
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Template Option */}
                  <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'template' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 bg-card'}`}>
                    <input 
                      type="radio" 
                      name="setupMode" 
                      value="template" 
                      checked={setupMode === 'template'} 
                      onChange={() => setSetupMode('template')} 
                      className="sr-only" 
                    />
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'template' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                        {setupMode === 'template' && <div className="w-2 h-2 rounded-full bg-card"></div>}
                      </div>
                      <div>
                        <h3 className={`font-bold ${setupMode === 'template' ? 'text-primary' : 'text-slate-900'}`}>Build with Template</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Initializes your dashboard with all standard predefined pages and modules for a {INDUSTRIES[industry]?.name || 'business'}. Recommended for quick starts.</p>
                      </div>
                    </div>
                  </label>
                  
                  {/* Orbit Option */}
                  <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'orbit' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 bg-card'}`}>
                    <input 
                      type="radio" 
                      name="setupMode" 
                      value="orbit" 
                      checked={setupMode === 'orbit'} 
                      onChange={() => setSetupMode('orbit')} 
                      className="sr-only" 
                    />
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'orbit' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                        {setupMode === 'orbit' && <div className="w-2 h-2 rounded-full bg-card"></div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold ${setupMode === 'orbit' ? 'text-primary' : 'text-slate-900'}`}>Build with Orbit</h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-primary/90 text-[10px] font-bold uppercase tracking-wider">AI Powered</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Start fresh with a blank slate. Use Orbit AI to dynamically generate custom pages and databases exactly how you want them.</p>
                      </div>
                    </div>
                  </label>

                  {/* Custom Option */}
                  <div className={`relative p-5 rounded-2xl border-2 transition-all duration-200 ${setupMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-slate-300 bg-card'}`}>
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input 
                        type="radio" 
                        name="setupMode" 
                        value="custom" 
                        checked={setupMode === 'custom'} 
                        onChange={() => setSetupMode('custom')} 
                        className="sr-only" 
                      />
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'custom' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                        {setupMode === 'custom' && <div className="w-2 h-2 rounded-full bg-card"></div>}
                      </div>
                      <div>
                        <h3 className={`font-bold ${setupMode === 'custom' ? 'text-primary' : 'text-slate-900'}`}>Custom Selection</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Hand-pick exactly which predefined pages you want to include in your workslate.</p>
                      </div>
                    </label>
                    
                    {setupMode === 'custom' && (
                      <div className="mt-5 pt-5 border-t border-border pl-9">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {INDUSTRIES[industry]?.nav?.filter(n => !['/', '/settings', '/integrations', '/admin'].includes(n.path)).map((navItem) => (
                            <label key={navItem.path} className="flex items-center space-x-3 p-3 bg-card border border-border rounded-xl cursor-pointer hover:border-slate-400 transition-colors group">
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
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {isMissingMetadata && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">WorkSlate Name</label>
                      <Input 
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="E.g. Slate Inc."
                        className="mt-1 h-12 bg-card"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Subdomain</label>
                      <Input 
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="yourcompany"
                        className="mt-1 h-12 bg-card"
                      />
                      <p className="text-xs text-slate-500 mt-1">This will be your dedicated login portal url.</p>
                    </div>
                  </div>
                )}

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

                  {setupMode === 'orbit' && (
                    <div className="space-y-3 mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Describe Your Workspace</h3>
                        <p className="text-sm text-slate-500 mt-1">OrbitBuild will assemble the perfect workspace for you.</p>
                      </div>
                      <textarea
                        value={orbitPrompt}
                        onChange={(e) => setOrbitPrompt(e.target.value)}
                        placeholder="E.g., Build a veterinary clinic management system with pet records, appointments, and billing..."
                        className="w-full h-32 p-4 rounded-xl border border-primary/20 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      />
                    </div>
                  )}

                    {setupMode !== "orbit" && <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("industry", "Workspace Selection")}</label>}
                    {setupMode !== "orbit" && <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="h-12 bg-card border-border rounded-xl text-slate-900 focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-slate-900 border-border">
                        <SelectItem value="law">{t("law_firm", "Law Firm")}</SelectItem>
                        <SelectItem value="retail">{t("retail_pos", "Retail / POS")}</SelectItem>
                        <SelectItem value="school">{t("school_education", "School & Education")}</SelectItem>
                        <SelectItem value="hospital">{t("hospital_healthcare", "Hospital & Healthcare")}</SelectItem>
                        <SelectItem value="hotel">{t("hotel_hospitality", "Hotel & Hospitality")}</SelectItem>
                        <SelectItem value="logistics">{t("logistics_delivery", "Logistics & Delivery")}</SelectItem>
                        <SelectItem value="insurance">{t("insurance", "Insurance Agency")}</SelectItem>
                        <SelectItem value="religion">{t("religion_religion", "Religious Organization")}</SelectItem>
                        <SelectItem value="hr">{t("hr_erp", "HR & ERP")}</SelectItem>
                      </SelectContent>
                    </Select>}
                  </div>

                  {industry === 'school' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Education Level</label>
                      <Select value={educationLevel} onValueChange={setEducationLevel}>
                        <SelectTrigger className="w-full h-12 bg-slate-500 border-primary/20 rounded-xl text-slate-900 focus:ring-primary">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="bg-card text-slate-900 border-border">
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="highschool">High School</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="online">Online Learning Platform</SelectItem>
                          <SelectItem value="vocational">Vocational / Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("country", "Country")}</label>
                      <Select value={country} onValueChange={(v) => {
                        setCountry(v);
                      }}>
                        <SelectTrigger className="h-12 bg-card border-border rounded-xl text-slate-900 focus:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card text-slate-900 border-border">
                          {COUNTRIES_CURRENCIES.map((c) => (
                            <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t("currency", "Currency")}</label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-12 bg-card border-border rounded-xl text-slate-900 focus:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card text-slate-900 border-border">
                          {Array.from(new Set(COUNTRIES_CURRENCIES.map(c => c.currency))).sort().map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Setup Mode */}
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

                <div className="bg-muted/30 rounded-2xl p-5 border border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                      <Input 
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="h-11 bg-card border-border focus:bg-card focus-visible:bg-card text-slate-900 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                      <Input 
                        type="email"
                        placeholder="jane@example.com"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        className="h-11 bg-card border-border focus:bg-card focus-visible:bg-card text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Role</label>
                      <Select value={staffRole} onValueChange={setStaffRole}>
                        <SelectTrigger className="h-11 bg-card border-border rounded-xl text-slate-900">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-card text-slate-900 border-border shadow-xl">
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
                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-sm transition-all active:scale-95"
                      >
                        {t("add_team", "Add")}
                      </Button>
                  </div>
                </div>

                {/* Invited List */}
                {invitedStaff.length > 0 ? (
                  <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                    <div className="bg-muted/30 px-4 py-2 border-b border-border">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invites ({invitedStaff.length})</h4>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {invitedStaff.map((staff, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
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
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-muted/30">
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

                <div className="bg-muted/300 border border-border rounded-2xl p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(industry, 'case')} {t("title", "Title")}</label>
                    <Input 
                      type="text"
                      value={caseTitle}
                      onChange={(e) => setCaseTitle(e.target.value)}
                      placeholder={`E.g., Initial ${getTerm(industry, 'case')} for setup`}
                      className="h-12 bg-card border-primary/20 focus:bg-card focus-visible:bg-card focus:border-primary text-slate-900 rounded-xl"
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
                        className="h-12 bg-card border-primary/20 focus:bg-card focus-visible:bg-card focus:border-primary text-slate-900 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(industry, 'client')} {t("email", "Email")} <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                      <Input 
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="contact@email.com"
                        className="h-12 bg-card border-primary/20 focus:bg-card focus-visible:bg-card focus:border-primary text-slate-900 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-border bg-muted/30 sm:rounded-b-3xl shrink-0">
          <div className="flex justify-between items-center gap-4">
            {step > 1 ? (
              <Button 
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-12 px-6 rounded-xl text-slate-700 border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> {t("back", "Back")}
              </Button>
            ) : (
              <div></div> // Empty div for spacing if no back button
            )}
            
            {step < 4 ? (
              <Button 
                onClick={() => {
                  if (step === 2 && setupMode !== 'orbit' && industry === 'school' && !educationLevel) {
                    toast({ title: "Required", description: "Please select an education level.", variant: "destructive" });
                    return;
                  }
                  if (step === 2 && isMissingMetadata && (!workspaceName || !subdomain)) {
                    toast({ title: "Required", description: "Please enter your workslate name and subdomain.", variant: "destructive" });
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={
                  (step === 1 && !setupMode) || (step === 2 && setupMode === 'custom' && selectedModules.length === 0) || (step === 2 && setupMode === 'orbit' && !orbitPrompt)
                }
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 group transition-all"
              >
                {t("continue_setup", "Continue Setup")}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleCompleteOnboarding}
                disabled={loading || !!orbitProgress}
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading || orbitProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{orbitProgress || t("finalizing_workspace", "Finalizing Workspace...")}</span>
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
    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-border">
      {label}
    </span>
  );
}
