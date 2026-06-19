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
    <div className="space-y-8 pb-12 font-dmsans max-w-6xl mx-auto">
      <div className="bg-emerald-600 rounded-3xl p-10 md:p-14 text-white flex flex-col items-center text-center border-b-4 border-emerald-700 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
        <div className="bg-emerald-500/10 p-4 rounded-full mb-6">
          <LifeBuoy className="w-12 h-12 text-emerald-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-[-0.02em]">How can we help you today?</h1>
        <p className="text-emerald-100 text-lg md:text-xl font-medium mb-8">Search our knowledge base or get in touch with support.</p>
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-700" />
          <Input 
            placeholder="Search guides, FAQs..." 
            className="w-full pl-16 py-8 rounded-2xl bg-white border-none text-emerald-900 placeholder:text-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-300 text-xl font-medium shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          { icon: Book, title: "Knowledge Base", desc: "Browse our comprehensive guides and tutorials.", link: "Browse Articles" },
          { icon: FileQuestion, title: "FAQs", desc: "Find quick answers to the most commonly asked questions.", link: "View FAQs" },
          { icon: PhoneCall, title: "Contact IT", desc: "Reach out directly to our 24/7 IT helpdesk team.", link: "Open Live Chat" }
        ].map((item, i) => (
          <motion.div 
            whileHover={{ scale: 1.03 }}
            key={i} 
            className="bg-white rounded-3xl border-2 border-emerald-100 p-8 flex flex-col items-start cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
              <item.icon className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-900 mb-3 tracking-[-0.02em]">{item.title}</h3>
            <p className="text-emerald-600 mb-8 flex-1 font-medium text-lg leading-relaxed">{item.desc}</p>
            <div className="text-emerald-600 font-semibold hover:text-emerald-800 flex items-center text-lg uppercase tracking-wide tracking-[0.04em]">
              {item.link} &rarr;
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-emerald-50 rounded-3xl p-10 md:p-14 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 mt-12 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-200 text-emerald-800 px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-wider mb-6 tracking-[0.04em]">
              <Sparkles className="w-5 h-5" /> Have a Feature Request?
            </div>
            <h2 className="text-4xl font-extrabold mb-6 text-emerald-900 leading-tight tracking-[-0.02em]">
              Help us shape the future
            </h2>
            <p className="text-emerald-700 text-xl font-medium leading-relaxed max-w-xl">
              We are constantly improving the platform. If you have an idea for a new feature that would make your life easier, let us know!
            </p>
          </div>
          <div className="w-full lg:w-[500px]">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-2 border-emerald-200 p-10 rounded-3xl text-center flex flex-col items-center shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-emerald-900 mb-3 tracking-[-0.02em]">Idea Received!</h3>
                  <p className="text-emerald-600 mb-8 font-medium text-lg">Our product team will review it shortly.</p>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl h-12 px-8 font-semibold text-lg">
                    Submit another
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white border-2 border-emerald-200 p-8 rounded-3xl flex flex-col gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                >
                  <textarea 
                    className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl p-5 text-emerald-900 focus:outline-none focus:border-emerald-400 focus:bg-white resize-none h-40 text-lg font-medium transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
                    placeholder="I think it would be great if the system could..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                  ></textarea>
                  <Button 
                    onClick={handleIdeaSubmit}
                    disabled={isSubmitting || !idea.trim()}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-16 text-xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                  >
                    {isSubmitting ? 'Sending...' : <span className="flex items-center gap-3"><Send className="w-6 h-6"/> Submit Idea to Dev Team</span>}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
