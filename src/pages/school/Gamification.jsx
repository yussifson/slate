import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Shield, Zap, Medal, Gift, BookOpen } from 'lucide-react';
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
      return myXp?.data || { total: 0, level: 1 };
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['school_student_xp_leaderboard', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_student_xp', companyId);
      return all
        .sort((a, b) => (b.data?.total || 0) - (a.data?.total || 0))
        .map(x => ({
          name: x.title && x.title !== 'Student XP' ? x.title : 'Student',
          total: x.data?.total || 0,
          clientId: x.client_id
        }))
        .slice(0, 10);
    },
    enabled: !!companyId
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
          title: user?.full_name || 'Student XP',
          status: 'active',
          data: { total: 50, level: 1 }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_student_xp', companyId] });
      toast.success("50 XP Claimed! Keep up the good work.");
    }
  });

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border shadow-sm">
            <Trophy className="w-8 h-8 text-primary dark:text-primary/70" />
          </div>
          <div>
            <h1 className="text-2xl school-heading font-extrabold tracking-tight">{user?.full_name || "Student"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary fill-primary" /> {xpData.total} Total XP • LVL {xpData.level}
            </p>
          </div>
        </div>
        
        <Button onClick={() => claimDailyXP.mutate()} className="bg-primary hover:bg-primary text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-bold rounded-xl shadow-sm transition-all">
          <Zap className="w-4 h-4 mr-2" /> Claim Daily 50 XP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Academic Scholar", desc: "Straight A's this semester", icon: BookOpen },
          { title: "Perfect Attendance", desc: "No days missed in 3 months", icon: Shield },
          { title: "Helping Hand", desc: "Tutor 5 students", icon: Gift },
          { title: "Math Wizard", desc: "Win the math olympiad", icon: Zap }
        ].map((badge, i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-sm text-center group cursor-pointer hover:border-primary/30 transition-colors duration-300">
            <div className={`w-16 h-16 mx-auto rounded-full bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 flex items-center justify-center mb-4 shadow-sm`}>
              <badge.icon className="w-8 h-8 text-primary dark:text-primary/70" />
            </div>
            <h3 className="font-bold text-lg text-card-foreground mb-1">{badge.title}</h3>
            <p className="text-sm font-medium text-muted-foreground">{badge.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-card-foreground flex items-center gap-2">
          <Medal className="text-primary w-5 h-5" /> Leaderboard
        </h3>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No leaderboard data yet.</div>
          ) : (
            leaderboard.map((student, i) => {
              const isMe = student.clientId === session?.user?.id;
              return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-lg border ${isMe ? 'bg-slate-50 dark:bg-slate-800/50 dark:bg-primary/20 dark:bg-slate-100 border-primary/20' : 'bg-background border-border'} shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-slate-100 text-primary dark:text-primary/70' : i === 1 ? 'bg-muted text-muted-foreground' : i === 2 ? 'bg-muted text-muted-foreground' : 'bg-transparent text-muted-foreground'}`}>
                      #{i + 1}
                    </div>
                    <div className="font-bold text-foreground">{isMe ? 'You' : student.name}</div>
                  </div>
                  <div className="font-bold text-primary dark:text-primary/70 dark:text-primary">{student.total} XP</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
