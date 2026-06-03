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
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-6 py-20 text-center shadow-2xl">
        {/* Background Visuals */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner">
            <LifeBuoy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 drop-shadow-md">
            How can we help you?
          </h1>
          
          <div className="relative w-full max-w-2xl mt-4 transform hover:scale-[1.02] transition-transform duration-300">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Input 
              placeholder="Search for guides, FAQs, or support articles..." 
              className="w-full pl-16 py-8 rounded-full text-lg bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50 focus-visible:border-white shadow-2xl" 
            />
            <Button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-12 px-8 bg-white text-indigo-900 hover:bg-slate-100 font-bold shadow-lg">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Book className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Knowledge Base</h3>
          <p className="text-slate-500 leading-relaxed mb-6">Browse our comprehensive guides and tutorials on how to use the platform effectively.</p>
          <div className="flex items-center text-blue-600 font-bold group-hover:underline">
            Browse Articles <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>

        <div className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">FAQs</h3>
          <p className="text-slate-500 leading-relaxed mb-6">Find quick answers to the most commonly asked questions by students and staff.</p>
          <div className="flex items-center text-amber-600 font-bold group-hover:underline">
            View FAQs <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>

        <div className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Contact IT</h3>
          <p className="text-slate-500 leading-relaxed mb-6">Can't find what you're looking for? Reach out directly to our 24/7 IT helpdesk team.</p>
          <div className="flex items-center text-emerald-600 font-bold group-hover:underline">
            Open Live Chat <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </div>
      </div>

      {/* Idea Submission Section */}
      <div className="mx-4 mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Have a Feature Request?
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Help us shape the future
            </h2>
            <p className="text-slate-400 text-lg">
              We are constantly improving the platform. If you have an idea for a new feature that would make your life easier, let us know! We read every submission.
            </p>
          </div>
          <div className="w-full md:w-[450px]">
            {submitted ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Idea Received!</h3>
                <p className="text-slate-400">Thank you for your contribution. Our product team will review it shortly.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6 bg-transparent border-white/20 hover:bg-white/10 text-white">
                  Submit another
                </Button>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl flex flex-col gap-4">
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32"
                  placeholder="I think it would be great if the system could..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                ></textarea>
                <Button 
                  onClick={handleIdeaSubmit}
                  disabled={isSubmitting || !idea.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold h-12 shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  {isSubmitting ? 'Sending...' : <span className="flex items-center gap-2"><Send className="w-4 h-4"/> Submit Idea to Dev Team</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
