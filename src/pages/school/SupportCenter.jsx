import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Search, Book, FileQuestion, PhoneCall, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function SupportCenter() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitIdea = useMutation({
    mutationFn: (ideaText) => base44.createEntity({
      company_id: companyId,
      case_type: 'school_feature_request',
      client_id: session?.user?.id,
      title: 'New Feature Idea',
      status: 'pending',
      data: { idea: ideaText, submittedAt: new Date().toISOString() }
    }),
    onSuccess: () => {
      setIsSubmitting(false);
      setSubmitted(true);
      setIdea('');
      toast.success("Your brilliant idea has been submitted!");
    }
  });

  const handleIdeaSubmit = () => {
    if (!idea.trim()) return;
    setIsSubmitting(true);
    submitIdea.mutate(idea);
  };

  return (
    <SchoolPageShell
      title="Support Center"
      subtitle="Knowledge base, FAQs, and support desks"
      breadcrumb={['School', 'Support']}
    >
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 text-white text-center shadow-sm relative overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <div className="bg-white/10 p-3 rounded-full mb-4">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 leading-tight">How can we help you today?</h1>
          <p className="text-indigo-100 text-sm md:text-base font-medium mb-6">Search our knowledge base or get in touch with support.</p>
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search guides, FAQs..." 
              className="w-full pl-10 pr-4 h-11 bg-white text-slate-900 placeholder:text-slate-400 border-none rounded-xl text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-300" 
            />
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { icon: Book, title: "Knowledge Base", desc: "Browse our comprehensive guides and tutorials.", link: "Browse Articles" },
          { icon: FileQuestion, title: "FAQs", desc: "Find quick answers to the most commonly asked questions.", link: "View FAQs" },
          { icon: PhoneCall, title: "Contact IT", desc: "Reach out directly to our 24/7 IT helpdesk team.", link: "Open Live Chat" }
        ].map((item, i) => (
          <motion.div 
            whileHover={{ y: -2 }}
            key={i} 
            className="bg-card rounded-xl border border-border/50 p-6 flex flex-col items-start hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">{item.desc}</p>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1">
              {item.link} &rarr;
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Request */}
      <div className="bg-muted/30 rounded-xl p-8 border border-border/50">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Feature Request
            </span>
            <h2 className="text-2xl font-bold mb-3 text-foreground leading-tight">Help us shape the future</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              We are constantly improving the platform. If you have an idea for a new feature that would make your life easier, let us know!
            </p>
          </div>
          <div className="w-full lg:w-[420px] bg-card p-5 rounded-xl border border-border/50 shadow-sm flex flex-col">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <h4 className="font-bold text-foreground text-sm">Thank You!</h4>
                  <p className="text-xs text-muted-foreground mt-1">We've received your suggestion and will review it soon.</p>
                  <Button variant="outline" size="sm" className="mt-4 h-8 text-xs" onClick={() => setSubmitted(false)}>Submit Another</Button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <textarea 
                    value={idea} 
                    onChange={e => setIdea(e.target.value)} 
                    placeholder="Describe your feature idea..." 
                    className="w-full h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none" 
                  />
                  <Button onClick={handleIdeaSubmit} disabled={isSubmitting || !idea.trim()} className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> {isSubmitting ? 'Sending...' : 'Send Idea'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SchoolPageShell>
  );
}
