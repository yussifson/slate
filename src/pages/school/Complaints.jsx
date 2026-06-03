import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareWarning, Send, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function Complaints() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

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
      queryClient.invalidateQueries(['school_complaint_ticket', companyId]);
      setSubject('');
      setDetails('');
      toast.success("Complaint submitted securely to administration.");
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-900 to-red-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center relative shadow-xl">
            <MessageSquareWarning className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Anonymous Complaints</h1>
            <p className="text-red-200 font-medium text-lg">Securely report issues, bullying, or facility problems</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
          <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" /> File a Report</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Broken AC in Room 302" className="mt-1 bg-white/50 dark:bg-background/50 border-slate-200 dark:border-slate-800 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Details</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Please provide specific details..." className="w-full mt-1 bg-white/50 dark:bg-background/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
            </div>
            <Button onClick={() => submitTicket.mutate()} disabled={submitTicket.isPending} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 mt-2">
              <Send className="w-4 h-4 mr-2" /> Submit Securely
            </Button>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
          <h3 className="text-xl font-extrabold mb-6">My Tickets</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {tickets.length === 0 && <p className="text-slate-500 text-center py-8 font-medium">No complaints filed.</p>}
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-background p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{ticket.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{ticket.data?.description}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
