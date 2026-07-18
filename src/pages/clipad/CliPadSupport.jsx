import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, MessageSquare, Mail, ExternalLink, HelpCircle, FileText, Settings, Send, CheckCircle } from 'lucide-react';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function CliPadSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('clipad_support_requests').insert({
        user_id: user?.id,
        user_email: user?.email,
        subject: subject.trim(),
        message: message.trim(),
        status: 'open'
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <CheckCircle className="w-16 h-16 text-emerald-500 mb-6" />
        <h1 className="text-2xl font-black mb-2">Message Sent!</h1>
        <p className="text-slate-500 dark:text-muted-foreground text-center max-w-sm mb-8">
          Thank you for reaching out. Our support team will review your request and get back to you shortly.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-slate-100 pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-16 bg-white/70 dark:bg-background/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-secondary border border-slate-200 dark:border-border shadow-sm flex items-center justify-center text-primary">
            <CliPadLogo size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">Support</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-foreground transition-all hover:-translate-y-0.5">
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Dashboard
        </button>
      </nav>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto px-6 mt-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-3">How can we help?</h1>
          <p className="text-slate-500 dark:text-muted-foreground">Send us a message and our team will assist you as soon as possible.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-card rounded-3xl p-8 border border-slate-200 dark:border-border shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-foreground mb-2">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Issue with video recording"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background border border-slate-200 dark:border-border focus:outline-none focus:border-primary/50 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-foreground mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                required
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-background border border-slate-200 dark:border-border focus:outline-none focus:border-primary/50 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !subject.trim() || !message.trim()}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-5 h-5" /> Send Message</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
