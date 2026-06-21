import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Shield, Zap, Medal, Gift, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { motion } from 'framer-motion';

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
    <div className="space-y-8 pb-20 font-dmsans max-w-6xl mx-auto">
      <div className="bg-emerald-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-4 border-emerald-700 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-24 h-24 rounded-3xl bg-white text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center border-4 border-emerald-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <Trophy className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 tracking-[-0.02em]">{user?.full_name || "Student Leader"}</h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 bg-emerald-800/40 px-5 py-2.5 rounded-2xl">
              <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" /> 
              <span className="font-extrabold text-xl">{xpData.total} XP</span> 
              <span className="w-2 h-2 rounded-full bg-emerald-400 mx-2"></span>
              <span className="font-extrabold text-emerald-100 text-lg">LEVEL {xpData.level}</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => claimDailyXP.mutate()} 
          className="bg-white text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-2xl font-extrabold h-16 px-8 text-lg w-full md:w-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
        >
          <Zap className="w-6 h-6 mr-3 text-yellow-500 fill-yellow-500" /> Claim Daily 50 XP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Academic Scholar", desc: "Straight A's this semester", icon: BookOpen },
          { title: "Perfect Attendance", desc: "No days missed in 3 months", icon: Shield },
          { title: "Helping Hand", desc: "Tutor 5 students", icon: Gift },
          { title: "Math Wizard", desc: "Win the math olympiad", icon: Zap }
        ].map((badge, i) => (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            key={i} 
            className="bg-white rounded-3xl p-8 border-2 border-emerald-100 text-center flex flex-col items-center justify-center h-56 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
          >
            <div className={`w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6`}>
              <badge.icon className="w-10 h-10 text-[#1E3A8A] dark:text-blue-400" />
            </div>
            <h3 className="font-extrabold text-xl text-emerald-900 mb-2 leading-tight">{badge.title}</h3>
            <p className="text-md font-semibold text-emerald-500">{badge.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border-2 border-emerald-100 p-10 mt-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <h3 className="text-3xl font-extrabold mb-10 text-emerald-900 flex items-center gap-4 tracking-[-0.02em]">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Medal className="text-[#1E3A8A] dark:text-blue-400 w-8 h-8" />
          </div>
          Hall of Fame Leaderboard
        </h3>
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="text-center text-emerald-400 py-16 text-xl font-semibold bg-[#F0F4FF] dark:bg-blue-900/20 rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 border-dashed">No leaderboard data yet.</div>
          ) : (
            leaderboard.map((student, i) => {
              const isMe = student.clientId === session?.user?.id;
              return (
                <motion.div 
                  whileHover={{ x: 5 }}
                  key={i} 
                  className={`flex items-center justify-between p-6 rounded-2xl border-2 ${isMe ? 'bg-[#F0F4FF] dark:bg-blue-900/20 border-emerald-400' : 'bg-white border-emerald-100'} transition-all shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-[#F0F4FF] dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-300'}`}>
                      #{i + 1}
                    </div>
                    <div className="font-extrabold text-2xl text-emerald-900 tracking-[-0.02em]">{isMe ? 'You' : student.name}</div>
                  </div>
                  <div className="font-extrabold text-2xl text-[#1E3A8A] dark:text-blue-400 bg-emerald-100 px-6 py-2 rounded-xl tracking-[-0.02em]">{student.total} XP</div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
