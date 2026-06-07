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
      queryClient.invalidateQueries({ queryKey: ['school_complaint_ticket', companyId] });
      setSubject('');
      setDetails('');
      toast.success("Complaint submitted securely to administration.");
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">Anonymous Complaints</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Securely report issues, bullying, or facility problems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-primary" /> File a Report</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Broken AC in Room 302" className="mt-1 bg-background border-border rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Details</label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Please provide specific details..." className="w-full mt-1 bg-background border border-border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
            </div>
            <Button onClick={() => submitTicket.mutate()} disabled={submitTicket.isPending} className="w-full h-12 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-bold mt-2 shadow-sm">
              <Send className="w-4 h-4 mr-2" /> Submit Securely
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">My Tickets</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {tickets.length === 0 && <p className="text-muted-foreground text-center py-8 font-medium">No complaints filed.</p>}
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-background p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-foreground line-clamp-1">{ticket.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-[#1E3A8A] dark:text-primary/70'}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.data?.description}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
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
