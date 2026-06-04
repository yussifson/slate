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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Support Center</h1>
          <p className="text-muted-foreground mt-1 text-lg">How can we help you today?</p>
        </div>
        
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search guides, FAQs..." 
            className="w-full pl-10 py-5 rounded-xl bg-background border-border shadow-sm text-foreground focus-visible:ring-emerald-500" 
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-emerald-300 transition-colors cursor-pointer group flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#F0F4FF] dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-300 flex items-center justify-center mb-6">
            <Book className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-card-foreground mb-2">Knowledge Base</h3>
          <p className="text-muted-foreground text-sm flex-1 mb-6">Browse our comprehensive guides and tutorials on how to use the platform effectively.</p>
          <div className="text-[#1E3A8A] dark:text-blue-400 font-bold text-sm group-hover:underline flex items-center">
            Browse Articles &rarr;
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-emerald-300 transition-colors cursor-pointer group flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#F0F4FF] dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-300 flex items-center justify-center mb-6">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-card-foreground mb-2">FAQs</h3>
          <p className="text-muted-foreground text-sm flex-1 mb-6">Find quick answers to the most commonly asked questions by students and staff.</p>
          <div className="text-[#1E3A8A] dark:text-blue-400 font-bold text-sm group-hover:underline flex items-center">
            View FAQs &rarr;
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:border-emerald-300 transition-colors cursor-pointer group flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#F0F4FF] dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-300 flex items-center justify-center mb-6">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-card-foreground mb-2">Contact IT</h3>
          <p className="text-muted-foreground text-sm flex-1 mb-6">Can't find what you're looking for? Reach out directly to our 24/7 IT helpdesk team.</p>
          <div className="text-[#1E3A8A] dark:text-blue-400 font-bold text-sm group-hover:underline flex items-center">
            Open Live Chat &rarr;
          </div>
        </div>
      </div>

      {/* Idea Submission Section */}
      <div className="mx-4 mt-8 bg-card rounded-xl p-8 md:p-10 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#F0F4FF] dark:bg-blue-900/20 border border-emerald-100 text-[#1E3A8A] dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" /> Have a Feature Request?
            </div>
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">
              Help us shape the future
            </h2>
            <p className="text-muted-foreground text-sm">
              We are constantly improving the platform. If you have an idea for a new feature that would make your life easier, let us know! We read every submission.
            </p>
          </div>
          <div className="w-full md:w-[450px]">
            {submitted ? (
              <div className="bg-background border border-border p-6 rounded-xl text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-[#F0F4FF] dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Idea Received!</h3>
                <p className="text-muted-foreground text-sm">Thank you for your contribution. Our product team will review it shortly.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">
                  Submit another
                </Button>
              </div>
            ) : (
              <div className="bg-background border border-border p-6 rounded-xl shadow-sm flex flex-col gap-4">
                <textarea 
                  className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-28 text-sm"
                  placeholder="I think it would be great if the system could..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                ></textarea>
                <Button 
                  onClick={handleIdeaSubmit}
                  disabled={isSubmitting || !idea.trim()}
                  className="w-full rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-bold h-10 shadow-sm transition-all"
                >
                  {isSubmitting ? 'Sending...' : <span className="flex items-center gap-2 text-sm"><Send className="w-3 h-3"/> Submit Idea to Dev Team</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
