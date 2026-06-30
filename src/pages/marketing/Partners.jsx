import { useTranslation} from "react-i18next";
import { useState } from "react";
import { Handshake, ArrowRight, ShieldCheck, Globe, Rocket, Check, Loader2, User, Mail, Building2, Briefcase, ChevronDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import confetti from "canvas-confetti";
import { supabase } from "@/api/supabaseClient";
import { toast } from "@/components/ui/use-toast";

export default function Partners() {
 const { t } = useTranslation();
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [dialogType, setDialogType] = useState('become'); // 'become' or 'find'
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [formData, setFormData] = useState({
   name: '',
   email: '',
   company_name: '',
   partner_type: 'Technology',
   message: ''
 });

 const openDialog = (type) => {
   setDialogType(type);
   setIsDialogOpen(true);
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   setIsSubmitting(true);
   try {
     const { error } = await supabase.from('partner_applications').insert({
       ...formData,
       partner_type: dialogType === 'find' ? 'Find a Partner' : formData.partner_type,
       status: 'pending'
     });
     
     if (error) throw error;
     
     confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
     toast({ title: "Application Submitted", description: "We will review your details and get back to you shortly." });
     setIsDialogOpen(false);
     setFormData({ name: '', email: '', company_name: '', partner_type: 'Technology', message: '' });
   } catch (error) {
     toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
   } finally {
     setIsSubmitting(false);
   }
 };

 return (
 <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
 <div className="text-center max-w-3xl mx-auto mb-20">
 <div className="w-20 h-20 bg-slate-100 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
 <Handshake className="w-10 h-10" />
 </div>
 <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 tracking-[-0.02em]">
 {t("slate_partner_network", "Slate Partner Network")}
 </h1>
 <p className="text-xl text-slate-600 leading-relaxed mb-10">
 {t(
 "join_our_ecosystem_of_technolo",
 "Join our ecosystem of technology partners, system integrators, and resellers delivering next-generation workspace solutions to enterprises worldwide."
 )}
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Button 
   onClick={() => openDialog('become')} 
   className="rounded-full px-8 bg-primary text-white hover:bg-primary/90 h-14 text-lg font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 w-full sm:w-auto"
 >
 {t("become_a_partner", "Become a Partner")}
 </Button>
 <Button 
   onClick={() => openDialog('find')} 
   variant="outline" 
   className="rounded-full px-8 h-14 text-lg font-semibold w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 transition-all hover:-translate-y-0.5"
 >
 {t("find_a_partner", "Find a Partner")}
 </Button>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <Globe className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("technology_partners", "Technology Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "build_integrations_and_apps_on",
 "Build integrations and apps on our platform to reach thousands of enterprise customers looking to extend their workspace."
 )}
 </p>
 </div>
 
 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <ShieldCheck className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("solutions_partners", "Solutions Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "consult_implement_and_manage_o",
 "Consult, implement, and manage Slate deployments for enterprise clients with complex requirements."
 )}
 </p>
 </div>

 <div className="bg-white p-10 rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
 <Rocket className="w-7 h-7" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{t("referral_partners", "Referral Partners")}</h3>
 <p className="text-slate-600 leading-relaxed">
 {t(
 "recommend_slate_to_your_ne",
 "Recommend Slate to your network and earn recurring commissions for every successful enterprise contract."
 )}
 </p>
 </div>
 </div>

  {/* Partner Application Dialog */}
  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogContent className="sm:max-w-[500px] max-h-[85vh] p-0 border-0 shadow-2xl rounded-3xl flex flex-col overflow-hidden">
      <div className="bg-slate-50/50 p-6 md:p-8 border-b border-slate-100 backdrop-blur-md shrink-0">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20">
            <Handshake className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {dialogType === 'become' ? "Join the Partner Network" : "Find a Partner"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            {dialogType === 'become' 
              ? "Submit your details and our partnership team will reach out to schedule an introduction."
              : "Let us know your requirements and we'll match you with the perfect Slate partner."}
          </DialogDescription>
        </DialogHeader>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600"/> Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-slate-50 hover:bg-white"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-600"/> Work Email</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-slate-50 hover:bg-white"
                placeholder="jane@company.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-600"/> Company Name</label>
            <input 
              required
              type="text" 
              value={formData.company_name}
              onChange={e => setFormData({...formData, company_name: e.target.value})}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-slate-50 hover:bg-white"
              placeholder="Acme Corp"
            />
          </div>

          {dialogType === 'become' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600"/> Partnership Type</label>
              <div className="relative">
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-slate-50 hover:bg-white appearance-none cursor-pointer"
                  value={formData.partner_type}
                  onChange={e => setFormData({...formData, partner_type: e.target.value})}
                >
                  <option value="Technology">Technology Partner</option>
                  <option value="Solutions">Solutions Partner</option>
                  <option value="Referral">Referral Partner</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-600"/> Message / Requirements</label>
            <textarea 
              required
              rows={4}
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-slate-50 hover:bg-white resize-none"
              placeholder={dialogType === 'become' ? "Tell us about your organization..." : "What kind of partner are you looking for?"}
            />
          </div>
          </div>
        </div>

        <div className="p-6 md:px-8 md:py-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            style={{ backgroundColor: '#059669', color: 'white' }}
            className="w-full h-12 rounded-xl text-base font-bold shadow-[0_8px_30px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(5,150,105,0.4)] hover:brightness-110"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              dialogType === 'become' ? "Submit Application" : "Find Match"
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
 </div>
 );
}
