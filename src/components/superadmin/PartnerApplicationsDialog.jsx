import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Handshake, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function PartnerApplicationsDialog({ open, onOpenChange }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchApplications();
    }
  }, [open]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.PartnerApplication.list();
      // Sort by created_at desc
      setApplications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.PartnerApplication.update(id, { status });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-3xl h-[80vh] flex flex-col">
        <div className="bg-slate-50 p-6 md:p-8 border-b border-slate-100 flex-none">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center ring-1 ring-primary/20">
                <Handshake className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Partner Applications
                </DialogTitle>
                <p className="text-slate-500 font-medium text-sm mt-1">Review and manage partnership requests</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
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
      </DialogContent>
    </Dialog>
  );
}
