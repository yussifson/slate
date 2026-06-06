import React from 'react';
import { Video, Users, Calendar, Clock, PlayCircle, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OnlineLive() {
  const navigate = useNavigate();

  const sessions = [
    { id: 1, title: 'React Q&A Session', date: 'Today', time: '2:00 PM', attendees: 45, status: 'upcoming', host: 'Sarah Jenkins' },
    { id: 2, title: 'Advanced Routing Workshop', date: 'Tomorrow', time: '10:00 AM', attendees: 120, status: 'upcoming', host: 'Michael Chen' },
    { id: 3, title: 'Hooks Deep Dive', date: 'Oct 10, 2026', time: '1:00 PM', attendees: 85, status: 'completed', host: 'Sarah Jenkins' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto py-6">
      <div className="border-b border-[var(--color-border-subtle)] pb-4 flex justify-between items-end">
        <div>
          <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Live Sessions</h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Join virtual classrooms, webinars, and interactive Q&A sessions.</p>
        </div>
        <button className="px-4 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center gap-2">
          <Video className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">Upcoming & Completed</h2>
          
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center group hover:border-[var(--color-module-online)] transition-colors">
                <div className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] border border-[var(--color-border-default)]">
                  {session.status === 'upcoming' ? (
                    <Calendar className="w-8 h-8 text-[var(--color-module-online)]" />
                  ) : (
                    <PlayCircle className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {session.status === 'upcoming' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-warning-subtle)] text-[var(--color-warning)] uppercase tracking-wider border border-[var(--color-warning)]">
                        Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Completed
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">Host: {session.host}</span>
                  </div>
                  <h3 className="font-bold text-[var(--text-lg)] text-[var(--color-text-primary)] truncate">{session.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {session.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {session.attendees} Registered</span>
                  </div>
                </div>
                {session.status === 'upcoming' ? (
                  <button className="w-full sm:w-auto px-6 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity whitespace-nowrap">
                    Join Room
                  </button>
                ) : (
                  <button className="w-full sm:w-auto px-6 py-2 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors whitespace-nowrap">
                    Watch Recording
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
            <div className="bg-[var(--color-surface-1)] p-4 border-b border-[var(--color-border-subtle)]">
              <h2 className="font-bold text-[var(--color-text-primary)]">Quick Join Link</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">Share this link to invite guests to your personal meeting room.</p>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value="https://airflake.com/meet/u/john-doe" 
                  className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-l-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-secondary)] focus:outline-none"
                />
                <button className="bg-[var(--color-surface-2)] border border-l-0 border-[var(--color-border-default)] px-4 text-sm font-medium rounded-r-[var(--radius-md)] hover:bg-[var(--color-surface-3)] transition-colors text-[var(--color-text-primary)]">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
