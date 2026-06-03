import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Shield, Zap, Medal } from 'lucide-react';

export default function Gamification() {
  const { t } = useTranslation();

  const badges = [
    { title: 'Math Whiz', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100', desc: 'Score 95%+ in 3 math exams' },
    { title: 'Perfect Attendance', icon: Shield, color: 'text-green-500', bg: 'bg-green-100', desc: 'No absences for a full semester' },
    { title: 'Top Contributor', icon: Star, color: 'text-blue-500', bg: 'bg-blue-100', desc: 'Answer 50 questions in AI Tutor' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Achievements</h1>
            <p className="text-sm text-muted-foreground">Track your academic milestones and badges</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center gap-6">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="62.8" className="text-orange-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xl font-bold">Lvl 12</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold">Scholar Rank</h3>
            <p className="text-sm text-muted-foreground mb-2">2,450 XP / 3,000 XP</p>
            <p className="text-xs text-primary font-medium">550 XP to next rank!</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Medal className="w-5 h-5" /> Global Leaderboard</h3>
          <div className="flex items-end gap-4 mt-4">
            <div className="text-center flex-1">
              <div className="h-16 bg-white/20 rounded-t-lg mx-2 flex items-end justify-center pb-2 font-bold">#2</div>
              <p className="text-xs mt-1">Alex</p>
            </div>
            <div className="text-center flex-1">
              <div className="h-24 bg-yellow-400/90 rounded-t-lg mx-2 flex items-end justify-center pb-2 font-bold text-yellow-900">#1</div>
              <p className="text-xs mt-1 font-bold">You</p>
            </div>
            <div className="text-center flex-1">
              <div className="h-12 bg-white/20 rounded-t-lg mx-2 flex items-end justify-center pb-2 font-bold">#3</div>
              <p className="text-xs mt-1">Sarah</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mt-8 mb-4">Earned Badges</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((b, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center hover:scale-105 transition-transform cursor-pointer">
            <div className={`w-16 h-16 mx-auto rounded-full ${b.bg} ${b.color} flex items-center justify-center mb-3 shadow-inner`}>
              <b.icon className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm">{b.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
