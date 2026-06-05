import React from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Award, BookOpen, Layers, CheckCircle2, ShieldCheck, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UniResearchActivity() {
  const { t } = useTranslation();
  const companyId = useCompanyId();

  const { data: research = [] } = useQuery({
    queryKey: ["cases", companyId, "uni_research"],
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_research' }),
    enabled: !!companyId
  });

  const activeProjects = research.filter(r => r.status === 'Active');
  const pendingEthics = research.filter(r => r.status === 'Ethics Review');

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_research_hub", "Research Activity & Grants Hub")} 
        subtitle="Manage academic research proposals, publication indices, ethics reviews, and external grant awards." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Projects</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{activeProjects.length || 24}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publications & Journals</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">142</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Ethics Approvals</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{pendingEthics.length || 12} Pending</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grant Value YTD</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">$1.4M</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Research & Projects Directory</CardTitle>
              <CardDescription>Academic investigations, field research, and publications portfolio.</CardDescription>
            </div>
            <Button size="sm" className="gap-1 bg-primary text-white hover:bg-primary/95">
              <Plus className="w-4 h-4" /> Add Proposal
            </Button>
          </CardHeader>
          <CardContent>
            {research.length === 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Quantum Cryptography Initiatives</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Principal Investigator: Dr. Alan Turing · Department of Physics</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">Machine Learning Ethics & Fairness</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Principal Investigator: Prof. Ada Lovelace · Computer Science School</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">Ethics Review</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">Sustainable Bio-Concrete Development</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Principal Investigator: Dr. Richard Feynman · Department of Materials Engineering</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {research.map((item, i) => {
                  let info = {}; try { info = JSON.parse(item.notes); } catch(e){}
                  return (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800">{info.title || "Research Project"}</h4>
                        <p className="text-xs text-slate-500">PI: {info.investigator || "Staff"} · Category: {info.category || "General"}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-850' : 'bg-primary/10 text-primary'}`}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Ethics Approval Pipeline</CardTitle>
            <CardDescription>Ethics clearances from Institutional Review Board (IRB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-slate-800">IRB Review Meeting</h5>
                <p className="text-xs text-slate-500 mt-0.5">Scheduled for Monday at 10:00 AM. 4 applications are on the agenda.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b">
                <span className="font-semibold">Cognitive Development Analysis</span>
                <span className="text-amber-600 font-bold">In Progress</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b">
                <span className="font-semibold">Clinical Trial Phase 1</span>
                <span className="text-indigo-600 font-bold">Approved</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">Urban Heat Island Mitigation</span>
                <span className="text-rose-600 font-bold">Revisions Requested</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
