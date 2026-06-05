import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Search, Filter, CheckCircle, Clock, AlertCircle, FileText, Download, ChevronRight } from 'lucide-react';

export default function OnlineAssessments() {
  const [activeTab, setActiveTab] = useState('pending');

  const assessments = [
    { id: 1, student: "Alex Johnson", course: "UI Design Fundamentals", module: "Color Theory Assignment", status: "pending", date: "2 Hours Ago", score: null },
    { id: 2, student: "Sarah Williams", course: "Advanced React Patterns", module: "Custom Hooks Quiz", status: "graded", date: "Yesterday", score: "92%" },
    { id: 3, student: "Michael Chen", course: "UI Design Fundamentals", module: "Typography Project", status: "pending", date: "5 Hours Ago", score: null },
    { id: 4, student: "Emily Davis", course: "Intro to Python", module: "Final Project", status: "needs_revision", date: "2 Days Ago", score: "65%" },
  ];

  const filteredAssessments = assessments.filter(a => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'completed') return a.status !== 'pending';
    return true;
  });

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0">
        <h1 className="text-2xl font-display font-medium mb-2">Assessment Center</h1>
        <p className="text-text-secondary text-sm">Review submissions, grade assignments, and track learner progress.</p>
        
        {/* Quick Stats */}
        <div className="flex gap-4 mt-6">
            <div className="bg-surface/50 border border-border px-4 py-3 rounded-lg flex items-center gap-3 w-48">
                <Clock className="w-5 h-5 text-orbit" />
                <div>
                    <div className="text-xl font-mono font-medium">12</div>
                    <div className="text-xs text-text-muted">Pending Review</div>
                </div>
            </div>
            <div className="bg-surface/50 border border-border px-4 py-3 rounded-lg flex items-center gap-3 w-48">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                    <div className="text-xl font-mono font-medium">148</div>
                    <div className="text-xs text-text-muted">Graded This Week</div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 p-8 overflow-hidden">
          
          {/* Controls */}
          <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border">
                  <button 
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-orbit text-orbit-light shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >Needs Grading</button>
                  <button 
                      onClick={() => setActiveTab('completed')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'completed' ? 'bg-orbit text-orbit-light shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >History</button>
              </div>

              <div className="flex gap-3">
                  <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" placeholder="Search students..." className="w-64 bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-orbit" />
                  </div>
                  <button className="orbit-btn-secondary px-3 py-2 flex items-center gap-2 text-sm">
                      <Filter className="w-4 h-4" /> Filter
                  </button>
              </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-deep border border-border rounded-xl">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-surface/50 text-xs font-medium text-text-muted sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                          <th className="px-6 py-4 font-mono font-normal">Student / Submission</th>
                          <th className="px-6 py-4 font-mono font-normal">Course</th>
                          <th className="px-6 py-4 font-mono font-normal">Submitted</th>
                          <th className="px-6 py-4 font-mono font-normal">Status / Score</th>
                          <th className="px-6 py-4 text-right font-mono font-normal">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {filteredAssessments.length === 0 ? (
                          <tr><td colSpan="5" className="px-6 py-12 text-center text-text-muted">No assessments found.</td></tr>
                      ) : (
                          filteredAssessments.map(a => (
                              <tr key={a.id} className="hover:bg-surface/30 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="font-medium text-sm text-orbit-light mb-1">{a.student}</div>
                                      <div className="text-xs text-text-secondary flex items-center gap-1"><FileText className="w-3 h-3"/> {a.module}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-text-secondary">{a.course}</td>
                                  <td className="px-6 py-4 text-sm text-text-muted font-mono">{a.date}</td>
                                  <td className="px-6 py-4">
                                      {a.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3 h-3" /> Pending Review</span>}
                                      {a.status === 'graded' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Graded: {a.score}</span>}
                                      {a.status === 'needs_revision' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3 h-3" /> Revision: {a.score}</span>}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button className="orbit-btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {a.status === 'pending' ? 'Grade Now' : 'View'} <ChevronRight className="w-3 h-3" />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>

      </div>
    </div>
  );
}
