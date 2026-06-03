import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, TrendingUp, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function StudentBusinesses() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [bizName, setBizName] = useState('');

  const { data: businesses = [] } = useQuery({
    queryKey: ['school_student_business', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_student_business', companyId);
      return all;
    },
    enabled: !!companyId
  });

  const registerBiz = useMutation({
    mutationFn: () => {
      if (!bizName.trim()) throw new Error("Business name required");
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_student_business',
        client_id: session?.user?.id,
        title: bizName,
        status: 'active',
        data: { revenue: 0, growth: 0 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_student_business', companyId]);
      setBizName('');
      toast.success("Venture registered successfully!");
    },
    onError: (err) => toast.error(err.message)
  });

  const myBiz = businesses.filter(b => b.client_id === session?.user?.id);
  const otherBiz = businesses.filter(b => b.client_id !== session?.user?.id);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center relative shadow-xl">
            <Store className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Student Ventures</h1>
            <p className="text-indigo-200 font-medium text-lg">Incubator, funding, and campus entrepreneurship</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Plus className="text-emerald-500" /> Start a Venture</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Venture Name</label>
                <Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Campus Tech Repairs" className="mt-1 bg-white/50 dark:bg-background/50 border-slate-200 dark:border-slate-800 rounded-xl" />
              </div>
              <Button onClick={() => registerBiz.mutate()} disabled={registerBiz.isPending} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20">
                Register Venture
              </Button>
            </div>
          </div>

          {myBiz.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-4 opacity-90">My Ventures</h3>
              <div className="space-y-4">
                {myBiz.map(b => (
                  <div key={b.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
                    <div className="font-extrabold text-xl mb-1">{b.title}</div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-400" /> {b.data?.revenue || 0}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-amber-400" /> +{b.data?.growth || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl h-full">
            <h3 className="text-2xl font-extrabold mb-6 text-slate-900 dark:text-white">Campus Startup Directory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherBiz.length === 0 && <p className="text-slate-500">No other ventures registered yet.</p>}
              {otherBiz.map(b => (
                <div key={b.id} className="bg-white dark:bg-background p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{b.title}</h4>
                  <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full w-fit">
                    <CheckCircle2 className="w-3 h-3" /> Approved Venture
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
