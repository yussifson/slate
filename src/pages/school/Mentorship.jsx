import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, Video, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function Mentorship() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['school_mentor_booking', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_mentor_booking', companyId);
      return all.filter(b => b.client_id === session?.user?.id);
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const bookMentor = useMutation({
    mutationFn: (mentorName) => {
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_mentor_booking',
        client_id: session?.user?.id,
        title: `Meeting with ${mentorName}`,
        status: 'scheduled',
        data: { mentor: mentorName, date: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_mentor_booking', companyId]);
      toast.success("Meeting scheduled! Check your calendar.");
    }
  });

  const mentors = [
    { name: 'Dr. Alan Turing', role: 'Computer Science', rating: 4.9, img: 'https://i.pravatar.cc/150?u=1' },
    { name: 'Prof. Marie Curie', role: 'Physics & Chemistry', rating: 5.0, img: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Dr. John Nash', role: 'Advanced Mathematics', rating: 4.8, img: 'https://i.pravatar.cc/150?u=3' }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center relative shadow-xl">
              <Users className="w-10 h-10 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Mentorship Portal</h1>
              <p className="text-blue-200 font-medium text-lg">Connect with alumni and faculty experts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((m, i) => (
          <div key={i} className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/20 shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
            <img src={m.img} alt={m.name} className="w-24 h-24 rounded-full border-4 border-white dark:border-card shadow-lg mb-4" />
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">{m.name}</h3>
            <p className="text-sm font-bold text-blue-600 mb-3">{m.role}</p>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm mb-6 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 fill-amber-500" /> {m.rating}
            </div>
            <Button onClick={() => bookMentor.mutate(m.name)} disabled={bookMentor.isPending} className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold shadow-lg shadow-slate-900/20">
              <Calendar className="w-4 h-4 mr-2" /> Book Session
            </Button>
          </div>
        ))}
      </div>

      {bookings.length > 0 && (
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
          <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            <Video className="text-blue-500 w-6 h-6" /> Upcoming Sessions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center gap-4 bg-white dark:bg-background p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                  <div className="text-sm text-slate-500">Video Call • {new Date(b.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
