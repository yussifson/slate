import { useTranslation} from "react-i18next";
import React, { useState} from 'react';
import { Server, Shield, Database, Headphones, Check, ArrowRight, Building2, Users} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Label} from '@/components/ui/label';
import { Textarea} from '@/components/ui/textarea';
import { useToast} from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/api/supabaseClient';

export default function EnterpriseContact() {
 const { t} = useTranslation();
 const { toast} = useToast();
 const [loading, setLoading] = useState(false);
 const [step, setStep] = useState(1);
 const [formData, setFormData] = useState({
 firstName: '',
 lastName: '',
 workEmail: '',
 companyName: '',
 industry: '',
 userCount: '50-100',
 deployment: 'aws',
 needsMigration: false,
 needsWhitelabel: false,
 needsCompliance: true,
 message: ''
});

 const handleChange = (field, value) => {
 setFormData(prev => ({ ...prev, [field]: value}));
};

 const handleNext = () => setStep(2);
 const handleBack = () => setStep(1);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const payload = {
    first_name: formData.firstName,
    last_name: formData.lastName,
    work_email: formData.workEmail,
    company_name: formData.companyName,
    industry: formData.industry,
    user_count: formData.userCount,
    deployment_type: formData.deployment,
    needs_migration: formData.needsMigration,
    needs_whitelabel: formData.needsWhitelabel,
    needs_compliance: formData.needsCompliance,
    message: formData.message,
    status: 'pending'
  };

  const { error } = await supabase.from('enterprise_requests').insert([payload]);

  setLoading(false);

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Submission Failed',
      description: error.message || 'There was an error submitting your request. Please try again.',
    });
    return;
  }

  setStep(3); // Success step
  toast({
    title: 'Request Received',
    description: 'Our enterprise team will contact you within 24 hours.',
  });
};

 return (
 <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
 {/* Background gradients */}
 <div className="w-full max-w-7xl relative z-10 flex flex-col lg:flex-row rounded-[2.5rem] overflow-hidden border border-white/40 bg-white backdrop-blur-3xl">
 
 {/* Left Side: Premium Info Panel */}
 <div className="w-full lg:w-[45%] bg-primary text-white p-10 md:p-16 flex flex-col justify-between relative overflow-hidden">
 <div className="absolute top-0 right-0 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_50%)] pointer-events-none" />
 
 <div className="relative z-10">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-8 ">
 <Building2 className="w-4 h-4" /> {t("slate_enterprise", "Slate Enterprise")}
 </div>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white leading-tight">
 {t("build_your_custom_deployment", "Build your custom deployment")}
 </h1>
 <p className="text-lg text-slate-300 leading-relaxed mb-12">
 {t(
 "configure_your_infrastructure_",
 "Configure your infrastructure requirements below to receive a tailored architectural proposal and pricing quote."
 )}
 </p>

 <ul className="space-y-8">
 <li className="flex gap-4 items-start">
 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-white/5 ">
 <Shield className="w-6 h-6 text-primary/70" />
 </div>
 <div>
 <p className="font-bold text-base text-white">{t("data_sovereignty", "Data Sovereignty")}</p>
 <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{t(
 "keep_your_client_data_physical",
 "Keep your client data physically isolated within your geographical boundaries."
 )}</p>
 </div>
 </li>
 <li className="flex gap-4 items-start">
 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-white/5 ">
 <Database className="w-6 h-6 text-primary/70" />
 </div>
 <div>
 <p className="font-bold text-base text-white">{t("unlimited_api_limits", "Unlimited API Limits")}</p>
 <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{t(
 "no_rate_limits_on_api_calls_we",
 "No rate limits on API calls, webhooks, or automation triggers."
 )}</p>
 </div>
 </li>
 <li className="flex gap-4 items-start">
 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-white/5 ">
 <Users className="w-6 h-6 text-primary/70" />
 </div>
 <div>
 <p className="font-bold text-base text-white">{t("sla_guarantees", "SLA Guarantees")}</p>
 <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{t(
 "financial_backing_for_99_99_up",
 "Financial backing for 99.99% uptime with immediate resolution routing."
 )}</p>
 </div>
 </li>
 </ul>
 </div>

 <div className="mt-16 pt-8 border-t border-white/10 relative z-10 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t("need_immediate_assistance", "Need immediate assistance?")}</p>
 <a href="tel:+18005550199" className="inline-flex items-center gap-2 font-bold text-xl text-white hover:text-primary/70 transition-colors">
 <Headphones className="w-5 h-5" /> {t("1_800_optal_hq", "1-800-OPTAL-HQ")}
 </a>
 </div>
 </div>
 </div>

 {/* Right Side: Glassmorphism Form */}
 <div className="w-full lg:w-[55%] p-10 md:p-16 relative">
 {/* Progress Bar */}
 {step < 3 && (
 <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/50">
 <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: step === 1 ? '50%' : '100%'}}></div>
 </div>
 )}

 {step === 1 && (
 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
 <h3 className="text-2xl font-extrabold text-slate-900 mb-8">{t("step_1_technical_requirements", "Step 1: Technical Requirements")}</h3>
 
 <div className="space-y-8 flex-1">
 {/* Deployment Type */}
 <div>
 <Label className="text-sm font-bold text-slate-900 mb-3 block">{t("deployment_environment", "Deployment Environment")}</Label>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {['aws', 'azure', 'onprem'].map(type => {
 return (
 <div 
 key={type}
 onClick={() => handleChange('deployment', type)}
 className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center justify-center text-center transition-all bg-slate-50 ${
 formData.deployment === type 
 ? 'border-primary -emerald-600/10' 
 : 'border-slate-200 hover:border-primary/40 '
}`}
 >
 <Server className={`w-6 h-6 mb-3 ${formData.deployment === type ? 'text-primary' : 'text-slate-400'}`} />
 <span className={`text-sm font-bold ${formData.deployment === type ? 'text-primary/70' : 'text-slate-600'}`}>
 {type === 'aws' ? 'Private AWS' : type === 'azure' ? 'Private Azure' : 'Bare Metal'}
 </span>
 </div>
 );
})}
 </div>
 </div>

 {/* Estimated Users */}
 <div>
 <Label className="text-sm font-bold text-slate-900 mb-3 block">{t("estimated_active_users", "Estimated Active Users")}</Label>
 <Select value={formData.userCount} onValueChange={(val) => handleChange('userCount', val)}>
 <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all">
 <SelectValue placeholder="Select user count" />
 </SelectTrigger>
 <SelectContent className="rounded-2xl border-primary/40">
 <SelectItem value="10-50" className="rounded-xl focus:bg-slate-50">{t("10_50_users", "10 - 50 Users")}</SelectItem>
 <SelectItem value="50-100" className="rounded-xl focus:bg-slate-50">{t("50_100_users", "50 - 100 Users")}</SelectItem>
 <SelectItem value="100-500" className="rounded-xl focus:bg-slate-50">{t("100_500_users", "100 - 500 Users")}</SelectItem>
 <SelectItem value="500+" className="rounded-xl focus:bg-slate-50">{t("500_users", "500+ Users")}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Add-ons Toggles */}
 <div>
 <Label className="text-sm font-bold text-slate-900 mb-4 block">{t("enterprise_add_ons", "Enterprise Add-ons")}</Label>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-primary/40 transition-colors">
 <div className="space-y-1">
 <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsMigration', !formData.needsMigration)}>{t("legacy_data_migration", "Legacy Data Migration")}</Label>
 <p className="text-xs text-slate-500 font-medium">{t(
 "securely_port_existing_databas",
 "Securely port existing databases into Slate."
 )}</p>
 </div>
 <Switch checked={formData.needsMigration} onCheckedChange={(c) => handleChange('needsMigration', c)} />
 </div>
 
 <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-primary/40 transition-colors">
 <div className="space-y-1">
 <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsWhitelabel', !formData.needsWhitelabel)}>{t("full_white_labeling", "Full White-Labeling")}</Label>
 <p className="text-xs text-slate-500 font-medium">{t(
 "custom_domain_branding_and_whi",
 "Custom domain, branding, and white-labeled UI."
 )}</p>
 </div>
 <Switch checked={formData.needsWhitelabel} onCheckedChange={(c) => handleChange('needsWhitelabel', c)} />
 </div>

 <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-primary/40 transition-colors">
 <div className="space-y-1">
 <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsCompliance', !formData.needsCompliance)}>{t("compliance_audit_package", "Compliance Audit Package")}</Label>
 <p className="text-xs text-slate-500 font-medium">{t(
 "hipaa_gdpr_soc2_compliance_rep",
 "HIPAA, GDPR, SOC2 compliance reporting."
 )}</p>
 </div>
 <Switch checked={formData.needsCompliance} onCheckedChange={(c) => handleChange('needsCompliance', c)} />
 </div>
 </div>
 </div>
 </div>

 <div className="mt-10 flex justify-end">
 <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-10 rounded-2xl w-full sm:w-auto text-base gap-2 -emerald-600/20 -emerald-600/40 hover:-translate-y-0.5 transition-all">
 {t("continue_to_details", "Continue to Details")} <ArrowRight className="w-5 h-5" />
 </Button>
 </div>
 </div>
 )}

 {step === 2 && (
 <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
 <h3 className="text-2xl font-extrabold text-slate-900 mb-8">{t("step_2_company_details", "Step 2: Company Details")}</h3>
 
 <div className="flex-1">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("first_name", "First Name")}</Label>
 <Input required className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" placeholder="Jane" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("last_name", "Last Name")}</Label>
 <Input required className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" placeholder="Doe" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
 </div>
 </div>

 <div className="space-y-6 mb-6">
 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("work_email", "Work Email")}</Label>
 <Input required type="email" className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" placeholder="jane@company.com" value={formData.workEmail} onChange={(e) => handleChange('workEmail', e.target.value)} />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("company_name", "Company Name")}</Label>
 <Input required className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium" placeholder="Acme Corp" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("industry", "Industry")}</Label>
 <Select value={formData.industry} onValueChange={(val) => handleChange('industry', val)} required>
 <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium">
 <SelectValue placeholder="Select industry" />
 </SelectTrigger>
 <SelectContent className="rounded-2xl border-primary/40">
 <SelectItem value="law" className="rounded-xl focus:bg-slate-50">{t("law_firm", "Law Firm")}</SelectItem>
 <SelectItem value="healthcare" className="rounded-xl focus:bg-slate-50">{t("healthcare_hospital", "Healthcare / Hospital")}</SelectItem>
 <SelectItem value="education" className="rounded-xl focus:bg-slate-50">{t("education", "Education")}</SelectItem>
 <SelectItem value="finance" className="rounded-xl focus:bg-slate-50">{t("finance_insurance", "Finance / Insurance")}</SelectItem>
 <SelectItem value="other" className="rounded-xl focus:bg-slate-50">{t("other", "Other")}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <Label className="text-sm font-bold text-slate-900">{t("any_specific_requirements_opti", "Any specific requirements? (Optional)")}</Label>
 <Textarea 
 className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none font-medium p-4" 
 placeholder="Tell us about your current infrastructure..."
 value={formData.message}
 onChange={(e) => handleChange('message', e.target.value)}
 />
 </div>
 </div>
 </div>

 <div className="mt-10 flex justify-between items-center gap-4">
 <Button type="button" variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-900 font-bold hover:bg-slate-200/50 rounded-2xl px-6 py-6 h-auto">
 {t("back", "Back")}
 </Button>
 <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 px-10 rounded-2xl w-full sm:w-auto text-base -slate-900/20 hover:-translate-y-0.5 transition-all">
 {loading ? 'Submitting Request...' : 'Submit Request'}
 </Button>
 </div>
 </form>
 )}

 {step === 3 && (
 <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col items-center justify-center">
 <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/40">
 <Check className="w-12 h-12 text-primary" strokeWidth={3} />
 </div>
 <h3 className="text-3xl font-extrabold text-slate-900 mb-4">{t("request_sent_successfully", "Request Sent Successfully!")}</h3>
 <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed mb-10">
 {t("thank_you", "Thank you,")} <span className="font-bold text-slate-900">{formData.firstName}</span>{t(
 "our_enterprise_solution_team_w",
 ". Our Enterprise Solution team will review your deployment requirements and be in touch within 24 hours to schedule a discovery call."
 )}
 </p>
 <Button onClick={() => window.location.href = '/'} variant="outline" className="rounded-2xl font-bold px-10 py-6 h-auto border-primary/40 text-slate-700 hover:bg-slate-100 transition-colors">
 {t("return_to_home", "Return to Home")}
 </Button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
