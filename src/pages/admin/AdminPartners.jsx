import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Handshake, CheckCircle2, XCircle, Clock, TrendingUp, BarChart } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function AdminPartners() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();

    // Set up realtime subscription
    const subscription = supabase
      .channel('partner_applications_changes')
      .on('postgres', { event: 'INSERT', schema: 'public', table: 'partner_applications' }, (payload) => {
        toast({ title: "New Partner Application", description: `From ${payload.new.company_name}` });
        setApplications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('partner_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('partner_applications').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: `Application ${status}` });
      fetchApplications();
    } catch (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'rejected': return <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default: return <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Partner Applications"
        subtitle="Review and manage partnership requests"
      />

      {/* Partnership Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Application Velocity</h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{applications.filter(a => new Date(a.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length} This Month</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Total volume of incoming partnership requests over the last 30 days.</p>
          <div className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider cursor-pointer hover:underline">View Trend Line</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><BarChart className="w-4 h-4 text-blue-500" /> Conversion Intelligence</h3>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{applications.length ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100) : 0}% Approved</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Ratio of approved vs rejected or pending partnership applications.</p>
          <div className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider">Historical Average: 34%</div>
        </div>
      </div>

      <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Handshake className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No partner applications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border border-slate-200 rounded-2xl p-5 hover:border-primary/40 transition-colors bg-white">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-900 text-lg">{app.company_name}</h4>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                        <span>{app.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <a href={`mailto:${app.email}`} className="text-primary hover:underline">{app.email}</a>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">{app.partner_type}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                          "{app.message}"
                        </p>
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                          onClick={() => updateStatus(app.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={() => updateStatus(app.id, 'approved')}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
