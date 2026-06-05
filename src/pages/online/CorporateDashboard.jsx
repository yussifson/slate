import React from 'react';
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, BookOpen, Clock, Activity, Target, Shield, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CorporateDashboard() {
  const engagementData = [
      { name: 'Mon', hours: 45 }, { name: 'Tue', hours: 52 }, { name: 'Wed', hours: 80 }, 
      { name: 'Thu', hours: 65 }, { name: 'Fri', hours: 90 }, { name: 'Sat', hours: 30 }, { name: 'Sun', hours: 25 }
  ];

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-display font-medium mb-1">Corporate Learning Hub</h1>
            <p className="text-text-secondary text-sm">TechNova Solutions Inc. • 150 Active Seats</p>
        </div>
        <div className="flex gap-4">
            <button className="orbit-btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Manage Compliance
            </button>
            <button className="orbit-btn-primary px-4 py-2 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Add Employees
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Top KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-deep border-border p-6 flex items-start gap-4">
                      <div className="p-3 bg-orbit/10 rounded-xl"><Users className="w-6 h-6 text-orbit" /></div>
                      <div>
                          <div className="text-text-secondary text-sm mb-1">Total Employees</div>
                          <div className="text-2xl font-display font-medium text-white">124</div>
                      </div>
                  </Card>
                  <Card className="bg-deep border-border p-6 flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl"><BookOpen className="w-6 h-6 text-emerald-400" /></div>
                      <div>
                          <div className="text-text-secondary text-sm mb-1">Active Courses</div>
                          <div className="text-2xl font-display font-medium text-white">342</div>
                      </div>
                  </Card>
                  <Card className="bg-deep border-border p-6 flex items-start gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="w-6 h-6 text-amber-400" /></div>
                      <div>
                          <div className="text-text-secondary text-sm mb-1">Learning Hours</div>
                          <div className="text-2xl font-display font-medium text-white">1,450</div>
                      </div>
                  </Card>
                  <Card className="bg-deep border-border p-6 flex items-start gap-4">
                      <div className="p-3 bg-pulse/10 rounded-xl"><Target className="w-6 h-6 text-pulse" /></div>
                      <div>
                          <div className="text-text-secondary text-sm mb-1">Avg Completion</div>
                          <div className="text-2xl font-display font-medium text-white">78%</div>
                      </div>
                  </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart */}
                  <Card className="lg:col-span-2 bg-deep border-border p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-display font-medium text-white flex items-center gap-2">
                              <Activity className="w-5 h-5 text-orbit" /> Team Engagement
                          </h3>
                          <select className="bg-surface border border-border text-text-secondary text-sm rounded-lg px-3 py-1 outline-none">
                              <option>This Week</option>
                              <option>Last Week</option>
                          </select>
                      </div>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={engagementData}>
                                  <defs>
                                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                                  <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                                  <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px' }}
                                      itemStyle={{ color: '#fff' }}
                                  />
                                  <Area type="monotone" dataKey="hours" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </Card>

                  {/* Top Learners */}
                  <Card className="bg-deep border-border flex flex-col">
                      <div className="p-6 border-b border-border">
                          <h3 className="text-lg font-display font-medium text-white">Top Learners</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          {[
                              { name: 'Sarah Jenkins', role: 'Frontend Eng.', hours: 45, comp: 5 },
                              { name: 'Michael Chen', role: 'Data Analyst', hours: 38, comp: 3 },
                              { name: 'Emily Davis', role: 'Product Mgr', hours: 32, comp: 4 },
                              { name: 'Alex Johnson', role: 'Backend Eng.', hours: 28, comp: 2 },
                          ].map((user, i) => (
                              <div key={i} className="flex items-center gap-4 bg-surface/50 p-3 rounded-xl border border-border">
                                  <div className="w-10 h-10 rounded-full bg-orbit/20 flex items-center justify-center text-orbit font-bold font-mono text-sm shrink-0">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-medium text-white text-sm truncate">{user.name}</div>
                                      <div className="text-xs text-text-muted">{user.role}</div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <div className="text-sm font-medium text-emerald-400">{user.hours}h</div>
                                      <div className="text-[10px] text-text-muted">{user.comp} certs</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </Card>
              </div>

              {/* Compliance & Mandatory Training */}
              <Card className="bg-deep border-border overflow-hidden">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-overlay">
                      <h3 className="text-lg font-display font-medium text-white">Mandatory Training Status</h3>
                      <button className="text-orbit hover:text-orbit-light text-sm font-medium transition-colors">View All Programs</button>
                  </div>
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-surface/50 text-xs font-medium text-text-muted">
                          <tr>
                              <th className="px-6 py-4">Program Name</th>
                              <th className="px-6 py-4">Assigned To</th>
                              <th className="px-6 py-4">Deadline</th>
                              <th className="px-6 py-4">Completion Rate</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {[
                              { prog: "Cybersecurity Awareness 2026", group: "All Employees", date: "June 30, 2026", rate: 85 },
                              { prog: "Data Privacy & GDPR", group: "Engineering", date: "July 15, 2026", rate: 42 },
                              { prog: "Leadership Fundamentals", group: "Managers", date: "August 01, 2026", rate: 90 },
                          ].map((t, i) => (
                              <tr key={i} className="hover:bg-surface/30 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-white">{t.prog}</td>
                                  <td className="px-6 py-4 text-sm text-text-secondary">{t.group}</td>
                                  <td className="px-6 py-4 text-sm text-text-secondary">{t.date}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden max-w-[150px]">
                                              <div className={`h-full ${t.rate > 80 ? 'bg-emerald-500' : t.rate > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${t.rate}%` }}></div>
                                          </div>
                                          <span className="text-xs font-mono text-text-muted">{t.rate}%</span>
                                          {t.rate === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </Card>

          </div>
      </div>
    </div>
  );
}
