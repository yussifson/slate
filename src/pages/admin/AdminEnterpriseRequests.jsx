import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { Building2, Mail, Users, Server, Shield, CheckCircle2, Clock, Inbox, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function AdminEnterpriseRequests() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, contacted, resolved

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('enterprise_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching requests',
        description: error.message
      });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('enterprise_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message
      });
      return;
    }

    toast({
      title: 'Status Updated',
      description: `Request marked as ${newStatus}`
    });
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setSelectedRequest(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev);
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="inline-flex items-center gap-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 tracking-[0.04em]"><Clock className="w-3 h-3" /> Pending</span>;
      case 'contacted': return <span className="inline-flex items-center gap-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 tracking-[0.04em]"><Mail className="w-3 h-3" /> Contacted</span>;
      case 'resolved': return <span className="inline-flex items-center gap-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 tracking-[0.04em]"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tracking-[-0.02em]">Enterprise Requests</h1>
          <p className="text-slate-500 font-medium mt-1">Manage incoming high-ticket leads and infrastructure requests.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['all', 'pending', 'contacted', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f 
                  ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-[0.5px] border-black/9 dark:border-white/8 border-slate-200 rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border-[0.5px] border-black/9 dark:border-white/8 border-slate-100">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No requests found</h3>
            <p className="text-slate-500 font-medium max-w-sm">There are no enterprise requests matching the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">Company</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">Contact</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">Details</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest tracking-[0.04em]">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-center tracking-[0.04em]">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right tracking-[0.04em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedRequest(r)}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{r.company_name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] tracking-[0.04em]">{r.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900 text-sm">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] tracking-[0.04em]">{r.work_email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 tracking-[0.04em]">
                        <span className="flex items-center gap-2.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {r.user_count}</span>
                        <span className="flex items-center gap-2.5"><Server className="w-3.5 h-3.5 text-slate-400" /> {r.deployment_type?.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {format(new Date(r.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="font-semibold text-primary group-hover:bg-primary/10">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-3xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedRequest && (
            <>
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight tracking-[-0.02em]">{selectedRequest.company_name}</h2>
                      <p className="text-slate-500 font-medium">{selectedRequest.industry}</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Contact Name</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Email</p>
                    <p className="text-sm font-semibold text-slate-900 truncate"><a href={`mailto:${selectedRequest.work_email}`} className="text-primary hover:underline">{selectedRequest.work_email}</a></p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Target Users</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedRequest.user_count}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 tracking-[0.04em]">Deployment</p>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                      <Server className="w-3.5 h-3.5 text-slate-400" /> {selectedRequest.deployment_type?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4 tracking-[0.04em]">Requirements</h4>
                <div className="flex flex-wrap gap-3 mb-8">
                  {selectedRequest.needs_migration && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> Data Migration
                    </div>
                  )}
                  {selectedRequest.needs_whitelabel && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> White-labeling
                    </div>
                  )}
                  {selectedRequest.needs_compliance && (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> Compliance Required
                    </div>
                  )}
                </div>

                {selectedRequest.message && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-3 tracking-[0.04em]">Additional Details</h4>
                    <div className="p-5 bg-slate-50 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                      {selectedRequest.message}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sm:justify-end">
                <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="font-semibold text-slate-600">Close</Button>
                {selectedRequest.status !== 'contacted' && (
                  <Button onClick={() => updateStatus(selectedRequest.id, 'contacted')} className="font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="w-4 h-4 mr-2" /> Mark Contacted
                  </Button>
                )}
                {selectedRequest.status !== 'resolved' && (
                  <Button onClick={() => updateStatus(selectedRequest.id, 'resolved')} className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
