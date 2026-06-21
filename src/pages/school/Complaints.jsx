import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareWarning, Send, AlertCircle, Clock, Inbox, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';

export default function Complaints() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ['school_complaint_ticket', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_complaint_ticket', companyId);
      return all.filter(t => t.client_id === session?.user?.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const submitTicket = useMutation({
    mutationFn: () => {
      if (!subject.trim() || !details.trim()) throw new Error("Subject and details required");
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_complaint_ticket',
        client_id: session?.user?.id,
        title: subject,
        status: 'pending',
        data: { description: details, severity: 'normal' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_complaint_ticket', companyId] });
      setSubject('');
      setDetails('');
      setIsComposing(false);
      toast.success("Complaint submitted securely to administration.");
    },
    onError: (err) => toast.error(err.message)
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col font-dmsans bg-[#F0F4FF] dark:bg-blue-900/20 rounded-3xl overflow-hidden border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 max-w-7xl mx-auto">
      <div className="bg-emerald-600 text-white p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight tracking-[-0.02em]">Anonymous Complaints</h1>
            <p className="text-emerald-100 mt-1 font-medium">Securely report issues, bullying, or facility problems directly to administration.</p>
          </div>
        </div>
        <Button 
          onClick={() => { setSelectedTicketId(null); setIsComposing(true); }} 
          className="bg-emerald-500/10 hover:bg-emerald-400 text-white border-[0.5px] border-black/9 dark:border-white/8 border-emerald-400 rounded-xl px-6 h-12 text-lg font-semibold transition-all"
        >
          <AlertCircle className="w-5 h-5 mr-2" /> File a Report
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-1/3 bg-white border-r border-emerald-100 flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-6 border-b border-emerald-100 bg-[#F0F4FF] dark:bg-blue-900/20/50">
            <h3 className="font-extrabold text-emerald-900 text-xl">My Tickets</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {tickets.length === 0 ? (
              <div className="p-10 text-center text-emerald-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold text-lg">No complaints filed</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={ticket.id} 
                  onClick={() => { setSelectedTicketId(ticket.id); setIsComposing(false); }}
                  className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${selectedTicketId === ticket.id ? 'bg-[#F0F4FF] dark:bg-blue-900/20 border-emerald-400' : 'bg-white border-emerald-100 hover:bg-[#F0F4FF] dark:bg-blue-900/20'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-emerald-900 line-clamp-1 flex-1 pr-2 text-lg">{ticket.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${ticket.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-[#1E3A8A] dark:text-blue-400'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1E3A8A] dark:text-blue-400 line-clamp-2 mt-1">{ticket.data?.description}</p>
                  <div className="flex items-center gap-2.5 mt-4 text-xs font-semibold text-emerald-500 tracking-[0.04em]">
                    <Clock className="w-3.5 h-3.5" /> {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-[#F0F4FF] dark:bg-blue-900/20 p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {isComposing ? (
              <motion.div 
                key="compose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 p-10 max-w-3xl mx-auto w-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <h2 className="text-3xl font-extrabold text-emerald-900 mb-8 flex items-center gap-3 tracking-[-0.02em]">
                  <AlertCircle className="w-8 h-8 text-[#1E3A8A] dark:text-blue-400" /> New Report
                </h2>
                <div className="space-y-6 school-page-enter font-dmsans">
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Subject</label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Broken AC in Room 302" className="mt-2 border-emerald-200 focus-visible:ring-emerald-500 rounded-xl h-12 text-lg bg-[#F0F4FF] dark:bg-blue-900/20/50" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Details</label>
                    <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Please provide specific details..." className="w-full mt-2 bg-[#F0F4FF] dark:bg-blue-900/20/50 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 rounded-xl p-4 h-64 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900 text-lg"></textarea>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setIsComposing(false)} className="flex-1 border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl h-14 text-lg font-semibold">Cancel</Button>
                    <Button onClick={() => submitTicket.mutate()} disabled={submitTicket.isPending} className="flex-1 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-xl h-14 text-lg font-semibold">
                      <Send className="w-5 h-5 mr-2" /> {submitTicket.isPending ? 'Sending...' : 'Submit Securely'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : selectedTicket ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 p-10 max-w-3xl mx-auto w-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <div className="mb-8 border-b border-emerald-100 pb-8">
                  <h2 className="text-4xl font-extrabold text-emerald-900 mb-6 leading-tight tracking-[-0.02em]">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider ${selectedTicket.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-[#1E3A8A] dark:text-blue-400'}`}>
                      Status: {selectedTicket.status}
                    </span>
                    <span className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Reported on {new Date(selectedTicket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="prose prose-emerald prose-lg max-w-none">
                  <p className="text-emerald-800 whitespace-pre-wrap leading-relaxed font-medium bg-[#F0F4FF] dark:bg-blue-900/20 p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100">{selectedTicket.data?.description}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-emerald-400">
                <div className="bg-emerald-100 p-8 rounded-full mb-6">
                  <MessageSquareWarning className="w-20 h-20 text-emerald-500" />
                </div>
                <p className="text-2xl font-extrabold text-[#1E3A8A] dark:text-blue-400 tracking-[-0.02em]">Select a ticket to view details</p>
                <p className="text-emerald-500 font-medium mt-2">All reports are strictly confidential.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
