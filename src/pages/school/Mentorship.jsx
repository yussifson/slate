import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users2, Calendar, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Mentorship() {
  const { t } = useTranslation();

  const mentors = [
    { name: 'Dr. Sarah Jenkins', role: 'Software Architect at Google', expertise: 'Computer Science, AI', rating: 4.9, avatar: 'SJ' },
    { name: 'Prof. Michael Chen', role: 'Financial Analyst', expertise: 'Economics, Business', rating: 4.8, avatar: 'MC' },
    { name: 'Emma Watson', role: 'Medical Researcher', expertise: 'Biology, Medicine', rating: 5.0, avatar: 'EW' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Users2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Mentorship Portal</h1>
            <p className="text-sm text-muted-foreground">Connect with industry professionals and alumni</p>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          Become a Mentor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentors.map((m, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                {m.avatar}
              </div>
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                <Star className="w-3 h-3 fill-current" /> {m.rating}
              </div>
            </div>
            <h3 className="text-lg font-bold text-card-foreground">{m.name}</h3>
            <p className="text-sm text-primary font-medium mb-2">{m.role}</p>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">Expertise: {m.expertise}</p>
            
            <div className="flex gap-2 mt-auto">
              <Button variant="outline" className="flex-1 gap-2 text-xs h-8"><MessageSquare className="w-3 h-3" /> Chat</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-8"><Calendar className="w-3 h-3" /> Book</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
