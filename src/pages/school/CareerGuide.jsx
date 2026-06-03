import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Target, TrendingUp, Award, Briefcase, BookOpen, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function CareerGuide() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [newMilestone, setNewMilestone] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: milestones = [] } = useQuery({
    queryKey: ['school_career_goal', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_career_goal', companyId);
      return all.filter(m => m.client_id === session?.user?.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const addMilestone = useMutation({
    mutationFn: () => {
      if (!newMilestone.trim()) throw new Error("Title is required");
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_career_goal',
        client_id: session?.user?.id,
        title: newMilestone,
        status: 'pending',
        data: { description: newDesc }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_career_goal', companyId]);
      setNewMilestone('');
      setNewDesc('');
      toast.success("Milestone added!");
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMilestone = useMutation({
    mutationFn: (id) => base44.deleteEntity(id),
    onSuccess: () => queryClient.invalidateQueries(['school_career_goal', companyId])
  });

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/40 dark:bg-card/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Career Guide</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Map out your future and track aptitude goals</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-purple-600/20">
          <Target className="w-4 h-4" /> Take Aptitude Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Briefcase className="w-6 h-6" /></div>
            <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recommended</p><h3 className="text-xl font-bold">Software Engineering</h3></div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: '78%'}}></div></div>
          <p className="text-xs font-bold text-slate-500 text-right">78% Match with your skills</p>
        </div>

        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600"><BookOpen className="w-6 h-6" /></div>
            <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Required</p><h3 className="text-xl font-bold">Math, Physics, CS</h3></div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2"><div className="bg-emerald-500 h-2.5 rounded-full" style={{width: '92%'}}></div></div>
          <p className="text-xs font-bold text-slate-500 text-right">92% Average Grade</p>
        </div>

        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl hover:-translate-y-1 transition-transform flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600"><Award className="w-6 h-6" /></div>
            <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Certifications</p><h3 className="text-xl font-bold">2 Completed</h3></div>
          </div>
          <Button variant="outline" className="w-full rounded-xl font-bold border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-900/20">View Certificates</Button>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-xl">
        <h3 className="text-2xl font-extrabold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-purple-500" /> My Career Milestones
        </h3>
        
        <div className="flex gap-3 mb-8 bg-white dark:bg-background p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Input 
            placeholder="New Milestone (e.g. Complete Python Course)" 
            value={newMilestone} onChange={e => setNewMilestone(e.target.value)} 
            className="border-none bg-transparent shadow-none focus-visible:ring-0"
          />
          <Input 
            placeholder="Details..." 
            value={newDesc} onChange={e => setNewDesc(e.target.value)} 
            className="border-none bg-transparent shadow-none focus-visible:ring-0 hidden sm:block"
          />
          <Button onClick={() => addMilestone.mutate()} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground shrink-0 px-6">
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-purple-500/20 before:via-slate-200 before:to-transparent dark:before:via-slate-800">
          {milestones.length === 0 && <p className="text-center text-slate-500 py-10 font-medium">No milestones yet. Set your first goal above!</p>}
          {milestones.map((m, i) => (
            <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-card bg-purple-100 text-purple-600 shadow-xl shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Target className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white dark:bg-card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow relative">
                <div className="flex items-center justify-between space-x-2 mb-2">
                  <div className="font-extrabold text-lg text-slate-900 dark:text-white">{m.title}</div>
                  <button onClick={() => deleteMilestone.mutate(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
                {m.data?.description && <div className="text-sm font-medium text-slate-500">{m.data.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
