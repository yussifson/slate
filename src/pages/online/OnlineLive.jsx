import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Video, Calendar, Users, Clock, PlayCircle, ExternalLink, MessageSquare, Mic, Camera } from 'lucide-react';

export default function OnlineLive() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const sessions = [
    { id: 1, title: "Q&A: Advanced React Patterns", course: "Advanced React Patterns", date: "Today", time: "14:00 EST", instructor: "Dan Abramov", status: "upcoming", type: "office_hours" },
    { id: 2, title: "Live Code Review: Portfolio Projects", course: "UI Design Fundamentals", date: "Tomorrow", time: "10:00 EST", instructor: "Sarah Jenkins", status: "upcoming", type: "workshop" },
    { id: 3, title: "Guest Lecture: System Design", course: "Software Engineering 101", date: "June 10", time: "15:00 EST", instructor: "Alex Xu", status: "upcoming", type: "webinar" },
    { id: 4, title: "State Management Deep Dive", course: "Advanced React Patterns", date: "June 1", time: "14:00 EST", instructor: "Dan Abramov", status: "recorded", type: "webinar" },
  ];

  const filteredSessions = sessions.filter(s => {
      if (activeTab === 'upcoming') return s.status === 'upcoming';
      if (activeTab === 'recordings') return s.status === 'recorded';
      return true;
  });

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-display font-medium mb-2 flex items-center gap-2">
                <Video className="w-6 h-6 text-pulse" /> Live Learning
            </h1>
            <p className="text-text-secondary text-sm max-w-xl">Join live webinars, office hours, and workshops. Interact with instructors and peers in real-time.</p>
        </div>
        
        <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
            <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-orbit text-orbit-light shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >Upcoming</button>
            <button 
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'recordings' ? 'bg-orbit text-orbit-light shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >Recordings</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          
          {/* Hero Session (if upcoming) */}
          {activeTab === 'upcoming' && filteredSessions.length > 0 && (
              <div className="mb-10 bg-gradient-to-r from-orbit/20 via-deep to-deep border border-orbit/30 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-orbit/20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex-1 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pulse/10 text-pulse border border-pulse/20 rounded-full text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-pulse"></span> Starting Soon
                      </div>
                      <h2 className="text-3xl font-display font-medium text-orbit-light mb-2">{filteredSessions[0].title}</h2>
                      <p className="text-text-secondary mb-6">{filteredSessions[0].course} • with {filteredSessions[0].instructor}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-8">
                          <div className="flex items-center gap-2 text-text-primary bg-surface/50 px-4 py-2 rounded-lg border border-border">
                              <Calendar className="w-4 h-4 text-orbit" /> {filteredSessions[0].date}
                          </div>
                          <div className="flex items-center gap-2 text-text-primary bg-surface/50 px-4 py-2 rounded-lg border border-border">
                              <Clock className="w-4 h-4 text-orbit" /> {filteredSessions[0].time}
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <button className="orbit-btn-primary px-6 py-3 font-medium flex items-center gap-2">
                              Join Session <ExternalLink className="w-4 h-4" />
                          </button>
                          <button className="orbit-btn-secondary px-4 py-3 flex items-center gap-2">
                              <Camera className="w-4 h-4" /> Test Setup
                          </button>
                      </div>
                  </div>
                  
                  {/* Decorative Video Placeholder */}
                  <div className="w-full md:w-[400px] aspect-video bg-void border border-border rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800')] bg-cover bg-center opacity-20 grayscale"></div>
                      <div className="relative z-10 flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-surface/80 border border-border flex items-center justify-center backdrop-blur-md">
                              <Mic className="w-5 h-5 text-text-muted" />
                          </div>
                          <div className="w-12 h-12 rounded-full bg-surface/80 border border-border flex items-center justify-center backdrop-blur-md">
                              <Camera className="w-5 h-5 text-text-muted" />
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* List Grid */}
          <h3 className="text-lg font-display font-medium text-text-secondary mb-6">
              {activeTab === 'upcoming' ? 'All Scheduled Sessions' : 'Past Recordings'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session, idx) => {
                  if (activeTab === 'upcoming' && idx === 0) return null; // Skip hero

                  return (
                      <Card key={session.id} className="bg-deep border-border hover:border-orbit/50 transition-colors group">
                          <div className="p-6 h-full flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="px-2 py-1 bg-surface border border-border rounded text-[10px] uppercase tracking-wider text-text-muted font-medium">
                                      {session.type.replace('_', ' ')}
                                  </div>
                                  {activeTab === 'recordings' && <PlayCircle className="w-5 h-5 text-text-muted group-hover:text-orbit transition-colors" />}
                              </div>
                              
                              <h4 className="font-display font-medium text-lg text-orbit-light mb-1 line-clamp-2">{session.title}</h4>
                              <p className="text-xs text-text-secondary mb-6">{session.course}</p>
                              
                              <div className="mt-auto space-y-3 border-t border-border pt-4">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-1.5 text-text-muted"><Calendar className="w-3.5 h-3.5" /> {session.date}</span>
                                      <span className="flex items-center gap-1.5 text-text-muted"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-xs text-text-secondary">Host: {session.instructor}</span>
                                      <button className="text-xs font-medium text-orbit hover:text-orbit-light transition-colors flex items-center gap-1">
                                          {activeTab === 'upcoming' ? 'RSVP' : 'Watch'} <ChevronRight className="w-3 h-3" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </Card>
                  );
              })}
              
              {filteredSessions.length === 0 && (
                  <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl bg-surface/20">
                      <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                      <p className="text-text-secondary">No {activeTab} sessions found.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
