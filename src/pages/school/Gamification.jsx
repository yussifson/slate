import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Shield, Zap, Medal, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function Gamification() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: xpData = { total: 0, level: 1 } } = useQuery({
    queryKey: ['school_student_xp', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_student_xp', companyId);
      const myXp = all.find(x => x.client_id === session?.user?.id);
      return myXp?.data || { total: 1250, level: 12 }; // default mock if none
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const claimDailyXP = useMutation({
    mutationFn: async () => {
      const all = await base44.getEntities('school_student_xp', companyId);
      let myXp = all.find(x => x.client_id === session?.user?.id);
      if (myXp) {
        return base44.updateEntity(myXp.id, {
          data: { ...myXp.data, total: (myXp.data.total || 0) + 50 }
        });
      } else {
        return base44.createEntity({
          company_id: companyId,
          case_type: 'school_student_xp',
          client_id: session?.user?.id,
          title: 'Student XP',
          status: 'active',
          data: { total: 50, level: 1 }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_student_xp', companyId]);
      toast.success("50 XP Claimed! Keep up the good work.");
    }
  });

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-sm border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-6 flex-col md:flex-row">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center relative shadow-[0_0_40px_rgba(250,204,21,0.3)]">
              <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-md" />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-indigo-900">
                LVL {xpData.level}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">{user?.full_name || "Student"}</h1>
              <p className="text-indigo-200 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> {xpData.total} Total XP
              </p>
            </div>
          </div>
          
          <Button onClick={() => claimDailyXP.mutate()} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-indigo-950 font-black rounded-2xl px-8 h-14 shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_40px_rgba(250,204,21,0.6)] hover:-translate-y-1 transition-all">
            <Zap className="w-5 h-5 mr-2" /> Claim Daily 50 XP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Academic Scholar", desc: "Straight A's this semester", icon: BookOpen, color: "from-blue-400 to-indigo-500" },
          { title: "Perfect Attendance", desc: "No days missed in 3 months", icon: Shield, color: "from-emerald-400 to-green-500" },
          { title: "Helping Hand", desc: "Tutor 5 students", icon: Gift, color: "from-pink-400 to-rose-500" },
          { title: "Math Wizard", desc: "Win the math olympiad", icon: Zap, color: "from-amber-400 to-orange-500" }
        ].map((badge, i) => (
          <div key={i} className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-sm text-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <badge.icon className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">{badge.title}</h3>
            <p className="text-sm font-medium text-slate-500">{badge.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-sm">
        <h3 className="text-2xl font-extrabold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <Medal className="text-yellow-500 w-8 h-8" /> Leaderboard
        </h3>
        <div className="space-y-3">
          {['Sarah Jenkins', 'Michael Chen', 'David Okonkwo', user?.full_name || 'You', 'Emma Watson'].map((name, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${i === 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white/50 dark:bg-card/50 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-slate-400'}`}>
                  #{i + 1}
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{name}</div>
              </div>
              <div className="font-black text-emerald-600 dark:text-emerald-400">{2000 - (i * 150)} XP</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
