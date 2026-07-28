import React, { useState } from 'react';
import { HelpCircle, FileText, MessageCircle, PhoneCall, BookOpen, ExternalLink, Search } from 'lucide-react';
import ChatSupportPanel from '@/components/auth/ChatSupportPanel';
import PhoneSupportPanel from '@/components/auth/PhoneSupportPanel';
import { useNavigate } from 'react-router-dom';

export default function AccountHelp() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenChat = () => {
    setIsPhoneOpen(false);
    setIsChatOpen(true);
  };

  const handleOpenPhone = () => {
    setIsChatOpen(false);
    setIsPhoneOpen(true);
  };

  return (
    <div className="flex relative w-full h-[calc(100vh-40px)] overflow-hidden bg-transparent">
      {/* Main Content Area */}
      <div className={`animate-in fade-in duration-300 flex-1 h-full overflow-y-auto transition-all duration-300 ease-in-out pb-20 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Premium Header Card */}
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden mt-4">
            <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="inline-flex items-center justify-center p-3 h-12 w-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-4 border border-blue-100 dark:border-blue-900/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Customer Support
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] font-medium leading-relaxed max-w-xl mt-2 mb-6">
              Search the knowledge directory or request direct assistance from the support team.
            </p>
            
            {/* Search Bar - Stylized */}
            <div className="w-full max-w-lg relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-secondary text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow text-sm" 
                placeholder="Search support database..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Help Topics */}
            <div onClick={() => navigate('/docs')} className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 border border-purple-100 dark:border-purple-900/20">
                <FileText className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Documentation</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6">
                Detailed guides and API references for Optavel Slate, Preloom, and other connected integrations.
              </p>
              <div className="text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-auto">
                Browse Docs <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>

            <div onClick={() => navigate('/tutorials')} className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6 border border-orange-100 dark:border-orange-900/20">
                <BookOpen className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Tutorials &amp; Guides</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6">
                Step-by-step video tutorials and quick start guides to help you configure your workflows.
              </p>
              <div className="text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-auto">
                View Tutorials <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Contact Support */}
            <div onClick={handleOpenChat} className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-900/20">
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Chat Support</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6">
                Get instant help from our AI agent or open a direct support ticket.
              </p>
              <div className="text-primary text-xs font-bold uppercase tracking-wider mt-auto">
                Start Chat
              </div>
            </div>

            <div onClick={handleOpenPhone} className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[30%] bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-900/20">
                <PhoneCall className="w-5 h-5" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">Phone Support</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-[13px] leading-relaxed mb-6">
                Schedule a direct diagnostic call with our engineering and systems architecture team.
              </p>
              <div className="text-primary text-xs font-bold uppercase tracking-wider mt-auto">
                Schedule Call
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Embedded Right Panels */}
      <ChatSupportPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <PhoneSupportPanel isOpen={isPhoneOpen} onClose={() => setIsPhoneOpen(false)} />
    </div>
  );
}
