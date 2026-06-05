import React from 'react';
import { Card } from "@/components/ui/card";
import { BookOpen, Trophy, Clock, PlayCircle } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      <div className="px-8 py-10 bg-overlay border-b border-border relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orbit/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-3xl font-display font-medium text-white mb-2 relative z-10">Welcome back, Alex!</h1>
          <p className="text-text-secondary relative z-10">You're making great progress. Keep it up!</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-6xl mx-auto space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-deep border-border p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orbit/20 flex items-center justify-center text-orbit"><BookOpen className="w-6 h-6"/></div>
                      <div>
                          <div className="text-2xl font-display font-medium text-white">4</div>
                          <div className="text-sm text-text-secondary">Active Courses</div>
                      </div>
                  </Card>
                  <Card className="bg-deep border-border p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Trophy className="w-6 h-6"/></div>
                      <div>
                          <div className="text-2xl font-display font-medium text-white">12</div>
                          <div className="text-sm text-text-secondary">Certificates</div>
                      </div>
                  </Card>
                  <Card className="bg-deep border-border p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400"><Clock className="w-6 h-6"/></div>
                      <div>
                          <div className="text-2xl font-display font-medium text-white">142h</div>
                          <div className="text-sm text-text-secondary">Learning Time</div>
                      </div>
                  </Card>
              </div>

              <div>
                  <h2 className="text-xl font-display font-medium text-white mb-6">Continue Learning</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-deep border-border hover:border-orbit/50 transition-colors p-6 flex gap-6 items-center cursor-pointer group">
                          <div className="w-32 h-24 rounded-lg bg-surface border border-border relative overflow-hidden shrink-0">
                              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400')] bg-cover bg-center opacity-50"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <PlayCircle className="w-8 h-8 text-white opacity-80 group-hover:scale-110 transition-transform" />
                              </div>
                          </div>
                          <div className="flex-1">
                              <h3 className="font-display font-medium text-lg text-white mb-1">Advanced React Patterns</h3>
                              <p className="text-sm text-text-secondary mb-4">Module 4: Custom Hooks</p>
                              <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                      <div className="h-full bg-orbit w-[65%]"></div>
                                  </div>
                                  <span className="text-xs font-mono text-text-muted">65%</span>
                              </div>
                          </div>
                      </Card>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}
