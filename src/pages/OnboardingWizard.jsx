import { powerSync} from '@/api/PowerSyncConnector';
import { NotificationService } from "@/lib/notifications";
import { useTranslation} from "react-i18next";
import { useState, useRef, useEffect} from 'react';
import { useNavigate} from 'react-router-dom';
import { supabase} from '@/api/supabaseClient';
import { useAuth} from '@/lib/AuthContext';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Scale, Building2, Users, Briefcase, ArrowRight, ArrowLeft, Check, Sparkles, X} from "lucide-react";
import confetti from 'canvas-confetti';
import { useToast} from '@/components/ui/use-toast';
import { getSubdomainAndBase, isDesktopApp} from '@/lib/domainUtils';
import { getTerm, INDUSTRIES} from '@/config/industries';
import { COUNTRIES_CURRENCIES } from '@/config/countries';
import { generateOrbitBuildWorkspace } from '@/lib/orbitBuildGenerator';
import { initiatePaystackSubscription } from "@/lib/paystack";
import { detectMarketTier } from '@/lib/pricing';
import { OrbitLoader } from "@/components/ui/orbit-loader";
export default function OnboardingWizard() {
 const { t} = useTranslation();
 const { user, refreshUser} = useAuth();
 const { toast} = useToast();
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
 scrollRef.current.scrollTo({ top: 0, behavior: 'smooth'});
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
 const searchParams = new URLSearchParams(window.location.search);
 const urlPrompt = searchParams.get('orbit_prompt');
 
 if (urlPrompt) {
   localStorage.setItem('pendingOrbitPrompt', urlPrompt);
   
   // Clean up URL so it doesn't stay there on refresh
   const newUrl = window.location.pathname + window.location.search.replace(/&?orbit_prompt=[^&]*/, '').replace(/^\?$/, '');
   window.history.replaceState({}, '', newUrl || '/');
 }

 const pendingPrompt = urlPrompt || localStorage.getItem('pendingOrbitPrompt');
 if (pendingPrompt) {
   setSetupMode('orbit');
   setOrbitPrompt(pendingPrompt);
   setStep(2); // Jump to Profile step to get Company Name
 }
}, []);


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

 // Step 4: Subscription Plan
 const [plans, setPlans] = useState([]);
 const [plansLoading, setPlansLoading] = useState(true);
 const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { tier } = await detectMarketTier();
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('market_tier', tier)
          .order('price_monthly', { ascending: true });
          
        if (error) throw error;
        // Filter active plans locally if needed, but usually they should all be active
        const activePlans = (data || []).filter(p => p.is_active === true || p.is_active === 'true' || p.is_active === 1);
        
        const hasFree = activePlans.some(p => p.price_monthly === 0);
        if (!hasFree) {
          activePlans.unshift({
            id: 'free',
            name: 'Free',
            price_monthly: 0,
            limits: { users: 1, ai_credits_monthly: 100 }
          });
        }
        
        setPlans(activePlans);
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan) => {
    if (plan.price_monthly === 0) {
      await handleCompleteOnboarding(plan);
    } else {
      setLoading(true);
      try {
        await initiatePaystackSubscription({
          email: user?.email || 'user@example.com',
          amount: plan.price_monthly,
          currency: 'GHS', // Hardcoded to GHS for Paystack merchant constraint
          planName: plan.name,
          companyId: user?.company_id || user?.id || 'new_user',
          onSuccess: async (ref) => {
            await handleCompleteOnboarding(plan, ref);
          },
          onClose: () => {
            setLoading(false);
            toast({ title: "Payment Cancelled", description: "You cancelled the payment." });
          }
        });
      } catch (err) {
        setLoading(false);
        toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
      }
    }
  };

 const handleAddStaff = () => {
 if (!staffEmail || !staffName) return;
 setInvitedStaff([...invitedStaff, { name: staffName, email: staffEmail, role: staffRole}]);
 setStaffEmail('');
 setStaffName('');
 setStaffRole('');
};

 const handleRemoveStaff = (index) => {
 setInvitedStaff(invitedStaff.filter((_, idx) => idx !== index));
};

 const handleCompleteOnboarding = async (selectedPlan = null, paystackRef = null) => {
 setLoading(true);

 try {
 let companyIdToUse = user?.company_id;

 if (!companyIdToUse) {
 // Check if a company was already created by this user in a previous partial attempt
 const { data: existingComp, error: existingErr} = await supabase
 .from('companies')
 .select('id, subdomain')
 .eq('email', user?.email)
 .limit(1)
 .maybeSingle();

 if (existingComp) {
 companyIdToUse = existingComp.id;
}

 if (!companyIdToUse) {
 const cName = workspaceName || md.company_name || 'My Workslate';
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
    const compPayload = {
      id: crypto.randomUUID(),
      name: cName,
      subdomain: finalSubdomain,
      email: user.email,
      industry_type: finalIndustry || 'law',
      country: country,
      currency: currency,
      status: 'active'
    };
    if (selectedPlan) {
      compPayload.subscription_plan = selectedPlan.name.toLowerCase().replace(/\s/g, '');
      compPayload.subscription_status = selectedPlan.price_monthly > 0 ? 'active' : 'trial';
    } else {
      compPayload.subscription_plan = 'starter';
      compPayload.subscription_status = 'trial';
    }
     const { data: newComp, error: newCompErr } = await supabase
       .from('companies')
       .insert(compPayload)
       .select()
       .single();

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

 // Only include columns that are guaranteed to exist in the current Supabase profiles schema.
 // full_name and industry_type are added via migration - handled below via PowerSync for local sync.
 const supaProfilePayload = {
   company_id: companyIdToUse,
   company_name: workspaceName || 'My Workslate'};

 if (user?.role !== 'super_admin') {
   supaProfilePayload.role = 'company_admin'; // Must match Supabase CHECK constraint
 }

 const { error: profErr } = await supabase
   .from('profiles')
   .update(supaProfilePayload)
   .eq('id', user.id);

 if (profErr) throw profErr;

  // Removed local PowerSync profile update to prevent view upsert errors.
  // Supabase Realtime will sync this down shortly.
}

 // 1. Update company details
 let finalIndustry = (industry === 'school' && educationLevel !== 'basic') ? educationLevel : industry;
 if (setupMode === 'orbit') {
 finalIndustry = 'orbit_build';
}

 const updCompPayload = {
 industry_type: finalIndustry,
 country: country,
 currency: currency,
 status: 'active'
};

 if (selectedPlan) {
   updCompPayload.subscription_plan = selectedPlan.name.toLowerCase().replace(/\s/g, '');
   updCompPayload.subscription_status = selectedPlan.price_monthly > 0 ? 'active' : 'trial';
 }

  const { error: compError } = await supabase
    .from('companies')
    .update(updCompPayload)
    .eq('id', companyIdToUse);

  if (compError) {
    console.warn("Full company update failed, trying safe fields only:", compError.message);
    const safePayload = { status: 'active' };
    if (selectedPlan) {
      safePayload.subscription_plan = selectedPlan.name.toLowerCase().replace(/\s/g, '');
      safePayload.subscription_status = selectedPlan.price_monthly > 0 ? 'active' : 'trial';
    }
    const { error: safeCompError } = await supabase
      .from('companies')
      .update(safePayload)
      .eq('id', companyIdToUse);
      
    if (safeCompError) throw safeCompError;
  }

  // If there was a successful payment reference, save it to invoices so it shows in their billing history
  if (selectedPlan && paystackRef) {
    try {
      await supabase.from('subscription_invoices').insert([{
        company_id: companyIdToUse,
        plan_name: selectedPlan.name,
        amount_usd: String(selectedPlan.price_monthly || 0),
        status: 'paid',
        notes: `paystack_ref: ${paystackRef.reference}, currency: GHS`,
        paid_date: new Date().toISOString()
      }]);
      
      // Trigger omnichannel receipt/notification for the initial purchase
      await NotificationService.send({
        companyId: companyIdToUse,
        recipientEmail: user?.email,
        recipientName: user?.user_metadata?.full_name || 'Admin',
        title: 'Welcome to your Premium Workspace',
        message: `Your workspace has been successfully initialized on the ${selectedPlan.name} plan.`,
        type: 'success',
        channels: ['in-app', 'email']
      });
    } catch (invErr) {
      console.error("Failed to process post-payment tasks during onboarding:", invErr);
    }
  }

  // Update profile industry_type - try Supabase first (works after migration), 
  // always update locally via PowerSync too
  const { error: profIndustryErr } = await supabase
    .from('profiles')
    .update({ industry_type: finalIndustry })
    .eq('id', user.id);
  if (profIndustryErr) {
    // Column may not exist yet (migration not applied) - silently ignore and rely on localStorage fallback
    console.warn('[Onboarding] Could not update profile.industry_type in Supabase (migration pending):', profIndustryErr.message);
  }
  // Removed local PowerSync industry_type update to prevent view upsert errors.
  


 // 2. Insert invited staff records
 if (invitedStaff.length > 0) {
   const staffInserts = invitedStaff.map(s => ({
     id: crypto.randomUUID(),
     company_id: companyIdToUse,
     user_email: s.email,
     full_name: s.name,
     role: s.role,
     department: 'Operations'
   }));
   
   const { error: staffErr } = await supabase.from('staff_records').insert(staffInserts);
   if (staffErr) console.error("Failed to save staff records:", staffErr);
 }

 // 3. Remove first client/case creation (replaced by pricing plans logic)

 // 4. Trigger celebration confetti
 confetti({
 particleCount: 150,
 spread: 80,
 origin: { y: 0.5}
});

 // Handle OrbitBuild if selected
 if (setupMode === 'orbit' && orbitPrompt) {
 setOrbitProgress("Analyzing Industry & Assembling Workspace...");
 try {
 await generateOrbitBuildWorkspace(orbitPrompt, companyIdToUse);
 return { success: true, companyId: companyIdToUse };
} catch (err) {
 console.error(err);
 toast({ title: "Setup Failed", description: err.message, variant: "destructive"});
 setLoading(false);
 return { success: false };
}
}

 // 5. Refresh user session and go to dashboard
 await refreshUser();
 
 // Store onboarding completion in localStorage to prevent repeat redirects
 localStorage.setItem(`onboarding_done_${companyIdToUse}`, 'true');
 localStorage.removeItem('pendingOrbitPrompt');

 // Prepare the modules to save
 let activeModulesToSave = null;
 if (setupMode === 'orbit') {
 activeModulesToSave = ['__orbit__'];
} else if (setupMode === 'custom') {
 activeModulesToSave = selectedModules;
}

 // Store setup mode and selected modules in localStorage
 localStorage.setItem(`setup_mode_${companyIdToUse}`, setupMode);
 if (activeModulesToSave) {
 localStorage.setItem(`active_modules_${companyIdToUse}`, JSON.stringify(activeModulesToSave));
 
  // Save active modules to database for cross-device persistence
  const { data: existingCheck } = await supabase
    .from('industry_records')
    .select('id')
    .eq('company_id', companyIdToUse)
    .eq('record_type', 'active_modules')
    .maybeSingle();

  let recordId = crypto.randomUUID();
  let isUpdate = false;
  if (existingCheck) {
    recordId = existingCheck.id;
    isUpdate = true;
  }
  
  const indPayload = {
    id: recordId,
    company_id: companyIdToUse,
    industry: finalIndustry,
    record_type: 'active_modules',
    search_text: 'custom active modules selected',
    data: activeModulesToSave
  };

  if (isUpdate) {
    const { error: indUpdErr } = await supabase
      .from('industry_records')
      .update({
        industry: finalIndustry,
        data: indPayload.data,
        search_text: 'custom active modules selected'
      })
      .eq('id', recordId);
    if (indUpdErr) console.error("Failed to update active modules record:", indUpdErr);
  } else {
    const { error: indInsErr } = await supabase.from('industry_records').insert([indPayload]);
    if (indInsErr) console.error("Failed to insert active modules record:", indInsErr);
  }
} else {
 localStorage.removeItem(`active_modules_${companyIdToUse}`); // Template implies all modules
}
 
 // Trigger Workspace Ready Notification (Novu Webhook)
  try {
    const notifPayload = {
      id: crypto.randomUUID(),
      company_id: companyIdToUse,
      recipient_email: user?.email,
      recipient_name: user?.user_metadata?.full_name || 'Admin',
      title: "Your Workspace is Ready!",
      message: `Your ${finalIndustry} workspace has been successfully created and configured. You can now access your dashboard and start managing your operations.`,
      type: 'success',
      is_read: false
    };
    await supabase.from('notifications').insert([notifPayload]);
  } catch(err) { console.error("Notification failed:", err); }


 toast({ title: "Setup Complete!", description: "Welcome to your new digital workspace."});
 
 // Build cross-subdomain transfer params
 const transferParams = new URLSearchParams();
 transferParams.set('setup_mode', setupMode);
 transferParams.set('industry', finalIndustry); // Pass industry so dashboard loads instantly without waiting for sync
 if (activeModulesToSave) {
 transferParams.set('active_modules', JSON.stringify(activeModulesToSave));
}
 
 const { data: { session}} = await supabase.auth.getSession();
 if (session) {
 transferParams.set('access_token', session.access_token);
 transferParams.set('refresh_token', session.refresh_token);
}

 const { currentSubdomain, baseDomain} = getSubdomainAndBase();
 if (!currentSubdomain) {
 const __resCompS = await powerSync.execute(`SELECT subdomain FROM companies WHERE id = ?`, [companyIdToUse]);
 const company = __resCompS.rows && __resCompS.rows.length > 0 ? __resCompS.rows.item(0) : null;
  const isNativeApp = isDesktopApp();
  if (company?.subdomain && !isNativeApp) {
    const port = window.location.port ? `:${window.location.port}` : '';
    window.location.href = `${window.location.protocol}//${company.subdomain}.${baseDomain}${port}/?${transferParams.toString()}`;
    return;
  }
}
 navigate(`/?${transferParams.toString()}`);
} catch (err) {
 console.error("Onboarding failed:", err);
 // Give a better error message if it's a fetch error
 let errMsg = err.message || err.toString();
 if (errMsg.includes('Failed to fetch')) {
 errMsg += " (This is often caused by a network issue, ad-blocker, or a problem connecting to the database)";
}
 toast({ title: "Setup Failed", description: errMsg, variant: "destructive"});
} finally {
 setLoading(false);
}
};

 const steps = [
 { num: 1, title: 'Setup Mode'},
 { num: 2, title: 'Profile'},
 { num: 3, title: 'Team'},
 { num: 4, title: 'Launch'}
 ];

 return (
 <div className="min-h-[100dvh] bg-background flex flex-col justify-center items-center sm:py-12 sm:px-6 relative overflow-hidden font-sans">
 
 {/* Background Decorative Elements */}
 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

 {/* Main Container */}
 <div className={`w-full h-[100dvh] sm:h-auto ${step === 4 ? 'sm:max-w-[95%]' : 'sm:max-w-3xl'} bg-card sm:rounded-3xl sm:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm sm:border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8/60 relative z-10 flex flex-col sm:my-10 transition-all duration-500`}>
 
 {/* Header Section */}
 <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-primary/40 shrink-0">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <img src="/slate-logo.svg" alt="Slate" className="h-10" />
 <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t("workslate_setup_wizard", "WorkSlate Setup")}</h1>
 </div>
 </div>

 {/* Progress Indicator */}
 <div className="relative">
 <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full"></div>
 <div 
 className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
 style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%`}}
 ></div>
 
 <div className="relative flex justify-between">
 {steps.map((s) => {
 const isCompleted = step > s.num;
 const isCurrent = step === s.num;
 return (
 <div key={s.num} className="flex flex-col items-center">
 <div 
 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ring-4 ring-background
 ${isCompleted ? 'bg-primary text-white ' : 
 isCurrent ? 'bg-card border-2 border-primary text-primary ' : 
 'bg-muted text-[#71717a] dark:text-gray-400 border-2 border-primary/40'}`}
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
 <h2 className="text-2xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">
 Choose Your Setup Mode
 </h2>
 <p className="text-slate-500 text-sm leading-relaxed">
 How would you like to initialize your workslate?
 </p>
 </div>

 <div className="space-y-4">
 {(setupMode === 'template' || setupMode === 'custom') && (
 <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">{t("industry", "Workslate")}</label>
 <Select value={industry} onValueChange={setIndustry}>
 <SelectTrigger className="h-12 bg-card border-primary/40 rounded-xl text-slate-900 focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-card text-slate-900 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectItem value="law">{t("law_firm", "Law Firm")}</SelectItem>
 <SelectItem value="retail">{t("retail_pos", "Retail / POS")}</SelectItem>
 <SelectItem value="real_estate">{t("real_estate", "Real Estate")}</SelectItem>
 <SelectItem value="school">{t("school_education", "School & Education")}</SelectItem>
 <SelectItem value="hospital">{t("hospital_healthcare", "Hospital & Healthcare")}</SelectItem>
 <SelectItem value="hotel">{t("hotel_hospitality", "Hotel & Hospitality")}</SelectItem>
 <SelectItem value="logistics">{t("logistics_delivery", "Logistics & Delivery")}</SelectItem>
 <SelectItem value="insurance">{t("insurance", "Insurance Agency")}</SelectItem>
 <SelectItem value="religion">{t("religion_religion", "Religious Organization")}</SelectItem>
 <SelectItem value="hr">{t("hr_erp", "HR & ERP")}</SelectItem>
 </SelectContent>
 </Select>
 
 {industry === 'school' && (
 <div className="space-y-2 mt-4">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">Education Level</label>
 <Select value={educationLevel} onValueChange={setEducationLevel}>
 <SelectTrigger className="w-full h-12 bg-card border-primary/40 rounded-xl text-slate-900 focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue placeholder="Select level" />
 </SelectTrigger>
 <SelectContent className="bg-card text-slate-900 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 </div>
 )}

 {/* Template Option */}
 <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'template' ? 'border-primary bg-primary/5 ' : 'border-primary/40 hover:border-primary/30 bg-card'}`}>
 <input 
 type="radio" 
 name="setupMode" 
 value="template" 
 checked={setupMode === 'template'} 
 onChange={() => setSetupMode('template')} 
 className="sr-only" 
 />
 <div className="flex items-start gap-4">
 <div className={`w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'template' ? 'border-primary bg-primary' : 'border-primary/40'}`}>
 {setupMode === 'template' && <div className="w-2 h-2 rounded-full bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>}
 </div>
 <div>
 <h3 className={`font-semibold ${setupMode === 'template' ? 'text-primary' : 'text-slate-900'}`}>Build with Template</h3>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">Initializes your dashboard with all standard predefined pages and slates for a {INDUSTRIES[industry]?.name || 'business'}. Recommended for quick starts.</p>
 </div>
 </div>
 </label>
 
 {/* Orbit Option */}
 <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${setupMode === 'orbit' ? 'border-primary bg-primary/5 ' : 'border-primary/40 hover:border-primary/30 bg-card'}`}>
 <input 
 type="radio" 
 name="setupMode" 
 value="orbit" 
 checked={setupMode === 'orbit'} 
 onChange={() => setSetupMode('orbit')} 
 className="sr-only" 
 />
 <div className="flex items-start gap-4">
 <div className={`w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'orbit' ? 'border-primary bg-primary' : 'border-primary/40'}`}>
 {setupMode === 'orbit' && <div className="w-2 h-2 rounded-full bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className={`font-semibold ${setupMode === 'orbit' ? 'text-primary' : 'text-slate-900'}`}>Build with Orbit</h3>
 <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-primary/90 text-[10px] font-semibold uppercase tracking-wider tracking-[0.04em]">AI Powered</span>
 </div>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">Start fresh with a blank slate. Use Orbit AI to dynamically generate custom pages and databases exactly how you want them.</p>
 </div>
 </div>
 </label>

 {/* Custom Option */}
 <div className={`relative p-5 rounded-2xl border-2 transition-all duration-200 ${setupMode === 'custom' ? 'border-primary bg-primary/5' : 'border-primary/40 hover:border-primary/40 bg-card'}`}>
 <label className="flex items-start gap-4 cursor-pointer">
 <input 
 type="radio" 
 name="setupMode" 
 value="custom" 
 checked={setupMode === 'custom'} 
 onChange={() => setSetupMode('custom')} 
 className="sr-only" 
 />
 <div className={`w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${setupMode === 'custom' ? 'border-primary bg-primary' : 'border-primary/40'}`}>
 {setupMode === 'custom' && <div className="w-2 h-2 rounded-full bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>}
 </div>
 <div>
 <h3 className={`font-semibold ${setupMode === 'custom' ? 'text-primary' : 'text-slate-900'}`}>Custom Selection</h3>
 <p className="text-sm text-slate-500 mt-1 leading-relaxed">Hand-pick exactly which predefined pages you want to include in your workslate.</p>
 </div>
 </label>
 
 {setupMode === 'custom' && (
 <div className="mt-5 pt-5 border-t border-primary/40 pl-9">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
 {INDUSTRIES[industry]?.nav?.filter(n => !['/', '/settings', '/integrations', '/admin'].includes(n.path)).map((navItem) => (
 <label key={navItem.path} className="flex items-center space-x-3 p-3 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl cursor-pointer hover:border-primary/40 transition-colors group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 <div className="w-5 h-5 border-2 border-primary/40 rounded-md peer-checked:bg-slate-800 peer-checked:border-primary/40 transition-colors"></div>
 <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
 </div>
 <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{navItem.label}</span>
 </label>
 ))}
 </div>
 {selectedModules.length === 0 && (
 <p className="text-xs text-amber-600 font-medium mt-3 bg-amber-50 p-2 rounded-xl inline-block tracking-[0.04em]">Please select at least one slate to continue.</p>
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
 className="mt-1 h-12 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <div>
 <label className="text-sm font-semibold text-slate-700">Subdomain</label>
 <Input 
 value={subdomain}
 onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
 placeholder="yourcompany"
 className="mt-1 h-12 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 <p className="text-xs text-slate-500 mt-1 tracking-[0.04em]">This will be your dedicated login portal url.</p>
 </div>
 </div>
 )}

 <div className="space-y-2">
 <h2 className="text-2xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">
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
 <div className="space-y-3 mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
 <div>
 <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Describe Your Workslate</h3>
 <p className="text-sm text-slate-500 mt-1">OrbitBuild will assemble the perfect workslate for you.</p>
 </div>
 <textarea
 value={orbitPrompt}
 onChange={(e) => setOrbitPrompt(e.target.value)}
 placeholder="E.g., Build a veterinary clinic management system with pet records, appointments, and billing..."
 className="w-full h-32 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 )}

 </div>

 <div className="grid grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">{t("country", "Country")}</label>
 <Select value={country} onValueChange={(v) => {
 setCountry(v);
}}>
 <SelectTrigger className="h-12 bg-card border-primary/40 rounded-xl text-slate-900 focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-card text-slate-900 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {COUNTRIES_CURRENCIES.map((c) => (
 <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">{t("currency", "Currency")}</label>
 <Select value={currency} onValueChange={setCurrency}>
 <SelectTrigger className="h-12 bg-card border-primary/40 rounded-xl text-slate-900 focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-card text-slate-900 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 <h2 className="text-2xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">
 {t("invite_your_team", "Invite your team")}
 </h2>
 <p className="text-slate-500 text-sm leading-relaxed">
 {t("add_your", "Add your")} {getTerm(industry, 'lawyer').toLowerCase()}{t(
 "s_and_staff_members_to_collabo",
 "s and staff members to collaborate in real-time. An email invitation will be automatically dispatched containing a secure registration link. Once they sign up, their account will be instantly linked to your workslate."
 )}
 </p>
 </div>

 <div className="bg-muted/30 rounded-2xl p-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">Full Name</label>
 <Input 
 type="text"
 placeholder="e.g. Jane Doe"
 value={staffName}
 onChange={(e) => setStaffName(e.target.value)}
 className="h-11 bg-card border-primary/40 focus:bg-card focus-visible:bg-card text-slate-900 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">Email Address</label>
 <Input 
 type="email"
 placeholder="jane@example.com"
 value={staffEmail}
 onChange={(e) => setStaffEmail(e.target.value)}
 className="h-11 bg-card border-primary/40 focus:bg-card focus-visible:bg-card text-slate-900 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <div className="flex gap-3 items-end">
 <div className="flex-1 space-y-2">
 <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide tracking-[0.04em]">Role</label>
 <Select value={staffRole} onValueChange={setStaffRole}>
 <SelectTrigger className="h-11 bg-card border-primary/40 rounded-xl text-slate-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <SelectValue placeholder="Select a role" />
 </SelectTrigger>
 <SelectContent className="bg-card text-slate-900 border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all active:scale-95"
 >
 {t("add_team", "Add")}
 </Button>
 </div>
 </div>

 {/* Invited List */}
 {invitedStaff.length > 0 ? (
 <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden bg-card  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="bg-muted/30 px-4 py-2 border-b border-primary/40">
 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider tracking-[0.04em]">Pending Invites ({invitedStaff.length})</h4>
 </div>
 <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
 {invitedStaff.map((staff, idx) => (
 <div key={idx} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold text-xs tracking-[0.04em]">
 {staff.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="font-semibold text-slate-900 text-sm leading-none">{staff.name}</p>
 <p className="text-slate-500 text-xs mt-1 tracking-[0.04em]">{staff.email}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Badge role={staff.role} industry={industry} />
 <button 
 onClick={() => handleRemoveStaff(idx)}
 className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
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
 <div className="border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center bg-muted/30">
 <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
 <p className="text-sm text-slate-500 font-medium">No team members added yet.</p>
 <p className="text-xs text-slate-400 mt-1 tracking-[0.04em]">You can always invite them later from settings.</p>
 </div>
 )}
 </div>
 )}

 {/* Step 4: Subscription Plans */}
 {step === 4 && (
 <div className="space-y-8">
 <div className="space-y-2">
 <h2 className="text-2xl font-semibold text-slate-900 tracking-tight tracking-[-0.02em]">
 {t("choose_your_plan", "Choose your plan")}
 </h2>
 <p className="text-slate-500 text-sm leading-relaxed">
 {t("select_a_subscription_tier_tha", "Select a subscription tier that matches your firm's operational needs.")}
 </p>
 </div>

 {plansLoading ? (
   <div className="flex justify-center items-center py-20">
     <OrbitLoader size="md" />
   </div>
 ) : (
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full w-full mx-auto">
      {plans.map((p) => {
        const isHighlight = p.price_monthly > 0 && p.price_monthly < 500; // e.g., Professional plan highlight
        return (
          <div 
            key={p.id} 
            className={`relative flex flex-col bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 p-8 ${
              isHighlight
                ? 'border-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_8px_30px_rgb(0,0,0,0.08)] md:-translate-y-2'
                : 'border-primary/20 hover:border-primary/40'
            }`}
          >
            {isHighlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap tracking-[0.04em]">
                Most popular
              </div>
            )}
            
            <div className="mb-6 pb-6 border-b border-primary/20">
              <h3 className="font-semibold text-2xl text-slate-900 mb-2 tracking-tight tracking-[-0.02em]">{p.name}</h3>
              <p className="text-sm text-slate-500 font-medium">
                {p.price_monthly === 0 ? "Perfect to get started and explore." : "Advanced features for growing teams."}
              </p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-end gap-2 mb-1">
                {p.price_monthly === 0 ? (
                  <span className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter tracking-[-0.02em]">Free</span>
                ) : (
                  <>
                    <span className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter tracking-[-0.02em]">GH₵{p.price_monthly}</span>
                    <span className="text-slate-400 text-sm font-semibold mb-1.5">/ mo</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50/80 rounded-2xl p-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 mb-8 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">Team Size</span>
                <span className="text-slate-900 text-right">{p.limits?.users || (p.price_monthly === 0 ? 1 : 'Unlimited')}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">AI Credits</span>
                <span className="text-slate-900">{p.limits?.ai_credits_monthly || (p.price_monthly === 0 ? 100 : 'Unlimited')}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500">Support</span>
                <span className="text-slate-900">{p.price_monthly === 0 ? 'Community' : 'Priority'}</span>
              </div>
            </div>

            <div className="mt-auto">
              <Button 
                disabled={loading}
                onClick={() => handleSelectPlan(p)}
                className={`w-full py-6 text-sm rounded-2xl font-semibold transition-all ${
                  isHighlight
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {loading ? <OrbitLoader size="md" /> : (
                  p.price_monthly === 0 ? "Start for Free" : "Upgrade Now"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
 )}
 </div>
 )}
 
 </div>
 </div>

 {/* Footer Navigation */}
 <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-primary/40 bg-muted/30 sm:rounded-md-b-3xl shrink-0">
 <div className="flex justify-between items-center gap-4">
 {step > 1 ? (
 <Button 
 variant="outline"
 onClick={() => setStep(step - 1)}
 className="h-12 px-6 rounded-xl text-slate-700 border-primary/40 bg-card hover:bg-muted/30 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <ArrowLeft className="w-4 h-4 mr-2" /> {t("back", "Back")}
 </Button>
 ) : (
 <div></div> // Empty div for spacing if no back button
 )}
 
              {step < 4 ? (
                <div className="flex gap-3">
                  {step === 3 && (
                    <Button 
                      variant="outline"
                      onClick={() => setStep(step + 1)}
                      className="h-12 px-6 rounded-xl border-primary/40 bg-card hover:bg-muted/30 transition-colors font-semibold hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                    >
                      {t("skip_for_now", "Skip for now")}
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      if (step === 2 && setupMode !== 'orbit' && industry === 'school' && !educationLevel) {
                        toast({ title: "Required", description: "Please select an education level.", variant: "destructive"});
                        return;
                      }
                      if (step === 2 && isMissingMetadata && (!workspaceName || !subdomain)) {
                        toast({ title: "Required", description: "Please enter your workslate name and subdomain.", variant: "destructive"});
                        return;
                      }
                      setStep(step + 1);
                    }}
                    disabled={
                      (step === 1 && !setupMode) || (step === 2 && setupMode === 'custom' && selectedModules.length === 0) || (step === 2 && setupMode === 'orbit' && !orbitPrompt)
                    }
                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center group transition-all"
                  >
                    {t("continue_setup", "Continue Setup")}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  {/* Skip for now is removed; user must select a plan (Free or Paid) from the cards */}
                </div>
              )}
 </div>
 </div>
 </div>
 </div>
 );
}

// Helper component for role badges
function Badge({ role, industry}) {
 const roles = INDUSTRIES[industry]?.roles || INDUSTRIES.law.roles;
 const roleDef = roles.find(r => r.value === role);
 const label = roleDef ? roleDef.label : role;
 
 return (
 <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-orange-50 text-orange-700 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 tracking-[0.04em]">
 {label}
 </span>
 );
}
