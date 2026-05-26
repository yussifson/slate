import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Building2, Users, Briefcase, ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import { getTerm, INDUSTRIES } from '@/config/industries';
export default function OnboardingWizard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Firm profile
  const [firmName, setFirmName] = useState(user?.company_name || '');
  const [country, setCountry] = useState('Nigeria');
  const [currency, setCurrency] = useState('NGN');

  // Step 2: Staff invites
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('lawyer');
  const [staffName, setStaffName] = useState('');
  const [invitedStaff, setInvitedStaff] = useState([]);

  // Step 3: First Case
  const [caseTitle, setCaseTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const handleAddStaff = () => {
    if (!staffEmail || !staffName) return;
    setInvitedStaff([...invitedStaff, { name: staffName, email: staffEmail, role: staffRole }]);
    setStaffEmail('');
    setStaffName('');
  };

  const handleRemoveStaff = (index) => {
    setInvitedStaff(invitedStaff.filter((_, idx) => idx !== index));
  };

  const handleCompleteOnboarding = async () => {
    if (!user?.company_id) return;
    setLoading(true);

    try {
      // 1. Update company details
      const { error: compError } = await supabase
        .from('companies')
        .update({
          name: firmName,
          country: country,
          currency: currency,
          status: 'active'
        })
        .eq('id', user.company_id);

      if (compError) throw compError;

      // 2. Insert invited staff records
      if (invitedStaff.length > 0) {
        const staffInserts = invitedStaff.map(s => ({
          company_id: user.company_id,
          user_email: s.email,
          full_name: s.name,
          role: s.role,
          department: 'Legal Operations'
        }));
        await supabase.from('staff_records').insert(staffInserts);
      }

      // 3. Create first client and case
      if (clientName && caseTitle) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: user.company_id,
            name: clientName,
            email: clientEmail || `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
            status: 'active'
          })
          .select()
          .single();

        if (!clientError && clientData) {
          await supabase.from('legal_cases').insert({
            company_id: user.company_id,
            client_id: clientData.id,
            title: caseTitle,
            stage: 'intake',
            status: 'active',
            description: 'First case initialized during onboarding.'
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
      localStorage.setItem(`onboarding_done_${user.company_id}`, 'true');
      
      toast({ title: "Setup Complete!", description: "Welcome to your new digital legal workspace." });
      
      const { currentSubdomain, baseDomain } = getSubdomainAndBase();
      if (!currentSubdomain) {
         const { data: company } = await supabase.from('companies').select('subdomain').eq('id', user.company_id).single();
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
      alert("Error setting up workspace: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-6">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
            <Scale className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">Workspace Setup Wizard</span>
        </div>
        <div className="text-xs font-semibold text-slate-400">
          Step {step} of 3
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-xl mx-auto w-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-100 my-8">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step >= s 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                  step > s ? 'bg-primary' : 'bg-slate-100'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company Profile */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Building2 className="w-5 h-5 text-primary" /> Setup your {INDUSTRIES[user?.company_industry || 'law']?.name || 'Workspace'}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Provide your organization's physical coordinates and standard operating currency for dynamic billing templates.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{INDUSTRIES[user?.company_industry || 'law']?.name || 'Workspace'} Name</label>
                <Input 
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="E.g. Mensah & Partners"
                  className="py-5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Country</label>
                  <Select value={country} onValueChange={(v) => {
                    setCountry(v);
                    if (v === 'Ghana') setCurrency('GHS');
                    else if (v === 'Nigeria') setCurrency('NGN');
                    else if (v === 'Sierra Leone') setCurrency('SLL');
                    else setCurrency('USD');
                  }}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="GHS">GHS (₵)</SelectItem>
                      <SelectItem value="SLL">SLL (Le)</SelectItem>
                      <SelectItem value="ZAR">ZAR (R)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => setStep(2)}
                disabled={!firmName}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-5 rounded-xl shadow-md group"
              >
                Continue Setup
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Invite Team */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Users className="w-5 h-5 text-primary" /> Invite your team
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Add your {getTerm(user?.company_industry, 'lawyers').toLowerCase()} and staff members to collaborate in real-time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input 
                    type="text"
                    placeholder="Full Name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Input 
                    type="email"
                    placeholder="email@firm.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Select value={staffRole} onValueChange={setStaffRole} className="w-full">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">{getTerm(user?.company_industry, 'lawyer')}</SelectItem>
                    <SelectItem value="partner">Manager / Partner</SelectItem>
                    <SelectItem value="secretary">Admin / Secretary</SelectItem>
                    <SelectItem value="clerk">Assistant / Clerk</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddStaff}
                  disabled={!staffEmail || !staffName}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-5 text-xs font-bold"
                >
                  Add Team
                </Button>
              </div>

              {/* Invited List */}
              {invitedStaff.length > 0 && (
                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                  {invitedStaff.map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{staff.name}</span>
                        <span className="text-slate-400 font-mono ml-2">({staff.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded font-medium capitalize text-[10px]">{staff.role}</span>
                        <button 
                          onClick={() => handleRemoveStaff(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl text-slate-700 border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button 
                onClick={() => setStep(3)}
                className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl shadow-md group"
              >
                Continue Setup
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: First Case */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-5 h-5 text-primary" /> Initialize your first {getTerm(user?.company_industry, 'case')}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Create a {getTerm(user?.company_industry, 'case').toLowerCase()} and link it to your first active {getTerm(user?.company_industry, 'client').toLowerCase()} to test the pipeline.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(user?.company_industry, 'case')} Title</label>
                <Input 
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder={`E.g., Initial ${getTerm(user?.company_industry, 'case')} for setup`}
                  className="py-5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(user?.company_industry, 'client')} Full Name</label>
                  <Input 
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Adama Mensah"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{getTerm(user?.company_industry, 'client')} Email</label>
                  <Input 
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="contact@email.com"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <Button 
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl text-slate-700 border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button 
                onClick={handleCompleteOnboarding}
                disabled={loading || !caseTitle || !clientName}
                className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing Workspace...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Complete Setup!
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400">
        Skip steps to finalize details inside the main settings panel later.
      </div>
    </div>
  );
}
